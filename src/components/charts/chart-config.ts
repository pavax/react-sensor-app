import { ChartOptions, TimeSeriesScale } from "chart.js";
import { TimeRange } from "../../api/thingsboard-api";
import { getTimeUnit, useChartStyles } from "./chart-utils";
import { TooltipItem } from "chart.js";

import { format } from "date-fns-tz";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import { useViewport } from "../../ViewportContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeSeriesScale,
  PointElement,
  LineElement,
  BarElement,
  TimeScale,
  Title,
  Tooltip,
  Legend,
);

export function getCommonChartOptions(timeRange: TimeRange): ChartOptions<any> {

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const chartStyles = useChartStyles();

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const viewPort = useViewport();

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: chartStyles.textColor,
        },
      },
      tooltip: {
        enabled: true,
        mode: viewPort.isMobile ? "nearest" : "index",
        intersect: !viewPort.isMobile,
        axis: "x",
        callbacks: {
          title: (tooltipItems: TooltipItem<any>[]) =>
            format(new Date(tooltipItems[0].parsed.x), "dd.MM.yyyy HH:mm 'Uhr'", {
              timeZone: "Europe/Zurich",
            }),
        },
      },
    },
    events: ["mousemove", "mouseout", "click", "touchstart", "touchmove"],
    interaction: {
      mode: viewPort.isMobile ? "nearest" : "index",
      axis: "x",
      intersect: !viewPort.isMobile,
    },
    scales: {
      x: {
        type: "timeseries",
        time: {
          unit: getTimeUnit(timeRange),
          displayFormats: {
            millisecond: 'HH:mm:ss.SSS',
            second: 'HH:mm:ss',
            minute: 'HH:mm',
            hour: 'HH:mm',
            day: 'dd.MM HH:mm',
            week: 'dd.MM',
            month: 'MM.yyyy',
            quarter: 'MM.yyyy',
            year: 'yyyy',
          },
        },
        ticks: {
          color: chartStyles.textColor,
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 32,
          font: {
            size: 8,
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
            size: 8,
          },
        },
        grid: {
          color: chartStyles.gridColor,
        },
      },
    },
  };
}
