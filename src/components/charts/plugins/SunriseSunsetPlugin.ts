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

      const { latitude, longitude } = options;
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
      if (averageSpace < 50) {
        return;
      }

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.font = "16px Arial";
      ctx.globalAlpha = 0.2;

      const drawVerticalLine = (time: Date, color: string) => {
        const x = xAxis.getPixelForValue(time.getTime());
        if (x < xAxis.left || x > xAxis.right) return null;

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

      const drawIcon = (time: Date, icon: string, color: string) => {
        const x = xAxis.getPixelForValue(time.getTime());
        if (x < xAxis.left || x > xAxis.right) return null;

        ctx.fillText(icon, x, yAxis.bottom + 10);
        return x;
      };

      uniqueDates.forEach((dateString) => {
        const date = new Date(dateString);
        const sunTimes = SunCalc.getTimes(date, latitude, longitude);

        const sunriseX = drawVerticalLine(sunTimes.sunrise, SUNRISE_COLOR);
        const sunsetX = drawVerticalLine(sunTimes.sunset, SUNSET_COLOR);

        if (sunriseX !== null && sunsetX !== null && Math.abs(sunsetX - sunriseX) >= 30) {
          drawIcon(sunTimes.sunrise, "☀️", SUNRISE_COLOR);
          drawIcon(sunTimes.sunset, "🌛", SUNSET_COLOR);
        }
      });

      ctx.restore();
    },

    
  };

  
}
