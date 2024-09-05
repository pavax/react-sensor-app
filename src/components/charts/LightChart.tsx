import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import { ProcessedData } from "../../api/data-processing";
import { TimeRange } from "../../api/thingsboard-api";
import { getCommonChartOptions } from "./common-chart-config";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface LightChartProps {
  data: ProcessedData;
  timeRange: TimeRange;
}

const LightChart: React.FC<LightChartProps> = ({ data, timeRange }) => {
  const commonOptions = getCommonChartOptions(timeRange);

  if (!data || !data.entries) {
    return <div>No data available</div>;
  }

  const chartData: ChartData<"bar" | "line"> = {
    labels: data.timestamps,
    datasets: [
      {
        type: "line" as const,
        label: "Lux",
        data: data.entries.lux?.values ?? [],
        borderColor: "rgb(255, 205, 86)",
        backgroundColor: "rgba(255, 205, 86, 0.5)",
        yAxisID: "y0",
      },
      {
        type: "bar" as const,
        label: "UV Index",
        data: data.entries.uvIndex?.values ?? [],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
        yAxisID: "y1",
      },
    ],
  };

  const options: ChartOptions<"bar" | "line"> = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      y0: {
        ticks: {
          ...commonOptions.scales.y0,
          callback: function (value) {
            return (Number(value) / 1000).toFixed(1) + "k";
          },
        },
      },
      y1: {
        type: "linear" as const,
        position: "right" as const,
        display: false,
        min: 0,
        max: 11,
      },
    },
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Chart type="bar" options={options} data={chartData} />
    </div>
  );
};

export default LightChart;
