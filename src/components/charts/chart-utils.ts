import { TimeRange } from "../../api/thingsboard-api";
import { useState, useEffect } from "react";
import { useViewport } from "../../ViewportContext";
import { ProcessedData } from "../../api/data-processing";
import { SunriseSunsetData, fetchSunriseSunsetData } from "./plugins/SunriseSunsetPlugin";
import { format } from "date-fns";

export function getTimeUnit(timeRange: TimeRange): "hour" | "day" | "week" {
  switch (timeRange) {
    case TimeRange.ONE_DAY:
      return "hour";
    case TimeRange.THREE_DAYS:
      return "day";
    case TimeRange.ONE_WEEK:
      return "day";
    case TimeRange.TWO_WEEKS:
      return "day";
    case TimeRange.ONE_MONTH:
      return "week";
    default:
      return "day";
  }
}

export function determineMaxTickLimit(timeRange: TimeRange) {
  switch (timeRange) {
    case TimeRange.ONE_DAY:
      return 24;
    case TimeRange.THREE_DAYS:
      return 3;
    case TimeRange.ONE_WEEK:
      return 7;
    case TimeRange.TWO_WEEKS:
      return 14;
    case TimeRange.ONE_MONTH:
      return 31;
    default:
      return 31;
  }
}

export function useChartStyles(): {
  lineColor1: string;
  lineColor2: string;
  lineColor3: string;
  lineColor4: string;
  lineColor5: string;
  textColor: string;
  gridColor: string;
} {
  const { isDarkMode } = useViewport();
  const [chartStyles, setChartStyles] = useState({
    lineColor1: "",
    lineColor2: "",
    lineColor3: "",
    lineColor4: "",
    lineColor5: "",
    textColor: "",
    gridColor: "",
  });

  useEffect(() => {
    const updateChartStyles = () => {
      const bodyComputedStyle = getComputedStyle(document.body);
      setChartStyles({
        lineColor1: bodyComputedStyle
          .getPropertyValue("--chart-line-color-1")
          .trim(),
        lineColor2: bodyComputedStyle
          .getPropertyValue("--chart-line-color-2")
          .trim(),
        lineColor3: bodyComputedStyle
          .getPropertyValue("--chart-line-color-3")
          .trim(),
        lineColor4: bodyComputedStyle
          .getPropertyValue("--chart-line-color-4")
          .trim(),
        lineColor5: bodyComputedStyle
          .getPropertyValue("--chart-line-color-5")
          .trim(),
        textColor: bodyComputedStyle
          .getPropertyValue("--chart-text-color")
          .trim(),
        gridColor: bodyComputedStyle
          .getPropertyValue("--chart-grid-color")
          .trim(),
      });
    };
    const timeoutId = setTimeout(updateChartStyles, 1);
    return () => clearTimeout(timeoutId);
  }, [isDarkMode]);

  return chartStyles;
}

export function calculateTrendLine(values: number[]): number[] {
  const n = values.length;
  const sumX = values.reduce((acc, _, i) => acc + i, 0);
  const sumY = values.reduce((acc, y) => acc + y, 0);
  const sumXY = values.reduce((acc, y, i) => acc + i * y, 0);
  const sumX2 = values.reduce((acc, _, i) => acc + i * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return values.map((_, i) => slope * i + intercept);
}


export function useSunriseSunset(data: ProcessedData | null) {
  const [sunriseSunsetData, setSunriseSunsetData] = useState<SunriseSunsetData[]>([]);

  useEffect(() => {
    const fetchSunriseSunset = async () => {
      if (!data || !data.timestamps || data.timestamps.length === 0) return;

      const startDate = new Date(data.timestamps[0]);
      const endDate = new Date(data.timestamps[data.timestamps.length - 1]);
      
      const startDateString = format(startDate, 'yyyy-MM-dd');
      const endDateString = format(endDate, 'yyyy-MM-dd');
      
      const sunriseSunsetData = await fetchSunriseSunsetData(
        Number(process.env.REACT_APP_LATITUDE),
        Number(process.env.REACT_APP_LONGITUDE),
        startDateString,
        endDateString
      );
      setSunriseSunsetData(sunriseSunsetData);
    };
    fetchSunriseSunset();
  }, [data]);

  return sunriseSunsetData;
}