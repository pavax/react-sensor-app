import { Parser } from 'expr-eval';
import { ProcessedData } from "../api/data-processing";

const parser = new Parser();

type DSLFunction = (data: ProcessedData, args: string[]) => number | string;

const dslFunctions: Record<string, DSLFunction> = {
  SUM: (data, args) => {
    const key = args[0];
    return data.entries[key]?.values.reduce((sum, value) => sum + value, 0) ?? 0;
  },
  LATEST: (data, args) => {
    const key = args[0];
    return data.entries[key]?.latestValue ?? 0;
  },
  CONSTANT: (_, args) => args[0],
};

export function transformRawValue(expression: string, rawValue: number): number {
  const expr = parser.parse(expression);
  return expr.evaluate({ x: rawValue });
}

export function evaluateDSL(expression: string, data: ProcessedData): number | string {
  const match = expression.match(/(\w+)\((.*?)\)/);
  if (!match) {
    return expression
  }; 

  const [, funcName, argsString] = match;
  const args = argsString.split(',').map(arg => arg.trim());

  const func = dslFunctions[funcName];
  if (!func) throw new Error(`Unknown function: ${funcName}`);

  return func(data, args);
}