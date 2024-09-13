import {
  BarController,
  ChartOptions,
  Filler,
  LineController,
  TimeSeriesScale,
  TooltipItem,
} from "chart.js";
import { TimeRange } from "../../api/thingsboard-api";
import {
  determineMaxTickLimit,
  getTimeUnit,
  useChartStyles,
} from "./chart-utils";

import { format } from "date-fns-tz";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  TimeScale,
  Title,
  Tooltip,
} from "chart.js";
import { useViewport } from "../../ViewportContext";

import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  TimeScale,
  TimeSeriesScale,
  Title,
  Tooltip,
  Legend,
  LineController,
  BarController,
  Filler
);

export function getCommonChartOptions(timeRange: TimeRange): ChartOptions<any> {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const chartStyles = useChartStyles();

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const viewport = useViewport();

  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: viewport.isMobile ? 35 : 60,
        right: 15,
      },
    },
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: chartStyles.textColor,
        },
      },
      tooltip: {
        enabled: viewport.showChartTooltips,
        mode: viewport.isMobile ? "nearest" : "index",
        intersect: !viewport.isMobile,
        axis: "x",
        callbacks: {
          title: (tooltipItems: TooltipItem<any>[]) =>
            format(
              new Date(tooltipItems[0].parsed.x),
              "dd.MM.yyyy HH:mm 'Uhr'",
              {
                timeZone: "Europe/Zurich",
              }
            ),
          label: function (tooltipItem: TooltipItem<any>) {
            return `${
              tooltipItem.dataset.label
            }: ${tooltipItem.parsed.y.toFixed(0)}${tooltipItem.dataset.unit}`;
          },
        },
      },
    },
    events: ["mousemove", "mouseout", "click"],
    interaction: {
      mode: viewport.isMobile ? "nearest" : "index",
      axis: "x",
      intersect: !viewport.isMobile,
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 5,
        hitRadius: viewport.isMobile ? 15 : 5,
        borderWidth: 0,
      },
      line: {
        tension: 0.3,
      },
    },
    scales: {
      x: {
        type: "timeseries",
        time: {
          unit: getTimeUnit(timeRange),
          displayFormats: {
            millisecond: "HH:mm:ss.SSS",
            second: "HH:mm:ss",
            minute: "HH:mm",
            hour: "HH:mm",
            day: "dd.MM",
            week: "dd.MM",
            month: "MM.yyyy",
            quarter: "MM.yyyy",
            year: "yyyy",
          },
        },
        ticks: {
          color: chartStyles.textColor,
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: determineMaxTickLimit(timeRange),
          font: {
            size: 10,
          },
        },
        grid: {
          color: chartStyles.gridColor,
          drawOnChartArea: false,
        },
      },
      y0: {
        ticks: {
          color: chartStyles.textColor,
          font: {
            size: 10,
          },
        },
        grid: {
          color: chartStyles.gridColor,
        },
      },
      y1: {
        ticks: {
          color: `${chartStyles.textColor}50`,
          font: {
            size: 10,
          },
        },
        grid: {
          color: `${chartStyles.gridColor}50`,
        },
      },
    },
  };
}
