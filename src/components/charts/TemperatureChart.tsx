import React, { useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  ChartData,
  Chart,
} from "chart.js";
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

  const temperatureData: ChartData<"line"> = {
    labels: data.timestamps,
    datasets: [
      {
        label: "Temperature",
        data: data.entries.temperature?.values ?? [],
        borderColor: chartStyles.lineColor,
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        yAxisID: "y0",
      },
      {
        label: "Dew Point",
        data: data.entries.dewPoint?.values ?? [],
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        yAxisID: "y0",
        type: "line",
        pointStyle: "triangle",
        pointRadius: 5,
        showLine: false,
      },
      {
        label: "Temperature Trend",
        data: calculateTrendLine(data.entries.temperature?.values ?? []),
        borderColor: "rgba(255, 99, 132, 0.5)",
        backgroundColor: "rgba(255, 99, 132, 0.1)",
        yAxisID: "y0",
        type: "line",
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      },
      {
        label: "Humidity",
        data: data.entries.humidity?.values ?? [],
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgb(54, 162, 235)",
        yAxisID: "y1",
        type: "line",
        pointStyle: "triangle",
        pointRadius: 0,
        showLine: true,
        borderWidth: 0.5,
      },
    ],
  };

  const commonOptions = getCommonChartOptions(timeRange, data);

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
          count: 7,
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
