import { TimeRange } from "../../api/thingsboard-api";
import { useState, useEffect } from 'react';
import { useViewport } from "../../ViewportContext";

export function getTimeUnit(timeRange: TimeRange): "hour" | "day" | "week" {
    switch (timeRange) {
      case TimeRange.ONE_DAY:
        return "hour";
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

  export  function formatAsNumber(value: number): string {
    return value.toFixed(1);
  }

  export function useChartStyles(): { lineColor: string; textColor: string; gridColor: string; } {
    const { isDarkMode } = useViewport();
    const [chartStyles, setChartStyles] = useState({
      lineColor: '',
      textColor: '',
      gridColor: ''
    });
  
    useEffect(() => {
      const updateChartStyles = () => {
        const bodyComputedStyle = getComputedStyle(document.body);
        setChartStyles({
          lineColor: bodyComputedStyle.getPropertyValue('--chart-line-color').trim(),
          textColor: bodyComputedStyle.getPropertyValue('--chart-text-color').trim(),
          gridColor: bodyComputedStyle.getPropertyValue('--chart-grid-color').trim()
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