import React, { useRef } from "react";
import { Line } from "react-chartjs-2";
import { ChartData, Chart } from "chart.js";
import "chartjs-adapter-date-fns";
import { ProcessedData } from "../../api/data-processing";
import { ChartOptions } from "chart.js";
import { TimeRange } from "../../api/thingsboard-api";
import {
  calculateTrendLine,
  useChartStyles,
  useHideTooltipOnTouchMove,
} from "./chart-utils";
import { useViewport } from "../../ViewportContext";
import { getCommonChartOptions } from "./chart-config";

interface TelemetryChartsProps {
  data: ProcessedData;
  timeRange: TimeRange;
}

const TemperatureChart: React.FC<TelemetryChartsProps> = ({
  data,
  timeRange,
}) => {
  const viewport = useViewport();

  const chartStyles = useChartStyles();

  const chartRef = useRef<Chart | null>(null);

  useHideTooltipOnTouchMove(chartRef);

  if (!data || !data.entries) {
    return <div>No data available</div>;
  }

  const hexTransparency = 60;

  const temperatureData: ChartData<"line"> = {
    labels: data.timestamps,
    datasets: [
      {
        label: "Temperature",
        type: "line",
        yAxisID: "y0",
        data: data.entries.temperature?.values ?? [],
        borderColor: `${chartStyles.lineColor1}`,
        backgroundColor: `${chartStyles.lineColor1}`,
      },
      {
        label: "Dew Point",
        type: "line",
        yAxisID: "y0",
        data: data.entries.dewPoint?.values ?? [],
        borderColor: `${chartStyles.lineColor2}${hexTransparency}`,
        backgroundColor: `${chartStyles.lineColor2}${hexTransparency}`,
        pointStyle: "circle",
        pointRadius: viewport.isMobile ? 1 : 3,
        showLine: false,
      },
      {
        label: "Temperature Trend",
        type: "line",
        yAxisID: "y0",
        data: calculateTrendLine(data.entries.temperature?.values ?? []),
        borderColor: `${chartStyles.lineColor3}${hexTransparency}`,
        backgroundColor: `${chartStyles.lineColor3}${hexTransparency}`,
        borderDash: [5, 5],
        fill: false,
      },
      {
        label: "Humidity",
        type: "line",
        yAxisID: "y1",
        data: data.entries.humidity?.values ?? [],
        borderColor: `${chartStyles.lineColor4}${hexTransparency}`,
        backgroundColor: `${chartStyles.lineColor4}${hexTransparency}`,
        pointStyle: "triangle",
        showLine: true,
        hidden: true,
      },
    ],
  };

  const commonOptions = getCommonChartOptions(timeRange);

  const options: ChartOptions<"line"> = {
    ...commonOptions,
    scales: {
      ...(commonOptions.scales ?? {}),
      y1: {
        ...(commonOptions.scales?.y ?? {}),
        position: "right" as const,
        display: !viewport.isMobile,
        min: 0,
        max: 100,
        ticks: {
          font: {
            size: 8,
          },
          callback: (value) => `${Number(value).toFixed(0)}`,
          count: 5,
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Line
        options={options}
        data={temperatureData}
        ref={(reference) => {
          if (reference) {
            chartRef.current = reference;
          }
        }}
      />
    </div>
  );
};

export default TemperatureChart;
