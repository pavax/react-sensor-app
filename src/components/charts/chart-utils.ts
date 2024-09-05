import { TimeRange } from "../../api/thingsboard-api";
import { useState, useEffect } from 'react';

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

  export function useChartStyles(theme: 'light' | 'dark'): { lineColor: string; textColor: string; gridColor: string; } {
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
    }, [theme]);
  
    return chartStyles;
  }