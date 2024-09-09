import React, { useRef } from "react";
import { ChartData, ChartOptions, Chart as ChartJS } from "chart.js";
import { Chart } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import { ProcessedData } from "../../api/data-processing";
import { TimeRange } from "../../api/thingsboard-api";
import { getCommonChartOptions } from "./chart-config";
import { useChartStyles } from "./chart-utils";
import { createAutoHideTooltipPlugin } from "./plugins/AutoHideTooltipPlugin";
import { createSunriseSunsetPlugin } from "./plugins/SunriseSunsetPlugin";
import { useViewport } from "../../ViewportContext";

interface LightChartProps {
  data: ProcessedData;
  timeRange: TimeRange;
}

const LightChart: React.FC<LightChartProps> = ({ data, timeRange }) => {
  const viewport = useViewport();
  const chartRef = useRef<ChartJS | null>(null);
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
    plugins: {
      ...commonOptions.plugins,
      sunriseSunset: {
        latitude: Number(process.env.REACT_APP_LATITUDE),
        longitude: Number(process.env.REACT_APP_LONGITUDE),
        show: true,
        darkMode: viewport.isDarkMode,
        isMobile: !viewport.isDesktop,
      },
    },
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Chart
        type="line"
        options={options}
        data={chartData}
        plugins={[createAutoHideTooltipPlugin(), createSunriseSunsetPlugin()]}
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
