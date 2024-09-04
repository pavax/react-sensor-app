import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { ProcessedData } from "../../api/data-processing";
import { ChartOptions } from "chart.js";
import { TimeRange } from "../../api/thingsboard-api";
import { format } from 'date-fns-tz';
import { formatAsNumber, getTimeUnit, useChartStyles } from "./chart-utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface TelemetryChartsProps {
  data: ProcessedData;
  timeRange: TimeRange;
  theme: 'light' | 'dark';
}

function calculateTrendLine(values: number[]): number[] {
  const n = values.length;
  const sumX = values.reduce((acc, _, i) => acc + i, 0);
  const sumY = values.reduce((acc, y) => acc + y, 0);
  const sumXY = values.reduce((acc, y, i) => acc + i * y, 0);
  const sumX2 = values.reduce((acc, _, i) => acc + i * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return values.map((_, i) => slope * i + intercept);
}

const TemperatureChart: React.FC<TelemetryChartsProps> = ({
  data,
  timeRange,
  theme
}) => {

  const chartStyles = useChartStyles(theme);

  if (!data || !data.entries) {
    return <div>No data available</div>;
  }

  const temperatureData: ChartData<"line"> = {
    labels: data.timestamps,
    datasets: [
      {
        label: "Temperature",
        data: data.entries.temperature?.values ?? [],
        borderColor: chartStyles.lineColor,
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        yAxisID: "y0",
      },
      {
        label: "Dew Point",
        data: data.entries.dewPoint?.values ?? [],
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        yAxisID: "y0",
        type: "line",
        pointStyle: "triangle",
        pointRadius: 5,
        showLine: false,
      },
      {
        label: "Temperature Trend",
        data: calculateTrendLine(data.entries.temperature?.values ?? []),
        borderColor: "rgba(255, 99, 132, 0.5)",
        backgroundColor: "rgba(255, 99, 132, 0.1)",
        yAxisID: "y0",
        type: "line",
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      },
      {
        label: "Humidity",
        data: data.entries.humidity?.values ?? [],
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgb(54, 162, 235)",
        yAxisID: "y1",
        type: "line",
        pointStyle: "triangle",
        pointRadius: 0,
        showLine: true,
        borderWidth: 0.5,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: chartStyles.textColor,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: true,
        callbacks: {
          title: (tooltipItems) =>
            format(new Date(tooltipItems[0].parsed.x), 'dd.MM.yyyy HH:mm', {
              timeZone: 'Europe/Zurich',
            }),
          label: (context) => {
            if (context.dataset.label === 'Temperature Trend') {
              return '';
            }
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatAsNumber(context.parsed.y);
              if (context.datasetIndex === 3) {
                label += '%';
              } else {
                label += '°C';
              }
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: getTimeUnit(timeRange),
          displayFormats: {
            hour: "HH:mm",
            day: "dd.MM",
            week: "dd.MM",
          },
        },
        ticks: {
          color: chartStyles.textColor,
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          font: {
            size: 8,
          },
        },
        grid: {
          color: chartStyles.gridColor,
        },
      },
      y0: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        ticks: {
          color: chartStyles.textColor,
          font: {
            size: 8,
          },
          
        },
        grid: {
          color: chartStyles.gridColor,
        },
      },
      y1: {
        type: "linear" as const,
        display: false,
        position: "right" as const,
        ticks: {
          color: chartStyles.textColor,
          font: {
            size: 8,
          },
        },
        grid: {
          color: chartStyles.gridColor,
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div>
      <div style={{ width: "100%", minHeight: "400px", marginBottom: "20px" }}>
        <Line options={options} data={temperatureData} />
      </div>
    </div>
  );
};

export default TemperatureChart;
