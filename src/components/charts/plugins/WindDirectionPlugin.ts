import {
  Chart,
  ChartType,
  CoreScaleOptions,
  Plugin,
  Scale, 
  TooltipItem
} from "chart.js";

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

function getWindDirectionLabel(
  index: number,
  windDirectionData: number[]
): string {
  if (!windDirectionData) return "Unknown";
  const directionIndex = Math.round(windDirectionData[index] ?? 0) - 1;
  return WIND_DIRECTION_LABELS[directionIndex] || "Unknown";
}

export function createWindDirectionPlugin(): Plugin {
  return {
    id: "windDirection",
    afterDraw: (
      chart: Chart,
      _,
      pluginOptions: {
        windDirectionData?: number[];
        darkMode: boolean;
        isMobile: boolean;
      }
    ) => {
      if (chart.options.plugins?.tooltip?.callbacks?.label) {
        chart.options.plugins.tooltip.callbacks.label = function (
          tooltipItem: TooltipItem<any>
        ) {
          const windSpeed = Number(tooltipItem.parsed.y);
          const windDirectionLabel = getWindDirectionLabel(
            tooltipItem.dataIndex,
            pluginOptions.windDirectionData || []
          );
          return `Geschwindigkeit: ${windSpeed} m/s | Richtung: ${windDirectionLabel}`;
        };
      }
    },
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
