import { Plugin, Chart, ChartType } from "chart.js";
import SunCalc from 'suncalc';

declare module "chart.js" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface PluginOptionsByType<TType extends ChartType> {
    sunriseSunset?: {
      data: SunriseSunsetData[];
      show: boolean;
    };
  }
}

export interface SunriseSunsetData {
  sunrise: string;
  sunset: string;
}

const sunriseSunsetCache: Record<string, SunriseSunsetData[]> = {};

export async function fetchSunriseSunsetData(
  lat: number,
  lng: number,
  startDate: string,
  endDate: string
): Promise<SunriseSunsetData[]> {
  const cacheKey = `${lat},${lng},${startDate},${endDate}`;

  if (sunriseSunsetCache[cacheKey]) {
    return sunriseSunsetCache[cacheKey];
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days: SunriseSunsetData[] = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const times = SunCalc.getTimes(d, lat, lng);
    days.push({
      sunrise: times.sunrise.toISOString(),
      sunset: times.sunset.toISOString(),
    });
  }

  sunriseSunsetCache[cacheKey] = days;
  return days;
}

export function createSunriseSunsetPlugin(): Plugin {
  return {
    id: "sunriseSunset",
    afterDraw(chart: Chart) {
      const sunriseSunsetOptions = chart.options.plugins?.sunriseSunset;
      if (!sunriseSunsetOptions || !sunriseSunsetOptions.show) return;

      const sunriseSunsetData = sunriseSunsetOptions.data;
      if (!sunriseSunsetData) return;

      const ctx = chart.ctx;
      const xAxis = chart.scales["x"];
      const yAxis = chart.scales["y0"];

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.font = "16px Arial";

      sunriseSunsetData.forEach((data) => {
        const sunriseX = xAxis.getPixelForValue(new Date(data.sunrise!).getTime());
        const sunsetX = xAxis.getPixelForValue(new Date(data.sunset!).getTime());
        // Draw sunrise icon
        ctx.fillStyle = "orange";
        ctx.fillText("🌅", sunriseX, yAxis.bottom + 10);

        // Draw sunset icon
        ctx.fillStyle = "purple";
        ctx.fillText("🌇", sunsetX, yAxis.bottom + 10);
      });

      ctx.restore();
    },
  };
}
