import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
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
import { getCommonChartOptions } from "./common-chart-config";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface RainEventChartProps {
  data: ProcessedData;
  timeRange: TimeRange;
}

const RainEventChart: React.FC<RainEventChartProps> = ({ data, timeRange }) => {
  
  if (!data || !data.entries) {
    return <div>No data available</div>;
  }

  const rainEventData: ChartData<"bar"> = {
    labels: data.timestamps,
    datasets: [
      {
        label: "Regenmenge",
        data: data.entries.rainEventAccDifference?.values ?? [],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
        yAxisID: "y0",
      },
    ],
  };

  const commonOptions = getCommonChartOptions(timeRange); 

  const options: ChartOptions<"bar"> = {
    ...commonOptions,
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Bar options={options} data={rainEventData} />
    </div>
  );
};

export default RainEventChart;
