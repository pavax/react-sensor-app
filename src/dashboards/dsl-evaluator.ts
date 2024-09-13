import { Parser } from "expr-eval";

import { ProcessedData } from "../api/data-processing";
import {
  calculateAverage,
  calculateMax,
  calculateMedian,
  calculateMin,
  calculateMode,
} from "../common/math-utils";

const parser = new Parser();

parser.functions.max = Math.max;

type DSLFunction = (data: ProcessedData, args: string[]) => number | string;

const dslFunctions: Record<string, DSLFunction> = {
  SUM: (data, args) => {
    const key = args[0];
    return (
      data.entries[key]?.values.reduce((sum, value) => sum + value, 0) ?? 0
    );
  },
  LATEST: (data, args) => {
    const key = args[0];
    return data.entries[key]?.latestValue ?? 0;
  },
  MIN: (data, args) => {
    const key = args[0];
    return calculateMin(data.entries[key].values);
  },
  MAX: (data, args) => {
    const key = args[0];
    return calculateMax(data.entries[key].values);
  },
  AVERAGE: (data, args) => {
    const key = args[0];
    return calculateAverage(data.entries[key].values);
  },
  MEDIAN: (data, args) => {
    const key = args[0];
    return calculateMedian(data.entries[key].values);
  },
  MODE: (data, args) => {
    const key = args[0];
    return calculateMode(data.entries[key].values);
  },
};

export function transformRawValue(
  expression: string,
  rawValue: number
): number {
  if (!expression) {
    return rawValue;
  }

  try {
    const expr = parser.parse(expression);
    return expr.evaluate({
      x: rawValue,
    });
  } catch (error) {
    console.error(
      `Error evaluating transform expression: ${expression}`,
      error
    );
    return rawValue;
  }
}

export function evaluateDSL(expression: string, data: ProcessedData): string {
  const match = expression.match(
    /(.*?)\s*(SUM|LATEST|MIN|MAX|AVERAGE|MEDIAN|MODE)\((.*?)\)\s*(.*)/
  );
  if (!match) {
    return expression;
  }

  const [, prefix, funcName, argsString, suffix] = match;
  const args = argsString.split(",").map((arg) => arg.trim());

  const func = dslFunctions[funcName];
  if (!func) throw new Error(`Unknown function: ${funcName}`);

  const evaluatedResult = func(data, args);

  // Concatenate prefix, evaluated result, and suffix
  return `${prefix.trim()} ${evaluatedResult} ${suffix.trim()}`.trim();
}
