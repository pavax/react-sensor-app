import * as icons from "@fortawesome/free-solid-svg-icons";

import { AggregationType } from "../api/data-processing";
import * as charts from "../components/charts";

import { DashboardConfig } from "./config-types";
import { evaluateDSL, transformRawValue } from "./dsl-evaluator";

export function transformJsonConfig(jsonConfig: any): DashboardConfig {
  return {
    deviceId: jsonConfig.deviceId,
    name: jsonConfig.name,
    dataPointConfigs: Object.entries(jsonConfig.dataPointConfigs).reduce(
      (acc, [key, value]: [string, any]) => {
        acc[key] = {
          ...value,
          aggregationType:
            AggregationType[
              value.aggregationType as keyof typeof AggregationType
            ],
          rawValueTransformer: value.transform
            ? (number: number) => transformRawValue(value.transform, number)
            : undefined,
        };
        return acc;
      },
      {} as DashboardConfig["dataPointConfigs"]
    ),
    additionalContextDataConfig: jsonConfig.additionalContextDataConfig.map(
      (config: any) => ({
        ...config,
        text: (data: any) => {
          const value = evaluateDSL(config.text, data);
          return config.unit ? `${value}${config.unit}` : value.toString();
        },
      })
    ),
    chartConfigs: jsonConfig.chartConfigs.map((config: any) => {
      return {
        icon: (icons as any)[config.icon],
        title: config.title,
        chartComponent: (charts as any)[config.chartComponent],
        chartConfig: config.config,
      };
    }),
    overviewCardConfigs: jsonConfig.overviewCardConfigs.map((config: any) => ({
      icon: (icons as any)[config.icon],
      title: config.title,
      color: config.color,
      value: (data: any) => {
        const value = evaluateDSL(config.value, data);
        return value.toString() ?? "--";
      },
    })),
  };
}
