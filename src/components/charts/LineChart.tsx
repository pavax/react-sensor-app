import {
  ChartData,
  ChartDataset,
  Chart as ChartJS,
  ChartOptions,
  Plugin,
  ScaleOptionsByType,
} from "chart.js";
import { Parser } from "expr-eval";
import React, { useMemo, useRef } from "react";
import { Chart } from "react-chartjs-2";

import { useViewport } from "../../ViewportContext";
import { ProcessedData } from "../../api/data-processing";
import { TimeRange } from "../../api/thingsboard-api";
import { calculateTrendLine } from "../../common/math-utils";

import { getCommonChartOptions } from "./chart-config";
import { useChartStyles } from "./chart-utils";
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
  color: keyof typeof useChartStyles;
  transparency?: number;
  style?: "line" | "dashed";
  pointStyle?: "circle" | "triangle";
  showPoints?: boolean | string;
  hidden: boolean;
  stepped: boolean;
  showLine: boolean | string;
  fill?: {
    transparency?: number;
  };
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
  ticksFormatter: string;
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
  aBoolean: boolean | string | undefined,
  fallback: boolean
): boolean => {
  if (aBoolean === undefined) {
    return fallback;
  }

  return aBoolean === true || aBoolean === "true";
};

const parser = new Parser();

const LineChart: React.FC<LineChartProps> = ({
  processedData: data,
  timeRange,
  chartConfig,
}: LineChartProps) => {
  type ChartType = typeof chartConfig.chartType;
  const viewport = useViewport();
  const chartRef = useRef<ChartJS | null>(null);
  const chartStyles = useChartStyles();
  const commonOptions = getCommonChartOptions(timeRange);

  const chartData = useMemo<ChartData<ChartType>>(() => {
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

    function extractColor(
      colorName: keyof typeof chartStyles,
      transparency?: number
    ) {
      const color = chartStyles[colorName];
      if (!color && color === "") {
        return;
      }
      const hexToRgba = (hex: string, alpha: number = 1) => {
        if (hex.length === 4) {
          hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
        }
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
      };

      return transparency !== undefined
        ? hexToRgba(color, transparency)
        : color;
    }

    return {
      labels: data.timestamps,
      datasets: chartConfig.dataSets.map<ChartDataset<ChartType>>(
        (dataSetConfig) => ({
          type: dataSetConfig.type || chartConfig.chartType,
          unit: dataSetConfig.unit || "",
          yAxisID: dataSetConfig.yAxis,
          label: dataSetConfig.label,
          data: extractData(dataSetConfig, data),
          borderColor: extractColor(
            dataSetConfig.color,
            dataSetConfig.transparency
          ),
          backgroundColor: extractColor(
            dataSetConfig.color,
            dataSetConfig.fill?.transparency || dataSetConfig.transparency
          ),
          hidden: parseBoolean(dataSetConfig.hidden, false),
          borderDash: dataSetConfig.style === "dashed" ? [5, 5] : undefined,
          pointStyle: dataSetConfig.pointStyle || "circle",
          pointRadius: parseBoolean(dataSetConfig.showPoints, false)
            ? viewport.isMobile
              ? 2
              : 3
            : 0,
          stepped: dataSetConfig.stepped ? "middle" : undefined,
          showLine: parseBoolean(dataSetConfig.showLine, true),
          fill: dataSetConfig.fill ? true : false,
        })
      ),
    };
  }, [
    data,
    chartConfig.dataSets,
    chartConfig.chartType,
    chartStyles,
    viewport,
  ]);

  const options = useMemo<ChartOptions<ChartType>>(() => {
    function prepareScale(
      scaleConfig: ScaleConfig | undefined,
      template: any
    ): ScaleOptionsByType {
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
          ...(scaleConfig.ticksFormatter && {
            callback: (value: any) => {
              const formattedTicks = scaleConfig.ticksFormatter;
              const expr = parser.parse(formattedTicks);
              return expr.evaluate({ x: value });
            },
          }),
          maxTicksLimit: parseNumber(scaleConfig.maxTicks, undefined),
        },
      };
    }

    return {
      ...commonOptions,
      scales: {
        x: prepareScale(chartConfig?.scales?.x, commonOptions.scales?.x),
        y0: prepareScale(chartConfig?.scales?.y0, commonOptions.scales?.y0),
        ...(chartConfig?.scales?.y1 && {
          y1: prepareScale(chartConfig.scales.y1, commonOptions.scales?.y1),
        }),
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

export default LineChart;
