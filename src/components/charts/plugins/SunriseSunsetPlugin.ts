import { Plugin, Chart, ChartType } from "chart.js";
import SunCalc from 'suncalc';

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

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.font = "16px Arial";

      const dataPoints = chart.data.labels as number[];
      dataPoints.forEach((timestamp) => {
        const date = new Date(timestamp);
        const times = SunCalc.getTimes(date, latitude, longitude);

        const drawIcon = (time: Date, icon: string, color: string) => {
          const x = xAxis.getPixelForValue(time.getTime());
          ctx.fillStyle = color;
          ctx.fillText(icon, x, yAxis.bottom + 10);
        };

        drawIcon(times.sunrise, "🌅", "orange");
        drawIcon(times.sunset, "🌇", "purple");
      });

      ctx.restore();
    },
  };
}
