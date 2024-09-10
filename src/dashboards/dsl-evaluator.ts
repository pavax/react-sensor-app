import { ProcessedData } from "../api/data-processing";

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
  MULTIPLY: (data, args) => {
    return args.reduce((product, arg) => product * Number(evaluateDSL(arg, data)), 1);
  },
  DIVIDE: (data, args) => {
    return args.reduce((quotient, arg, index) => 
      index === 0 ? Number(evaluateDSL(arg, data)) : quotient / Number(evaluateDSL(arg, data))
    , 0);
  },
  CONSTANT: (_, args) => args[0],
};

export function evaluateDSL(expression: string, data: ProcessedData): number | string {
  const match = expression.match(/(\w+)\((.*?)\)/);
  if (!match) return expression; // If it's not a function, return as is

  const [, funcName, argsString] = match;
  const args = argsString.split(',').map(arg => arg.trim());

  const func = dslFunctions[funcName];
  if (!func) throw new Error(`Unknown function: ${funcName}`);

  return func(data, args);
}