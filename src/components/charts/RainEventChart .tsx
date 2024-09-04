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
import { getTimeUnit } from "./chart-utils";

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



const RainEventChart: React.FC<RainEventChartProps> = ({
  data,
  timeRange,
}) => {
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
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
      tooltip: {
        mode: 'index',
        intersect: true,
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: getTimeUnit(timeRange),
          displayFormats: {
            hour: "HH:mm",
            day: "dd.MM",
            week: "dd.MM",
          },
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          font: {
            size: 8,
          },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 8,
          },
        },
      },
    },
  };

  return (
    <div>
      <div style={{ width: "100%", minHeight: "400px", marginBottom: "20px" }}>
        <Bar options={options} data={rainEventData} />
      </div>
    </div>
  );
};

export default RainEventChart;