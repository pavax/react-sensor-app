import React, { useRef } from "react";
import { ChartData, ChartOptions, Chart as ChartJS } from "chart.js";
import { Chart } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import { ProcessedData } from "../../api/data-processing";
import { TimeRange } from "../../api/thingsboard-api";
import { getCommonChartOptions } from "./chart-config";
import { useChartStyles, useHideTooltipOnTouchMove } from "./chart-utils";

interface LightChartProps {
  data: ProcessedData;
  timeRange: TimeRange;
}

const LightChart: React.FC<LightChartProps> = ({ data, timeRange }) => {
  const chartRef = useRef<ChartJS | null>(null);

  useHideTooltipOnTouchMove(chartRef);

  const chartStyles = useChartStyles();

  const commonOptions = getCommonChartOptions(timeRange);

  if (!data || !data.entries) {
    return <div>No data available</div>;
  }

  const chartData: ChartData<"bar" | "line"> = {
    labels: data.timestamps,
    datasets: [
      {
        label: "Lux",
        type: "line" as const,
        yAxisID: "y0",
        data: data.entries.lux?.values ?? [],
        borderColor: `${chartStyles.lineColor3}`,
        backgroundColor: `${chartStyles.lineColor3}`,
        tension: 0.3
      },
      {
        label: "UV Index",
        type: "bar" as const,
        yAxisID: "y1",
        data: data.entries.uvIndex?.values ?? [],
        borderColor: `${chartStyles.lineColor1}`,
        backgroundColor: `${chartStyles.lineColor1}`,
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
