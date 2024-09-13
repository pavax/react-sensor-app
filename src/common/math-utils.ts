
export function calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = values.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    return sorted[middle];
  }
  
  export function calculateMax(values: number[]): number {
    return Math.max(...values);
  }
  
  export function calculateMin(values: number[]): number {
    return Math.min(...values);
  }
  
  export function calculateMode(values: number[]): number {
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
  
  export function calculateAverage(values: number[]): number {
    return values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0;
  }
  
  export function calculateSum(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0);
  }
  
  export function calculateLatest(values: number[]): number {
    return values.length ? values[values.length - 1] : 0;
  }

  export function calculateTrendLine(values: number[]): number[] {
    const n = values.length;
    const sumX = values.reduce((acc, _, i) => acc + i, 0);
    const sumY = values.reduce((acc, y) => acc + y, 0);
    const sumXY = values.reduce((acc, y, i) => acc + i * y, 0);
    const sumX2 = values.reduce((acc, _, i) => acc + i * i, 0);
  
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
  
    return values.map((_, i) => slope * i + intercept);
  }