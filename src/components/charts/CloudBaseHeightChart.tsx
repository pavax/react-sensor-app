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
import { getCommonChartOptions } from "./chart-config";
import { useHideTooltipOnTouchMove } from "./chart-utils";

interface CloudBaseHeightChartProps {
  data: ProcessedData;
  timeRange: TimeRange;
}

const CloudBaseHeightChart: React.FC<CloudBaseHeightChartProps> = ({ data, timeRange }) => {
  const chartRef = useRef<Chart | null>(null);
  useHideTooltipOnTouchMove(chartRef);

  if (!data || !data.entries) {
    return <div>No data available</div>;
  }

  const cloudBaseHeightData: ChartData<"line"> = {
    labels: data.timestamps,
    datasets: [
      {
        label: "Cloud Base Height",
        data: data.entries.cloudBaseHeight?.values ?? [],
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        yAxisID: "y0",
      },
    ],
  };

  const commonOptions = getCommonChartOptions(timeRange);

  const options: ChartOptions<"line"> = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      y0: {
        ...commonOptions.scales?.y0,
        title: {
          display: false,
          text: 'Height (m)',
        },
      },
    },
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Line 
        options={options} 
        data={cloudBaseHeightData} 
        ref={(reference) => {
          if (reference) {
            chartRef.current = reference;
          }
        }}
      />
    </div>
  );
};

export default CloudBaseHeightChart;