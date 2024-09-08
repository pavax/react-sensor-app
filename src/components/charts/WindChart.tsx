import {
  ChartData,
  ChartOptions,
  ChartType,
  CoreScaleOptions,
  Plugin,
  Scale,
} from "chart.js";
import "chartjs-adapter-date-fns";
import React from "react";
import { Line } from "react-chartjs-2";
import { ProcessedData } from "../../api/data-processing";
import { TimeRange } from "../../api/thingsboard-api";
import { useViewport } from "../../ViewportContext";
import { useChartStyles } from "./chart-utils";
import { createAutoHideTooltipPlugin, getCommonChartOptions, } from "./chart-config";
import { useRef } from "react";
import { Chart } from "chart.js";

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
}

const WindChart: React.FC<WindChartProps> = ({ data, timeRange }) => {
  const chartRef = useRef<Chart | null>(null);
  const viewport = useViewport();
  const chartStyles = useChartStyles();
  const commonOptions = getCommonChartOptions(timeRange);

  const options: ChartOptions<"line"> = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      y0: {
        ...commonOptions.scales?.y0,
        ticks: {
          ...commonOptions.scales?.y0?.ticks,
          callback: (value) => `${Number(value).toFixed(0)} m/s`,
        },
      },
    },
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        ...commonOptions.plugins?.tooltip,
        callbacks: {
          ...commonOptions.plugins?.tooltip.callbacks,
          label: (context) => {
            const windSpeed = Number(context.parsed.y);
            const windDirectionLabel = getWindDirectionLabel(
              context.dataIndex,
              data
            );
            return `Geschwindigkeit: ${windSpeed} m/s | Richtung: ${windDirectionLabel}`;
          },
        },
      },
      windDirection: {
        windDirectionData: data.entries.windDirection.values,
        darkMode: viewport.isDarkMode,
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
        yAxisID: "y0",
        data: data.entries.windVoltageMax?.values ?? [],
        borderColor: chartStyles.lineColor1,
        backgroundColor: chartStyles.lineColor1,
        stepped: "middle",
      },
    ],
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Line
        options={options}
        data={chartData}
        plugins={[createWindDirectionPlugin(), createAutoHideTooltipPlugin()]}
        ref={(reference) => {
          if (reference) {
            chartRef.current = reference;
          }
        }}
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

      // Calculate average space between arrows
      const chartWidth = chart.width;
      const averageSpace = chartWidth / (timestamps.length - 1);
      const canDrawCircles = averageSpace >= 32; 

      const minDistance = 10;
      let lastDrawnX = -Infinity;
      timestamps.forEach((timestamp, timestampIndex) => {
        const x = chart.scales.x.getPixelForValue(Number(timestamp));
        if (x - lastDrawnX >= minDistance) {
          // Don't draw when there was no wind
          const windSpeed = chart.data.datasets[0].data[
            timestampIndex
          ] as number;
          if (windSpeed === undefined || windSpeed === 0) {
            return;
          }
          const isArrowDrawn = drawWindDirectionArrow(
            ctx,
            chart.scales.x,
            Number(timestamp),
            pluginOptions.windDirectionData?.[timestampIndex] ?? 0,
            pluginOptions.darkMode,
            pluginOptions.isMobile,
            canDrawCircles
          );
          if (isArrowDrawn) {
            lastDrawnX = x;
          }
        }
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
  isDarkMode: boolean,
  isMobile: boolean,
  drawCircle: boolean
) {
  if (windDirection === undefined) {
    return false;
  }

  const windDirectionIndex = Math.round(windDirection) - 1;
  if (
    windDirectionIndex < 0 ||
    windDirectionIndex >= WIND_DIRECTION_LABELS.length
  ) {
    return false;
  }

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

  if (drawCircle) {
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

  return true;
}

export default WindChart;
