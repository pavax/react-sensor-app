import React, { useRef, useState } from "react";
import { Chart } from "react-chartjs-2";
import { ChartData, ChartOptions, Chart as ChartJS } from "chart.js";
import "chartjs-adapter-date-fns";
import { ProcessedData } from "../../api/data-processing";
import { TimeRange } from "../../api/thingsboard-api";
import {
  calculateTrendLine,
  useChartStyles,
  useSunriseSunset,
} from "./chart-utils";
import { useViewport } from "../../ViewportContext";
import { getCommonChartOptions } from "./chart-config";
import { createAutoHideTooltipPlugin } from "./plugins/AutoHideTooltipPlugin";
import { createSunriseSunsetPlugin } from "./plugins/SunriseSunsetPlugin";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun } from "@fortawesome/free-solid-svg-icons";

interface TelemetryChartsProps {
  data: ProcessedData;
  timeRange: TimeRange;
}

const TemperatureChart: React.FC<TelemetryChartsProps> = ({
  data,
  timeRange,
}) => {
  const viewport = useViewport();
  const chartStyles = useChartStyles();
  const chartRef = useRef<ChartJS | null>(null);
  const sunriseSunsetData = useSunriseSunset(data);
  const [showSunriseSunset, setShowSunriseSunset] = useState(true);

  if (!data || !data.entries) {
    return <div>No data available</div>;
  }

  const hexTransparency = 60;
  const temperatureData: ChartData<"line"> = {
    labels: data.timestamps,
    datasets: [
      {
        label: "Temperature",
        type: "line",
        yAxisID: "y0",
        data: data.entries.temperature?.values ?? [],
        borderColor: `${chartStyles.lineColor1}`,
        backgroundColor: `${chartStyles.lineColor1}`,
      },
      {
        label: "Dew Point",
        type: "line",
        yAxisID: "y0",
        data: data.entries.dewPoint?.values ?? [],
        borderColor: `${chartStyles.lineColor2}${hexTransparency}`,
        backgroundColor: `${chartStyles.lineColor2}${hexTransparency}`,
        pointStyle: "circle",
        pointRadius: viewport.isMobile ? 2 : 3,
        showLine: false,
      },
      {
        label: "Temperature Trend",
        type: "line",
        yAxisID: "y0",
        data: calculateTrendLine(data.entries.temperature?.values ?? []),
        borderColor: `${chartStyles.lineColor3}${hexTransparency}`,
        backgroundColor: `${chartStyles.lineColor3}${hexTransparency}`,
        borderDash: [5, 5],
        fill: false,
      },
      {
        label: "Humidity",
        type: "line",
        yAxisID: "y1",
        data: data.entries.humidity?.values ?? [],
        borderColor: `${chartStyles.lineColor4}${hexTransparency}`,
        backgroundColor: `${chartStyles.lineColor4}${hexTransparency}`,
        pointStyle: "triangle",
        showLine: true,
        hidden: true,
      },
    ],
  };

  const commonOptions = getCommonChartOptions(timeRange);

  const options: ChartOptions<"line"> = {
    ...commonOptions,
    scales: {
      ...(commonOptions.scales ?? {}),
      y1: {
        ...(commonOptions.scales?.y0 ?? {}),
        position: "right" as const,
        display: !viewport.isMobile,
        min: 0,
        max: 100,
        ticks: {
          font: {
            size: 8,
          },
          callback: (value) => `${Number(value).toFixed(0)}`,
          count: 5,
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    plugins: {
      ...commonOptions.plugins,
      sunriseSunset: {
        data: sunriseSunsetData,
        show: showSunriseSunset,
      },
    },
  };

  return (
    <div className="chart-wrapper">
      <div className="chart-container">
        <Chart
          type="line"
          options={options}
          data={temperatureData}
          plugins={[createAutoHideTooltipPlugin(), createSunriseSunsetPlugin()]}
          ref={(reference) => {
            if (reference) {
              chartRef.current = reference;
            }
          }}
        />
      </div>
      <div className="chart-controls">
        <button
          className="toggle-sunrise-sunset"
          onClick={() => setShowSunriseSunset(!showSunriseSunset)}
          title={showSunriseSunset ? "Sonnendaten ausblenden" : "Sonnendaten einblenden"}
        >
          <FontAwesomeIcon 
            icon={faSun} 
            color={showSunriseSunset ? "var(--primary-color)" : "var(--chart-text-color)"}
          />
          <span>Sonnendaten {showSunriseSunset ? "Ausblenden" : "Einblenden"}</span>
        </button>
      </div>
    </div>
  );
};

export default TemperatureChart;
