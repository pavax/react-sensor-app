import { calculateMedian, calculateMin, calculateMax, calculateMode, calculateAverage, calculateSum, calculateLatest } from "../common/math-utils";

import {
  TelemetryItem,
  TelemetryTimeSeries,
  TimeRange,
} from "./thingsboard-api";

export enum AggregationType {
  MEDIAN = "meadian",
  MAX = "max",
  LATEST = "latest",
  MODE = "mode",
  AVERAGE = "average",
  MIN = "min",
  SUM = "sum",
}

export interface DataPointConfigs {
  [dataPoint: string]: {
    aggregationType: AggregationType;
    fractionDigits?: number;
    rawValueTransformer?: (value: number) => number;
  };
}

export interface ProcessedData {
  timestamps: number[];
  entries: {
    [dataPoint: string]: ProcessedDataEnty;
  };
  latestTimestamp?: number;
}

export interface ProcessedDataEnty {
  values: number[];
  latestValue?: number;
}

interface GroupedData {
  [time: number]: {
    [dataPoint: string]: number[];
  };
}

const ONE_MINUTE = 1000 * 60;

const ONE_HOUR = ONE_MINUTE * 60;

export function processData(
  telemetryTimeSeries: TelemetryTimeSeries,
  timeRange: TimeRange,
  dataPointConfigs: DataPointConfigs
): ProcessedData {
  const validDataKeyNames = Object.keys(dataPointConfigs).filter(
    (keyName) => keyName in telemetryTimeSeries
  );

  if (validDataKeyNames.length === 0) {
    console.error("Error: No valid data keys found in rawData");
    return { timestamps: [], entries: {} };
  }

  let latestTimestamp = 0;
  const groupedData: GroupedData = validDataKeyNames.reduce(
    (result: GroupedData, dataKey: string) => {
      const dataValues = telemetryTimeSeries[dataKey];
      const maxTs = Math.max(...dataValues.map((a) => a.ts));
      if (maxTs > latestTimestamp) {
        latestTimestamp = maxTs;
      }
      const groupedData = groupDataByTimeRange(dataValues, timeRange);
      for (const [time, values] of Object.entries(groupedData)) {
        const timeKey = Number(time);
        if (!result[timeKey]) {
          result[timeKey] = {};
        }
        result[timeKey][dataKey] = values;
      }

      return result;
    },
    {}
  );

  const timestamps: number[] = [];
  const entries: { [key: string]: ProcessedDataEnty } = {};
  validDataKeyNames.forEach((key) => {
    entries[key] = { values: [] };
  });

  Object.keys(groupedData)
    .sort()
    .forEach((timeKey) => {
      const dataPoints = groupedData[timeKey as unknown as keyof GroupedData];

      timestamps.push(Number(timeKey));

      validDataKeyNames.forEach((dataKeyName) => {
        const values = dataPoints[dataKeyName] || [];
        let result = aggregateData(
          values,
          dataPointConfigs[dataKeyName].aggregationType
        );

        if (result === undefined) {
          return;
        }

        const latestIndex = telemetryTimeSeries[dataKeyName].length - 1;
        let latestValue = Number(
          telemetryTimeSeries[dataKeyName][latestIndex].value
        );

        const valueTransformFn = dataPointConfigs[dataKeyName].rawValueTransformer;
        if (valueTransformFn) {
          result = valueTransformFn(result);
          latestValue = valueTransformFn(latestValue);
        }

        const fractionDigits = dataPointConfigs[dataKeyName].fractionDigits;
        if (fractionDigits !== undefined && typeof result === "number") {
          result = Number(result.toFixed(fractionDigits));
          latestValue = Number(latestValue.toFixed(fractionDigits));
        }

        entries[dataKeyName].latestValue = latestValue;
        entries[dataKeyName].values.push(result);
      });
    });
  return { timestamps, entries, latestTimestamp };
}

function aggregateData(
  values: number[],
  aggregationType: AggregationType
): number | undefined {
  switch (aggregationType) {
    case AggregationType.MEDIAN:
      return calculateMedian(values);
    case AggregationType.MIN:
      return calculateMin(values);
    case AggregationType.MAX:
      return calculateMax(values);
    case AggregationType.MODE:
      return calculateMode(values);
    case AggregationType.AVERAGE:
      return calculateAverage(values);
    case AggregationType.SUM:
      return calculateSum(values);
    case AggregationType.LATEST:
      return calculateLatest(values);
    default:
      return undefined;
  }
}


function groupDataByTimeRange(
  telemetryItems: TelemetryItem[],
  timeRange: TimeRange
) {
  const result: {
    [timestamp: number]: number[];
  } = {};

  let groupingInterval = ONE_HOUR;
  if (timeRange === TimeRange.ONE_DAY) {
    groupingInterval = 20 * ONE_MINUTE;
  } else if (timeRange === TimeRange.THREE_DAYS) {
    groupingInterval = 1 * ONE_HOUR;
  } else if (timeRange === TimeRange.ONE_WEEK) {
    groupingInterval = 3 * ONE_HOUR;
  } else if (timeRange === TimeRange.TWO_WEEKS) {
    groupingInterval = 6 * ONE_HOUR;
  } else if (timeRange === TimeRange.ONE_MONTH) {
    groupingInterval = 12 * ONE_HOUR;
  }

  telemetryItems.forEach((telemetryItem) => {
    const telemetryDate = new Date(telemetryItem.ts);
    const telemetryTimestamp = telemetryDate.getTime();

    // Calculate the start of the day
    const startOfDay = new Date(telemetryDate);
    startOfDay.setHours(0, 0, 0, 0);

    // Calculate the offset from the start of the day
    const offsetFromStartOfDay = telemetryTimestamp - startOfDay.getTime();

    // Calculate the group timestamp
    const groupIndex = Math.floor(offsetFromStartOfDay / groupingInterval);
    const groupTimestamp = startOfDay.getTime() + groupIndex * groupingInterval;

    if (!result[groupTimestamp]) {
      result[groupTimestamp] = [];
    }
    result[groupTimestamp].push(parseFloat(telemetryItem.value));
  });

  return result;
}
