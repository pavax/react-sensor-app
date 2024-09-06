import React, { useState, useEffect, useCallback } from "react";
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
import ContextInfoBar from "./ContextInforBar";
import { format } from "date-fns-tz";

interface TelemetryProps {
  deviceId: string;
  timeRange: TimeRange;
}

const INTERVAL = 60_000;

const Telemetry: React.FC<TelemetryProps> = ({ deviceId, timeRange }) => {
  const [telemetryData, setTelemetryData] = useState<ProcessedData | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
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
        "lux",
        "uvIndex",
        "counter"
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
        counter: {
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
  }, [deviceId, timeRange]);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(() => {
      fetchData();
    }, INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  if (loading && !telemetryData) {
    return <div>Loading telemetry data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!telemetryData) {
    return <div>No telemetry data available</div>;
  }

  const formattedTimestamp = format(
    new Date(telemetryData.latestTimestamp ?? Date.now()),
    "dd.MM.yyyy HH:mm",
    {
      timeZone: "Europe/Zurich",
    }
  );
  const additionalData = new Map<string, string>();
  additionalData.set(
    "Device-Uptime Count",
    telemetryData.entries.counter.latestValue?.toString() ?? "0"
  );

  return (
    <div className="telemetry-grid">
      <ContextInfoBar
        main={formattedTimestamp}
        additionalData={additionalData}
      />

      <OverviewCards data={telemetryData} />

      <div className="telemetry-container">
        <h3>Temperatur</h3>
        <div className="chart-container">
          <TemperatureChart data={telemetryData} timeRange={timeRange} />
        </div>
      </div>
      <div className="telemetry-container">
        <h3>Wind</h3>
        <div className="chart-container">
          <WindChart data={telemetryData} timeRange={timeRange} />
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
          <LightChart data={telemetryData} timeRange={timeRange} />
        </div>
      </div>
    </div>
  );
};

export default Telemetry;
