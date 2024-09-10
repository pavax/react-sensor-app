import { Plugin, Chart, ChartType } from "chart.js";
import { format } from "date-fns";
import SunCalc from "suncalc";

declare module "chart.js" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface PluginOptionsByType<TType extends ChartType> {
    sunriseSunset?: {
      latitude: number;
      longitude: number;
      show: boolean;
      darkMode: boolean;
      isMobile: boolean;
    };
  }
}

const SUNRISE_COLOR = "#FFD700"; // Yellowish gold

const SUNSET_COLOR = "#FFA500"; // Orange

export function createSunriseSunsetPlugin(): Plugin {
  return {
    id: "sunriseSunset",
    afterDraw(chart: Chart) {
      const options = chart.options.plugins?.sunriseSunset;
      if (!options || !options.show) return;
      if (!options || !options.longitude) return;
      if (!options || !options.latitude) return;

      const { latitude, longitude, isMobile } = options;
      const ctx = chart.ctx;
      const xAxis = chart.scales["x"];
      const yAxis = chart.scales["y0"];
      const dataPoints = chart.data.labels as number[];

      const uniqueDates = new Set<string>();
      dataPoints.forEach((timestamp) => {
        const date = new Date(timestamp);
        const dateAsString = format(date, "yyyy-MM-dd");
        uniqueDates.add(dateAsString);
      });

      const chartWidth = chart.width;
      const averageSpace = chartWidth / (uniqueDates.size - 1);
      if (averageSpace < 70) {
        return;
      }

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.globalAlpha = 0.3;

      const drawVerticalLine = (time: Date, color: string): number => {
        const x = xAxis.getPixelForValue(time.getTime());
        if (x < xAxis.left || x > xAxis.right) return Infinity;

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 10]);
        ctx.moveTo(x, yAxis.top);
        ctx.lineTo(x, yAxis.bottom);
        ctx.stroke();
        ctx.setLineDash([]);

        return x;
      };

      const drawArrowIcon = (time: Date, isSunrise: boolean, color: string) => {
        const x = xAxis.getPixelForValue(time.getTime());
        if (x < xAxis.left || x > xAxis.right) return;

        const arrowSize = isMobile ? 5 : 10;
        const groundWidth = isMobile ? 10 : 20;
        const yBase = yAxis.top - (isMobile ? 15 : 30);
        const gap = isMobile ? 2 : 5;
        const tickSize = isMobile ? 5 : 5;

        // Draw arrow and tick
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        if (isSunrise) {
          // Triangle
          ctx.moveTo(x, yBase);
          ctx.lineTo(x - arrowSize / 2, yBase + arrowSize);
          ctx.lineTo(x + arrowSize / 2, yBase + arrowSize);
          ctx.closePath();
          ctx.fill();

          // Tick
          ctx.moveTo(x, yBase + arrowSize);
          ctx.lineTo(x, yBase + arrowSize + tickSize);
          ctx.stroke();
        } else {
          // Triangle
          ctx.moveTo(x, yBase + arrowSize + tickSize);
          ctx.lineTo(x - arrowSize / 2, yBase + tickSize);
          ctx.lineTo(x + arrowSize / 2, yBase + tickSize);
          ctx.closePath();
          ctx.fill();

          // Tick
          ctx.moveTo(x, yBase + tickSize);
          ctx.lineTo(x, yBase);
          ctx.stroke();
        }

        // Draw ground
        ctx.beginPath();
        ctx.strokeStyle = "#4682B4"; // Steel Blue color
        ctx.lineWidth = 2;
        ctx.moveTo(x - groundWidth / 2, yBase + arrowSize + tickSize + gap);
        ctx.lineTo(x + groundWidth / 2, yBase + arrowSize + tickSize + gap);
        ctx.stroke();

        // Draw time
        ctx.font = isMobile ? "8px Arial" : "10px Arial";
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        const timeString = format(time, "HH:mm");
        const currentAlpha = ctx.globalAlpha;
        ctx.globalAlpha = currentAlpha * 2;
        ctx.fillText(timeString, x, yBase - gap);
        ctx.globalAlpha = currentAlpha;
      };

      uniqueDates.forEach((dateString) => {
        const sunTimes = SunCalc.getTimes(
          new Date(dateString),
          latitude,
          longitude
        );

        const sunriseX = drawVerticalLine(sunTimes.sunrise, SUNRISE_COLOR);
        const sunsetX = drawVerticalLine(sunTimes.sunset, SUNSET_COLOR);

        if (Math.abs(sunsetX - sunriseX) >= (isMobile ? 20 : 30)) {
          drawArrowIcon(sunTimes.sunrise, true, SUNRISE_COLOR);
          drawArrowIcon(sunTimes.sunset, false, SUNSET_COLOR);
        }
      });

      ctx.restore();
    },
  };
}
