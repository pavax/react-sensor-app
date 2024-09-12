import { ChartData, Chart as ChartJS, ChartOptions, Plugin } from "chart.js";
import React, { useMemo, useRef } from "react";
import { Chart } from "react-chartjs-2";
import { useViewport } from "../../ViewportContext";
import { ProcessedData } from "../../api/data-processing";
import { TimeRange } from "../../api/thingsboard-api";
import { getCommonChartOptions } from "./chart-config";
import { calculateTrendLine, useChartStyles } from "./chart-utils";
import { createAutoHideTooltipPlugin } from "./plugins/AutoHideTooltipPlugin";
import { createSunriseSunsetPlugin } from "./plugins/SunriseSunsetPlugin";
import { createWindDirectionPlugin } from "./plugins/WindDirectionPlugin";

export interface LineChartProps {
  processedData: ProcessedData;
  timeRange: TimeRange;
  chartConfig: ChartConfig;
}

export interface ChartConfig {
  chartType: "line" | "bar";
  dataSets: DataSetConfig[];
  scales?: {
    x: ScaleConfig;
    y0: ScaleConfig;
    y1?: ScaleConfig;
  };
  plugins?: {
    sunriseSunsets: boolean;
    windDirections: {
      directionKey: string;
    };
  };
}

export interface DataSetConfig {
  label: string;
  yAxis: "y0" | "y1";
  type: "line" | "bar";
  unit?: "string";
  dataKey: string;
  isTrendLineData: boolean;
  color: "lineColor1" | "lineColor2" | "lineColor3";
  transparency?: number;
  style?: "line" | "point-cyrcle" | "point-triangle" | "dashed";
  hidden: boolean;
  stepped: boolean;
  showLine: boolean | string;
}

export interface ScaleConfig {
  type: "linear" | "bar";
  position: "left" | "right";
  display: {
    mobile: boolean | string;
    desktop: boolean | string;
  };
  min: number | string;
  max: number | string;
  maxTicks?: number | string;
  tickCounts?: number;
  drawOnChartArea: string | boolean;
}

const parseNumber = (
  aNumber: number | string | undefined,
  fallback: number | undefined
): number | undefined => {
  if (aNumber === undefined) {
    return fallback;
  }
  return typeof aNumber === "string" ? Number(aNumber) : aNumber;
};

const parseBoolean = (
  aBoolean: boolean | string,
  fallback: boolean
): boolean => {
  if (aBoolean === undefined) {
    return fallback;
  }

  return aBoolean === true || aBoolean === "true";
};

const GenericLineChart: React.FC<LineChartProps> = ({
  processedData: data,
  timeRange,
  chartConfig,
}: LineChartProps) => {
  const viewport = useViewport();
  const chartRef = useRef<ChartJS | null>(null);
  const chartStyles = useChartStyles();
  const commonOptions = getCommonChartOptions(timeRange);
  type ChartType = typeof chartConfig.chartType;

  const chartData: ChartData<ChartType> = useMemo(() => {
    function extractData(
      dataSetConfig: DataSetConfig,
      data: ProcessedData
    ): number[] {
      if (dataSetConfig.isTrendLineData) {
        return calculateTrendLine(
          data.entries[dataSetConfig.dataKey].values ?? []
        );
      }
      return data.entries[dataSetConfig.dataKey].values;
    }

    return {
      labels: data.timestamps,
      datasets: chartConfig.dataSets.map((dataSetConfig) => {
        return {
          type: dataSetConfig.type || chartConfig.chartType,
          unit: dataSetConfig.unit || "",
          yAxisID: dataSetConfig.yAxis,
          label: dataSetConfig.label,
          data: extractData(dataSetConfig, data),
          borderColor: `${chartStyles[dataSetConfig.color]}${
            dataSetConfig.transparency || ""
          }`,
          backgroundColor: `${chartStyles[dataSetConfig.color]}${
            dataSetConfig.transparency || ""
          }`,
          hidden: parseBoolean(dataSetConfig.hidden, false),
          borderDash: dataSetConfig.style === "dashed" ? [5, 5] : undefined,
          pointStyle:
            dataSetConfig.style === "point-cyrcle"
              ? "circle"
              : dataSetConfig.style === "point-triangle"
              ? "triangle"
              : false,
          pointRadius: viewport.isMobile ? 2 : 3,
          stepped: dataSetConfig.stepped ? "middle" : undefined,
          showLine: parseBoolean(dataSetConfig.showLine, true),
        
        };
      }),
    };
  }, [
    data,
    chartConfig.dataSets,
    chartConfig.chartType,
    chartStyles,
    viewport,
  ]);

  const options = useMemo<ChartOptions<ChartType>>(() => {
    function prepareScale(scaleConfig: ScaleConfig | undefined, template: any) {
      if (!scaleConfig) {
        return { ...template };
      }

      const display = scaleConfig.display
        ? (viewport.isMobile &&
            parseBoolean(scaleConfig.display.mobile, true)) ||
          (!viewport.isMobile &&
            parseBoolean(scaleConfig.display.desktop, true))
        : true;

      return {
        ...template,
        position: scaleConfig.position,
        display: display,
        min: parseNumber(scaleConfig.min, undefined),
        max: parseNumber(scaleConfig.max, undefined),
        grid: {
          ...template.grid,
          color: chartStyles.textColor,
          drawOnChartArea: parseBoolean(scaleConfig.drawOnChartArea, false),
          drawTicks: false,
        },
        ticks: {
          ...template.ticks,
          callback: (value: any) => `${Number(value).toFixed(0)}`,
          count: parseNumber(scaleConfig.maxTicks, undefined),
        },
      };
    }

    return {
      ...commonOptions,
      scales: {
        x: {
          ...prepareScale(chartConfig?.scales?.x, commonOptions.scales?.x),
        },
        y0: {
          ...prepareScale(chartConfig?.scales?.y0, commonOptions.scales?.y0),
        },
        y1: chartConfig?.scales?.y1 && {
          ...prepareScale(chartConfig.scales.y1, commonOptions.scales.y1),
        },
      },
      plugins: {
        ...commonOptions.plugins,
        sunriseSunset: {
          latitude: Number(process.env.REACT_APP_LATITUDE),
          longitude: Number(process.env.REACT_APP_LONGITUDE),
          darkMode: viewport.isDarkMode,
          isMobile: !viewport.isDesktop,
        },
        windDirection: chartConfig.plugins?.windDirections
          ? {
              windDirectionData:
                data.entries[chartConfig.plugins?.windDirections.directionKey]
                  .values,
              darkMode: viewport.isDarkMode,
              isMobile: !viewport.isDesktop,
            }
          : undefined,
      },
    };
  }, [commonOptions, chartStyles, chartConfig, viewport, data.entries]);

  const plugins = useMemo<Plugin[]>(() => {
    const pluginList: Plugin[] = [createAutoHideTooltipPlugin()];
    if (chartConfig.plugins?.sunriseSunsets) {
      pluginList.push(createSunriseSunsetPlugin());
    }
    if (chartConfig.plugins?.windDirections) {
      pluginList.push(createWindDirectionPlugin());
    }
    return pluginList;
  }, [chartConfig.plugins]);

  if (!data || !data.entries) {
    return <div>No data available</div>;
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Chart
        type={chartConfig.chartType}
        options={options}
        data={chartData}
        plugins={plugins}
        ref={(reference) => {
          if (reference) {
            chartRef.current = reference;
          }
        }}
      />
    </div>
  );
};

export default GenericLineChart;
