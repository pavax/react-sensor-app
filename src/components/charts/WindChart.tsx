import {
  CategoryScale,
  ChartData,
  Chart as ChartJS,
  ChartOptions,
  ChartType,
  CoreScaleOptions,
  Legend,
  LinearScale,
  LineElement,
  Plugin,
  PointElement,
  Scale,
  TimeScale,
  Title,
  Tooltip,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { format } from "date-fns-tz";
import React from "react";
import { Line } from "react-chartjs-2";
import { ProcessedData } from "../../api/data-processing";
import { TimeRange } from "../../api/thingsboard-api";
import { useViewport } from "../../ViewportContext";
import { formatAsNumber, getTimeUnit, useChartStyles } from "./chart-utils";
import { getCommonChartOptions } from "./common-chart-config";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

declare module "chart.js" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface PluginOptionsByType<TType extends ChartType> {
    windDirection?: {
      windDirectionData: number[];
      darkMode: boolean;
      isMobile: boolean;
    };
  }
}

export const WIND_DIRECTION_LABELS = [
  "N",
  "NE",
  "E",
  "SE",
  "S",
  "SW",
  "W",
  "NW",
];

interface WindChartProps {
  data: ProcessedData;
  timeRange: TimeRange;
  theme: "light" | "dark";
}

const WindChart: React.FC<WindChartProps> = ({ data, timeRange, theme }) => {
  const viewport = useViewport();
  const commonOptions = getCommonChartOptions(timeRange, theme);

  const options: ChartOptions<"line"> = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      y0: {
        type: "linear",
        position: "left",
        ticks: {
          ...commonOptions.scales?.y?.ticks,
          callback: (value) => `${Number(value).toFixed(0)} m/s`,
        },
      },
    },
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        ...commonOptions.plugins?.tooltip,
        callbacks: {
          title: (tooltipItems) =>
            format(new Date(tooltipItems[0].parsed.x), "dd.MM.yyyy HH:mm", {
              timeZone: "Europe/Zurich",
            }),
          label: (context) => {
            const windSpeed = formatAsNumber(context.parsed.y);
            const direction = getWindDirectionLabel(context.dataIndex, data);
            return `Geschwindigkeit: ${windSpeed} m/s Richtung: ${direction}`;
          },
        },
      },
      windDirection: {
        windDirectionData: data.entries.windDirection.values,
        darkMode: theme === "dark",
        isMobile: !viewport.isDesktop,
      },
    },
    layout: {
      padding: {
        top: viewport.isMobile ? 35 : 60,
        right: 15,
      },
    },
  };

  const chartData: ChartData<"line"> = {
    labels: data.timestamps,
    datasets: [
      {
        label: "Wind Speed",
        data: data.entries.windVoltageMax?.values ?? [],
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        yAxisID: "y0",
        stepped: "middle",
      },
    ],
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Line
        options={options}
        data={chartData}
        plugins={[createWindDirectionPlugin()]}
      />
    </div>
  );
};

// Helper functions
function getWindDirectionLabel(index: number, data: ProcessedData): string {
  const windDirectionData = data.entries.windDirection?.values ?? [];
  if (!windDirectionData) return "Unknown";
  const directionIndex = Math.round(windDirectionData[index] ?? 0) - 1;
  return WIND_DIRECTION_LABELS[directionIndex] || "Unknown";
}

function createWindDirectionPlugin(): Plugin {
  return {
    id: "windDirection",
    afterDatasetsDraw: (
      chart,
      _,
      pluginOptions: {
        windDirectionData?: number[];
        darkMode: boolean;
        isMobile: boolean;
      }
    ) => {
      if (!pluginOptions.windDirectionData) return;

      const ctx = chart.ctx;
      ctx.save();
      const timestamps = chart.data.labels;

      if (!timestamps) {
        return;
      }
      timestamps.forEach((timestamp, timestampIndex) => {
        drawWindDirectionArrow(
          ctx,
          chart.scales.x,
          Number(timestamp),
          pluginOptions.windDirectionData?.[timestampIndex] ?? 0,
          timestampIndex,
          chart,
          pluginOptions.darkMode,
          pluginOptions.isMobile
        );
      });
      ctx.restore();
    },
  };
}

function drawWindDirectionArrow(
  ctx: CanvasRenderingContext2D,
  xAxis: Scale<CoreScaleOptions>,
  timestamp: number,
  windDirection: number,
  timestampIndex: number,
  chart: ChartJS,
  isDarkMode: boolean,
  isMobile: boolean
) {
  if (windDirection === undefined) return;

  const windSpeed = chart.data.datasets[0].data[timestampIndex] as number;
  if (windSpeed === undefined || windSpeed === 0) return;

  const windDirectionIndex = Math.round(windDirection) - 1;
  if (
    windDirectionIndex < 0 ||
    windDirectionIndex >= WIND_DIRECTION_LABELS.length
  )
    return;

  ctx.font = `${isMobile ? 8 : 10}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const x = xAxis.getPixelForValue(timestamp);
  const arrowSize = isMobile ? 9 : 10;
  const circleRadius = arrowSize * 1.5;
  const centerY = isMobile ? 18 : 20;
  const arrowColor = isDarkMode
    ? "rgba(255, 255, 255, 0.9)"
    : "rgba(0, 0, 0, 0.8)";
  const arrowTipColor = "rgba(255, 0, 0, 0.8)";

  ctx.save();
  ctx.fillStyle = arrowColor;
  ctx.strokeStyle = arrowColor;

  if (!isMobile) {
    // Draw the circle
    ctx.beginPath();
    ctx.arc(x, centerY, circleRadius, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw the four ticks
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const tickLength = 2;
      const startX = x + Math.cos(angle) * circleRadius;
      const startY = centerY + Math.sin(angle) * circleRadius;
      const endX = x + Math.cos(angle) * (circleRadius - tickLength);
      const endY = centerY + Math.sin(angle) * (circleRadius - tickLength);

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  }

  // Draw the arrow
  ctx.translate(x, centerY);
  ctx.rotate((windDirectionIndex * Math.PI) / 4);

  // Draw arrow base
  ctx.beginPath();
  ctx.moveTo(-arrowSize / 2, isMobile ? arrowSize / 3 : circleRadius * 0.4);
  ctx.lineTo(arrowSize / 2, isMobile ? arrowSize / 3 : circleRadius * 0.4);
  ctx.lineTo(0, -circleRadius * 0.6);
  ctx.closePath();
  ctx.fill();

  // Draw red arrow tip
  ctx.fillStyle = arrowTipColor;
  ctx.beginPath();
  ctx.moveTo(-arrowSize / 4, -circleRadius * 0.2);
  ctx.lineTo(arrowSize / 4, -circleRadius * 0.2);
  ctx.lineTo(0, -circleRadius * 0.6);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // Draw direction label
  if (!isMobile) {
    ctx.fillStyle = arrowColor;
    ctx.fillText(
      WIND_DIRECTION_LABELS[windDirectionIndex],
      x,
      centerY + circleRadius + 10
    );
  }
}

export default WindChart;
