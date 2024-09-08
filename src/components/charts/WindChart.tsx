import {
  ChartData,
  ChartOptions,
} from "chart.js";
import "chartjs-adapter-date-fns";
import React from "react";
import { ProcessedData } from "../../api/data-processing";
import { TimeRange } from "../../api/thingsboard-api";
import { useViewport } from "../../ViewportContext";
import { useChartStyles } from "./chart-utils";
import { getCommonChartOptions, } from "./chart-config";
import { useRef } from "react";
import { Chart } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js";
import { createWindDirectionPlugin } from "./plugins/WindDirectionPlugin";
import { createAutoHideTooltipPlugin } from "./plugins/AutoHideTooltipPlugin";

export const WIND_DIRECTION_LABELS = [
  "N",
  "NE",
  "E",
  "SE",
  "S",
  "SW",
  "W",
  "NW",
];

interface WindChartProps {
  data: ProcessedData;
  timeRange: TimeRange;
}

const WindChart: React.FC<WindChartProps> = ({ data, timeRange }) => {
  const chartRef = useRef<ChartJS | null>(null);
  const viewport = useViewport();
  const chartStyles = useChartStyles();
  const commonOptions = getCommonChartOptions(timeRange);

  const options: ChartOptions<"line"> = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      y0: {
        ...commonOptions.scales?.y0,
        ticks: {
          ...commonOptions.scales?.y0?.ticks,
          callback: (value) => `${Number(value).toFixed(0)} m/s`,
        },
      },
    },
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        ...commonOptions.plugins?.tooltip,
        callbacks: {
          ...commonOptions.plugins?.tooltip.callbacks,
          label: (context) => {
            const windSpeed = Number(context.parsed.y);
            const windDirectionLabel = getWindDirectionLabel(
              context.dataIndex,
              data
            );
            return `Geschwindigkeit: ${windSpeed} m/s | Richtung: ${windDirectionLabel}`;
          },
        },
      },
      windDirection: {
        windDirectionData: data.entries.windDirection.values,
        darkMode: viewport.isDarkMode,
        isMobile: !viewport.isDesktop,
      },
    },
    layout: {
      padding: {
        top: viewport.isMobile ? 35 : 60,
        right: 15,
      },
    },
  };

  const chartData: ChartData<"line"> = {
    labels: data.timestamps,
    datasets: [
      {
        label: "Wind Speed",
        yAxisID: "y0",
        data: data.entries.windVoltageMax?.values ?? [],
        borderColor: chartStyles.lineColor1,
        backgroundColor: chartStyles.lineColor1,
        stepped: "middle",
      },
    ],
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Chart
        type="line"
        options={options}
        data={chartData}
        plugins={[createWindDirectionPlugin(), createAutoHideTooltipPlugin()]}
        ref={(reference) => {
          if (reference) {
            chartRef.current = reference;
          }
        }}
      />
    </div>
  );
};

// Helper functions
function getWindDirectionLabel(index: number, data: ProcessedData): string {
  const windDirectionData = data.entries.windDirection?.values ?? [];
  if (!windDirectionData) return "Unknown";
  const directionIndex = Math.round(windDirectionData[index] ?? 0) - 1;
  return WIND_DIRECTION_LABELS[directionIndex] || "Unknown";
}


export default WindChart;
