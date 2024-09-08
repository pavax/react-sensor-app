import { ChartOptions, TimeSeriesScale, Chart } from "chart.js";
import { TimeRange } from "../../api/thingsboard-api";
import {
  determineMaxTickLimit,
  getTimeUnit,
  useChartStyles,
} from "./chart-utils";
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
  Legend
);

export function createAutoHideTooltipPlugin() {
  let autoHideTimeoutRef: number | null = null;
  const AUTO_HIDE_AFTER_TIME = 3_000;
  let chart: Chart | null = null;

  const handleTouchMove = () => {
    if (chart) {
      chart.tooltip?.setActiveElements([], { x: 0, y: 0 });
      chart.setActiveElements([]);
      chart.update();
    }
  };

  document.addEventListener('touchmove', handleTouchMove, { passive: true });

  return {
    id: "hideTooltipAfter5Seconds",
    beforeInit(chartInstance: Chart) {
      chart = chartInstance;
    },
    beforeEvent(_: Chart, args: { event: { type: string } }) {
      if (args.event.type === "mouseout") {
        if (autoHideTimeoutRef !== null) {
          clearTimeout(autoHideTimeoutRef);
          autoHideTimeoutRef = null;
        }
      }
    },
    afterTooltipDraw: (chartInstance: Chart) => {
      if (autoHideTimeoutRef !== null) {
        clearTimeout(autoHideTimeoutRef);
      }
      autoHideTimeoutRef = window.setTimeout(() => {
        chartInstance.tooltip?.setActiveElements([], { x: 0, y: 0 });
        chartInstance.setActiveElements([]);
        chartInstance.update();
        autoHideTimeoutRef = null;
      }, AUTO_HIDE_AFTER_TIME);
    },
    destroy() {
      document.removeEventListener('touchmove', handleTouchMove);
    }
  };
}

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
        enabled: viewPort.showChartTooltips,
        mode: viewPort.isMobile ? "nearest" : "index",
        intersect: !viewPort.isMobile,
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
        },
      },
    },
    events: ["mousemove", "mouseout", "click", "touchstart", "touchmove"],
    interaction: {
      mode: viewPort.isMobile ? "nearest" : "index",
      axis: "x",
      intersect: !viewPort.isMobile,
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 5,
        hitRadius: viewPort.isMobile ? 15 : 5,
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
    },
  };
}
