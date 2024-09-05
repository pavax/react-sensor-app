import React, { useState, useEffect } from "react";
import {
  fetchTelemetry,
  TelemetryTimeSeries,
  TimeRange,
} from "../api/thingsboard-api";
import {
  processData,
  ProcessedData,
  KeyInfo,
  AggregationType,
} from "../api/data-processing";
import TemperatureChart from "./charts/TemperatureChart";
import RainEventChart from "./charts/RainEventChart ";
import WindChart from "./charts/WindChart";
import LightChart from "./charts/LightChart";
import OverviewCards from "./OverviewCards";

interface TelemetryProps {
  deviceId: string;
  timeRange: TimeRange;
  theme: "light" | "dark";
}

const Telemetry: React.FC<TelemetryProps> = ({
  deviceId,
  timeRange,
  theme,
}) => {
  const [telemetryData, setTelemetryData] = useState<ProcessedData | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const rawData: TelemetryTimeSeries = await fetchTelemetry(
          deviceId,
          20000,
          timeRange,
          "temperature",
          "humidity",
          "dewPoint",
          "windVoltageMax",
          "windDirection",
          "rainEventAccDifference",
          "rainEventAcc",
          "lux",
          "uvIndex"
        );

        const keyInfo: KeyInfo = {
          temperature: {
            aggregationType: AggregationType.AVERAGE,
            fractionDigits: 0,
          },
          humidity: {
            aggregationType: AggregationType.AVERAGE,
            fractionDigits: 0,
          },
          dewPoint: {
            aggregationType: AggregationType.AVERAGE,
            fractionDigits: 0,
          },
          windVoltageMax: {
            aggregationType: AggregationType.MAX,
            fractionDigits: 0,
            valueTransformFn: (voltage) => (voltage / 1000) * 14,
          },
          windDirection: { aggregationType: AggregationType.MODE },
          rainEventAccDifference: {
            aggregationType: AggregationType.SUM,
            fractionDigits: 0,
          },
          rainEventAcc: {
            aggregationType: AggregationType.LATEST,
            fractionDigits: 0,
          },
          lux: { aggregationType: AggregationType.MAX, fractionDigits: 0 },
          uvIndex: { aggregationType: AggregationType.MAX, fractionDigits: 0 },
        };

        const processedData = processData(rawData, timeRange, keyInfo);
        setTelemetryData(processedData);
      } catch (err) {
        setError("Failed to fetch telemetry data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deviceId, timeRange]);

  if (loading) {
    return <div>Loading telemetry data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!telemetryData) {
    return <div>No telemetry data available</div>;
  }

  return (
    <div className="telemetry-grid">
      <OverviewCards data={telemetryData} />

      <div className="telemetry-container">
        <h3>Temperatur</h3>
        <div className="chart-container">
          <TemperatureChart
            data={telemetryData}
            timeRange={timeRange}
            theme={theme}
          />
        </div>
      </div>
      <div className="telemetry-container">
        <h3>Wind</h3>
        <div className="chart-container">
          <WindChart data={telemetryData} timeRange={timeRange} theme={theme} />
        </div>
      </div>
      <div className="telemetry-container">
        <h3>Regen</h3>
        <div className="chart-container">
          <RainEventChart data={telemetryData} timeRange={timeRange} />
        </div>
      </div>
      <div className="telemetry-container">
        <h3>Licht</h3>
        <div className="chart-container">
          <LightChart
            data={telemetryData}
            timeRange={timeRange}
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
};

export default Telemetry;
