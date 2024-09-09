import { Plugin, Chart, ChartType } from "chart.js";

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

  const apiKey = process.env.REACT_APP_VISUAL_CROSSING_API_KEY;
  if (!apiKey) {
    console.error('Visual Crossing API key is not set in environment variables');
    return [];
  }

  try {
    const location = `${lat},${lng}`;
    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}/${startDate}/${endDate}?key=${apiKey}&include=days&elements=datetime,sunrise,sunset`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();

    sunriseSunsetCache[cacheKey] = data.days.map((day: any) => ({
      sunrise: new Date(`${day.datetime}T${day.sunrise}`).toISOString(),
      sunset: new Date(`${day.datetime}T${day.sunset}`).toISOString(),
    }));

    return sunriseSunsetCache[cacheKey];
  } catch (error) {
    console.error('Error fetching sunrise/sunset data:', error);
    return [];
  }
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
