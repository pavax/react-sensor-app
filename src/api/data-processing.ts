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

export interface KeyInfo {
  [dataPoint: string]: {
    aggregationType: AggregationType;
    fractionDigits?: number;
    valueTransformFn?: (value: number) => number;
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

const ONE_DAY = ONE_HOUR * 24;

export function processData(
  telemetryTimeSeries: TelemetryTimeSeries,
  timeRange: TimeRange,
  keyInfo: KeyInfo
): ProcessedData {
  const validDataKeyNames = Object.keys(keyInfo).filter(
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
          keyInfo[dataKeyName].aggregationType
        );

        if (result === undefined) {
          return;
        }

        const latestIndex = telemetryTimeSeries[dataKeyName].length - 1;
        let latestValue = Number(
          telemetryTimeSeries[dataKeyName][latestIndex].value
        );

        const valueTransformFn = keyInfo[dataKeyName].valueTransformFn;
        if (valueTransformFn) {
          result = valueTransformFn(result);
          latestValue = valueTransformFn(latestValue);
        }

        const fractionDigits = keyInfo[dataKeyName].fractionDigits;
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

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function calculateMax(values: number[]): number {
  return Math.max(...values);
}

function calculateMin(values: number[]): number {
  return Math.min(...values);
}

function calculateMode(values: number[]): number {
  const counts = new Map<number, number>();
  let maxCount = 0;
  let result = values[0];

  for (const value of values) {
    const count = (counts.get(value) || 0) + 1;
    counts.set(value, count);
    if (count > maxCount) {
      maxCount = count;
      result = value;
    }
  }

  return result;
}

function calculateAverage(values: number[]): number {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

function calculateSum(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0);
}

function calculateLatest(values: number[]): number {
  return values.length ? values[values.length - 1] : 0;
}

function groupDataByTimeRange(
  telemetryItems: TelemetryItem[],
  timeRange: TimeRange
) {
  const result: {
    [timestamp: number]: number[];
  } = {};

  let groupingInterval = 3600000;
  if (timeRange === TimeRange.ONE_DAY) {
    groupingInterval = ONE_HOUR / 2;
  } else if (timeRange === TimeRange.THREE_DAYS) {
    groupingInterval = ONE_HOUR * 3;
  } else if (timeRange === TimeRange.ONE_WEEK) {
    groupingInterval = ONE_HOUR * 6;
  } else if (timeRange === TimeRange.TWO_WEEKS) {
    groupingInterval = ONE_HOUR * 12;
  } else if (timeRange === TimeRange.ONE_MONTH) {
    groupingInterval = ONE_DAY;
  }

  telemetryItems.forEach((telemetryItem) => {
    const timestamp =
      Math.floor(telemetryItem.ts / groupingInterval) * groupingInterval;
    if (!result[timestamp]) {
      result[timestamp] = [];
    }
    result[timestamp].push(parseFloat(telemetryItem.value));
  });

  return result;
}
