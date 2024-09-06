import { ChartOptions } from "chart.js";
import { TimeRange } from "../../api/thingsboard-api";
import { getTimeUnit, useChartStyles } from "./chart-utils";
import { TooltipItem } from 'chart.js';

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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

export function getCommonChartOptions(timeRange: TimeRange): ChartOptions<any> {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const chartStyles = useChartStyles();
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
        mode: 'index',
        intersect: true,
        //position: 'nearest',
        callbacks: {
          title: (tooltipItems: TooltipItem<any>[]) =>
            format(new Date(tooltipItems[0].parsed.x), "dd.MM.yyyy HH:mm", {
              timeZone: "Europe/Zurich",
            }),
        },
      },
    },
    events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove', 'touchend'],
    scales: {
      x: {
        type: "time",
        time: {
          unit: getTimeUnit(timeRange),
          displayFormats: {
            hour: "HH:mm",
            day: "dd.MM",
            week: "dd.MM",
          },
        },
        ticks: {
          color: chartStyles.textColor,
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
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