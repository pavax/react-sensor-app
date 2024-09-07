import {
  faCloud,
  faCloudRain,
  faSun,
  faThermometerHalf,
  faWind,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { format } from "date-fns-tz";
import React, { useEffect, useState, useMemo } from "react";
import {
  AggregationType,
  KeyInfo,
  processData,
  ProcessedData,
} from "../api/data-processing";
import {
  fetchTelemetry,
  subscribeToTelemetry as subscribeToDeviceTelemetry,
  TelemetryItem,
  TelemetryTimeSeries,
  TimeRange,
} from "../api/thingsboard-api";
import CloudBaseHeightChart from "./charts/CloudBaseHeightChart";
import LightChart from "./charts/LightChart";
import RainEventChart from "./charts/RainEventChart ";
import TemperatureChart from "./charts/TemperatureChart";
import WindChart from "./charts/WindChart";
import ContextInfoBar from "./ContextInforBar";
import OverviewCards from "./OverviewCards";

interface TelemetryProps {
  deviceId: string;
  timeRange: TimeRange;
}

const Telemetry: React.FC<TelemetryProps> = ({ deviceId, timeRange }) => {
  const [loading, setLoading] = useState<boolean>(true);

  const [error, setError] = useState<string | null>(null);

  const [rawTelemetryData, setRawTelemetryData] =
    useState<TelemetryTimeSeries | null>(null);

  const [processedTelemetryData, setProcessedTelemetryData] =
    useState<ProcessedData | null>(null);

  const processAndSetTelemetryData = useMemo(() => {
    return (rawData: TelemetryTimeSeries) => {
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
        temperature2: {
          aggregationType: AggregationType.LATEST,
          fractionDigits: 0,
        },
        humidity2: {
          aggregationType: AggregationType.LATEST,
          fractionDigits: 0,
        },
        lux: { aggregationType: AggregationType.MAX, fractionDigits: 0 },
        uvIndex: { aggregationType: AggregationType.MAX, fractionDigits: 0 },
        pressure: {
          aggregationType: AggregationType.AVERAGE,
          fractionDigits: 0,
        },
        cloudBaseHeight: {
          aggregationType: AggregationType.AVERAGE,
          fractionDigits: 0,
        },
        batteryVoltage: {
          aggregationType: AggregationType.AVERAGE,
          fractionDigits: 0,
        },
      };

      const processedData = processData(rawData, timeRange, keyInfo);
      setProcessedTelemetryData(processedData);
    };
  }, [timeRange]);

  useEffect(() => {
    // This effect fetches initial telemetry data when the component mounts or when deviceId or timeRange changes
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const rawData: TelemetryTimeSeries = await fetchTelemetry(
          deviceId,
          25000,
          timeRange,
          "temperature",
          "humidity",
          "dewPoint",
          "windVoltageMax",
          "windDirection",
          "rainEventAccDifference",
          "lux",
          "uvIndex",
          "counter",
          "temperature2",
          "humidity2",
          "pressure",
          "cloudBaseHeight",
          "batteryVoltage"
        );
        setRawTelemetryData(rawData);
      } catch (err) {
        setError("Failed to fetch initial telemetry data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [deviceId, timeRange]);

  useEffect(() => {
    // This effect subscribes to real-time telemetry updates for the device
    // and updates the raw telemetry data state when new data is received
    const wsUnsubscribe = subscribeToDeviceTelemetry(
      deviceId,
      (newRawWsData) => {
        setRawTelemetryData((prevRawData: TelemetryTimeSeries | null) => {
          if (!prevRawData) {
            return newRawWsData;
          }
          const result = { ...prevRawData };
          for (const [key, wsValue] of Object.entries(newRawWsData)) {
            if (result[key] === undefined) {
              continue;
            }
            if (!Array.isArray(wsValue)) {
              console.log("Unsupported format from ws response");
              continue;
            }
            const telementryValues = wsValue as unknown as Array<Array<any>>;
            const newTelemetryItems: TelemetryItem[] = telementryValues
              .map((entry) => ({ ts: entry[0], value: entry[1] }))
              .filter(
                (item) =>
                  !result[key].some(
                    (existingItem) => existingItem.ts === item.ts
                  )
              );
            result[key] = [...result[key], ...newTelemetryItems];
          }
          return result;
        });
      }
    );
    return () => {
      wsUnsubscribe();
    };
  }, [deviceId]);

  useEffect(() => {
    if (rawTelemetryData) {
      processAndSetTelemetryData(rawTelemetryData);
    }
  }, [rawTelemetryData, processAndSetTelemetryData]);

  if (loading && !processedTelemetryData) {
    return <div>Loading telemetry data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!processedTelemetryData) {
    return <div>No telemetry data available</div>;
  }

  const contextLatestTime = format(
    new Date(processedTelemetryData.latestTimestamp ?? Date.now()),
    "dd.MM.yyyy HH:mm",
    {
      timeZone: "Europe/Zurich",
    }
  );
  const contextAdditionalData = new Map<string, string>();
  contextAdditionalData.set(
    "Device-Uptime Count",
    processedTelemetryData.entries.counter.latestValue?.toString() ?? "0"
  );
  contextAdditionalData.set(
    "Batterie",
    `${
      processedTelemetryData.entries.batteryVoltage.latestValue?.toString() ??
      "0"
    }mv`
  );
  contextAdditionalData.set(
    "Gehäuse Temp.",
    `${
      processedTelemetryData.entries.temperature2.latestValue?.toString() ?? "0"
    }°C`
  );
  contextAdditionalData.set(
    "Gehäuse Hum.",
    `${
      processedTelemetryData.entries.humidity2.latestValue?.toString() ?? "0"
    }%`
  );

  return (
    <>
      <div className="telemetry-grid">
        <ContextInfoBar
          main={contextLatestTime}
          additionalData={contextAdditionalData}
        />

        <OverviewCards data={processedTelemetryData} />

        <div className="telemetry-container">
          <h3>
            <FontAwesomeIcon icon={faThermometerHalf} /> Temperatur
          </h3>
          <div className="chart-container">
            <TemperatureChart
              data={processedTelemetryData}
              timeRange={timeRange}
            />
          </div>
        </div>
        <div className="telemetry-container">
          <h3>
            <FontAwesomeIcon icon={faWind} /> Wind
          </h3>
          <div className="chart-container">
            <WindChart data={processedTelemetryData} timeRange={timeRange} />
          </div>
        </div>
        <div className="telemetry-container">
          <h3>
            <FontAwesomeIcon icon={faCloudRain} /> Regen
          </h3>
          <div className="chart-container">
            <RainEventChart
              data={processedTelemetryData}
              timeRange={timeRange}
            />
          </div>
        </div>
        <div className="telemetry-container">
          <h3>
            <FontAwesomeIcon icon={faSun} /> Licht
          </h3>
          <div className="chart-container">
            <LightChart data={processedTelemetryData} timeRange={timeRange} />
          </div>
        </div>
        <div className="telemetry-container">
          <h3>
            <FontAwesomeIcon icon={faCloud} /> Cloud Base Height
          </h3>
          <div className="chart-container">
            <CloudBaseHeightChart
              data={processedTelemetryData}
              timeRange={timeRange}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Telemetry;
