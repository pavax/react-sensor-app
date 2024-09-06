import React, { useRef } from "react";
import { ChartData, ChartOptions, Chart as ChartJS } from "chart.js";
import { Chart } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import { ProcessedData } from "../../api/data-processing";
import { TimeRange } from "../../api/thingsboard-api";
import { getCommonChartOptions } from "./chart-config";
import { useHideTooltipOnTouchMove } from "./chart-utils";

interface LightChartProps {
  data: ProcessedData;
  timeRange: TimeRange;
}

const LightChart: React.FC<LightChartProps> = ({ data, timeRange }) => {
  const chartRef = useRef<ChartJS | null>(null);

  useHideTooltipOnTouchMove(chartRef);

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
        yAxisID: "y1"
      },
    ],
  };

  const options: ChartOptions<"bar" | "line"> = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
    
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
      <Chart
        type="line"
        options={options}
        data={chartData}
        ref={(reference) => {
          if (reference) {
            chartRef.current = reference;
          }
        }}
      />
    </div>
  );
};

export default LightChart;
