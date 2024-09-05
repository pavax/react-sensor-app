import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { ProcessedData } from "../../api/data-processing";
import { ChartOptions } from "chart.js";
import { TimeRange } from "../../api/thingsboard-api";
import {
  calculateTrendLine,
  useChartStyles,
} from "./chart-utils";
import { useViewport } from "../../ViewportContext";
import { getCommonChartOptions } from "./common-chart-config";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface TelemetryChartsProps {
  data: ProcessedData;
  timeRange: TimeRange;
  theme: "light" | "dark";
}

const TemperatureChart: React.FC<TelemetryChartsProps> = ({
  data,
  timeRange,
  theme,
}) => {
  const chartStyles = useChartStyles(theme);
  const viewport = useViewport();

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

  const commonOptions = getCommonChartOptions(timeRange, theme);

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
        grid: {
          drawOnChartArea: false,
        },
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
      <Line options={options} data={temperatureData} />
    </div>
  );
};

export default TemperatureChart;
