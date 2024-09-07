import React, { useRef } from "react";
import { Bar } from "react-chartjs-2";
import {
  ChartData,
  Chart,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { ProcessedData } from "../../api/data-processing";
import { ChartOptions } from "chart.js";
import { TimeRange } from "../../api/thingsboard-api";
import { getCommonChartOptions } from "./chart-config";
import { useChartStyles, useHideTooltipOnTouchMove } from "./chart-utils";


interface RainEventChartProps {
  data: ProcessedData;
  timeRange: TimeRange;
}

const RainEventChart: React.FC<RainEventChartProps> = ({ data, timeRange }) => {
  const chartRef = useRef<Chart | null>(null);
  useHideTooltipOnTouchMove(chartRef);

  const chartStyles = useChartStyles();
  
  if (!data || !data.entries) {
    return <div>No data available</div>;
  }

  const rainEventData: ChartData<"bar"> = {
    labels: data.timestamps,
    datasets: [
      {
        label: "Regenmenge",
        yAxisID: "y0",
        data: data.entries.rainEventAccDifference?.values ?? [],
        borderColor: `${chartStyles.lineColor1}`,
        backgroundColor: `${chartStyles.lineColor1}`,
      },
    ],
  };

  const commonOptions = getCommonChartOptions(timeRange); 

  const options: ChartOptions<"bar"> = {
    ...commonOptions,
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Bar 
        options={options} 
        data={rainEventData} 
        ref={(reference) => {
          if (reference) {
            chartRef.current = reference;
          }
        }}
      />
    </div>
  );
};

export default RainEventChart;
