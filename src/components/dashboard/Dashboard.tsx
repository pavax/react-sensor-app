import {
  faCloud,
  faCloudRain,
  faSnowflake,
  faSun,
  faTachometerAlt,
  faTemperatureLow,
  faThermometerHalf,
  faWater,
  faWind,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { format } from "date-fns-tz";
import React, { useEffect, useState, useMemo } from "react";
import {
  AggregationType,
  DataPointConfigs,
  processData,
  ProcessedData,
} from "../../api/data-processing";
import {
  fetchTelemetry,
  subscribeToTelemetry as subscribeToDeviceTelemetry,
  TelemetryItem,
  TelemetryTimeSeries,
  TimeRange,
} from "../../api/thingsboard-api";
import CloudBaseHeightChart from "../charts/CloudBaseHeightChart";
import LightChart from "../charts/LightChart";
import RainEventChart from "../charts/RainEventChart";
import TemperatureChart from "../charts/TemperatureChart";
import WindChart from "../charts/WindChart";
import ContextInfoBar from "./ContextInforBar";
import OverviewCards, { OverviewCardData } from "./OverviewCards";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface DashboardProps {
  deviceId: string;
  timeRange: TimeRange;
}

interface ChartConfig {
  title: string;
  icon: IconDefinition;
  component: React.ComponentType<{ data: ProcessedData; timeRange: TimeRange }>;
}

interface AdditionalContextDataConfig {
  label: string;
  key: (data: ProcessedData) => string;
}

const Dashboard: React.FC<DashboardProps> = ({ deviceId, timeRange }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [error, setError] = useState<string | null>(null);

  const [rawTelemetryData, setRawTelemetryData] =
    useState<TelemetryTimeSeries | null>(null);

  const [processedTelemetryData, setProcessedTelemetryData] =
    useState<ProcessedData | null>(null);

  const dataPointConfigs = useMemo<DataPointConfigs>(
    () => ({
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
        valueTransformFn: (voltage: any) => (voltage / 1000) * 14,
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
    }),
    []
  );

  const processAndSetTelemetryData = useMemo(() => {
    return (rawData: TelemetryTimeSeries) => {
      setProcessedTelemetryData(
        processData(rawData, timeRange, dataPointConfigs)
      );
    };
  }, [timeRange, dataPointConfigs]);

  useEffect(() => {
    // This effect fetches initial telemetry data when the component mounts or when deviceId or timeRange changes
    const fetchRawTelemetryData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const rawTelemetryData: TelemetryTimeSeries = await fetchTelemetry(
          deviceId,
          25000,
          timeRange,
          ...Object.keys(dataPointConfigs)
        );
        setRawTelemetryData(rawTelemetryData);
      } catch (err) {
        setError("Failed to fetch initial telemetry data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRawTelemetryData();
  }, [deviceId, timeRange, dataPointConfigs]);

  useEffect(() => {
    // This effect subscribes to real-time telemetry updates for the device
    // and updates the raw telemetry data state when new data is received
    const wsUnsubscribe = subscribeToDeviceTelemetry(
      deviceId,
      (newRawTelemetryData) => {
        setRawTelemetryData(
          (prevRawTelemetryData: TelemetryTimeSeries | null) => {
            if (!prevRawTelemetryData) {
              return null;
            }
            const result = { ...prevRawTelemetryData };
            for (const [telemetryKey, subscriptionData] of Object.entries(
              newRawTelemetryData
            )) {
              if (result[telemetryKey] === undefined) {
                continue;
              }
              if (!Array.isArray(subscriptionData)) {
                console.log("Unsupported format from ws response");
                continue;
              }
              const subscriptionValues = subscriptionData as unknown as Array<
                Array<any>
              >;
              const newTelemetryItems: TelemetryItem[] = subscriptionValues
                .map((entry) => ({ ts: entry[0], value: entry[1] }))
                .filter((item) => filterExisting(telemetryKey, item));

              result[telemetryKey] = [
                ...result[telemetryKey],
                ...newTelemetryItems,
              ];
            }
            return result;

            function filterExisting(telemetryKey: string, item: TelemetryItem) {
              return !result[telemetryKey].some(
                (existingItem) => existingItem.ts === item.ts
              );
            }
          }
        );
      }
    );
    return wsUnsubscribe;
  }, [deviceId]);

  useEffect(() => {
    if (rawTelemetryData) {
      processAndSetTelemetryData(rawTelemetryData);
    }
  }, [rawTelemetryData, processAndSetTelemetryData]);

  const overviewCards: OverviewCardData[] = useMemo(() => {
    if (!processedTelemetryData) return [];
    return [
      {
        title: "Temperatur",
        value:
          processedTelemetryData.entries.temperature?.latestValue?.toFixed(0) ??
          "--",
        unit: "°C",
        icon: faTemperatureLow,
        color: "#8e44ad",
      },
      {
        title: "Feuchtigkeit",
        value:
          processedTelemetryData.entries.humidity?.latestValue?.toFixed(0) ??
          "--",
        unit: "%",
        icon: faWater,
        color: "#1abc9c",
      },
      {
        title: "Wind",
        value:
          processedTelemetryData.entries.windVoltageMax?.latestValue?.toFixed(
            0
          ) ?? "--",
        unit: "m/s",
        icon: faWind,
        color: "#3498db",
      },
      {
        title: "Regen",
        value:
          processedTelemetryData.entries.rainEventAccDifference.values.reduce(
            (sum, value) => sum + value,
            0
          ) ?? "--",
        unit: "mm",
        icon: faCloudRain,
        color: "#2ecc71",
      },
      {
        title: "Luftdruck",
        value:
          processedTelemetryData.entries.pressure?.latestValue?.toFixed(0) ??
          "--",
        unit: "hpa",
        icon: faTachometerAlt,
        color: "#e74c3c",
      },
      {
        title: "Schnee",
        value: "--",
        unit: "",
        icon: faSnowflake,
        color: "#34495e",
      },
      {
        title: "UV-Index",
        value:
          processedTelemetryData.entries.uvIndex?.latestValue?.toFixed(0) ??
          "--",
        unit: "",
        icon: faSun,
        color: "#f39c12",
      },
      {
        title: "Cloudbase Height",
        value:
          processedTelemetryData.entries.cloudBaseHeight?.latestValue?.toFixed(
            0
          ) ?? "--",
        unit: "m",
        icon: faCloud,
        color: "#7f8c8d",
      },
    ];
  }, [processedTelemetryData]);

  if (isLoading && !processedTelemetryData) {
    return <div>Loading telemetry data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!processedTelemetryData?.entries) {
    return <div>No telemetry data available</div>;
  }

  const contextLatestTime = format(
    new Date(processedTelemetryData.latestTimestamp ?? Date.now()),
    "dd.MM.yyyy HH:mm",
    {
      timeZone: "Europe/Zurich",
    }
  );

  const additionalContextDataConfig: AdditionalContextDataConfig[] = [
    {
      label: "Device-Uptime Count",
      key: (data) => data.entries.counter.latestValue?.toString() ?? "0",
    },
    {
      label: "Batterie",
      key: (data) =>
        `${data.entries.batteryVoltage.latestValue?.toString() ?? "0"}mv`,
    },
    {
      label: "Gehäuse Temp.",
      key: (data) =>
        `${
          data.entries.temperature2.latestValue?.toString() ?? "0"
        }°C`
    },
    {
      label: "Gehäuse Hum.",
      key: (data) =>
        `${
          data.entries.humidity2.latestValue?.toString() ?? "0"
        }%`
    },
  ];

  const contextAdditionalData = new Map<string, string>(
    additionalContextDataConfig.map(config => [
      config.label,
      config.key(processedTelemetryData)
    ])
  );

  const chartConfigs: ChartConfig[] = [
    {
      title: "Temperatur",
      icon: faThermometerHalf,
      component: TemperatureChart,
    },
    {
      title: "Wind",
      icon: faWind,
      component: WindChart,
    },
    {
      title: "Regen",
      icon: faCloudRain,
      component: RainEventChart,
    },
    {
      title: "Licht",
      icon: faSun,
      component: LightChart,
    },
    {
      title: "Cloud Base Height",
      icon: faCloud,
      component: CloudBaseHeightChart,
    },
  ];

  return (
    <>
      <div className="telemetry-grid">
        <ContextInfoBar
          main={contextLatestTime}
          additionalData={contextAdditionalData}
        />

        <OverviewCards cards={overviewCards} />

        {chartConfigs.map((config, index) => (
          <div key={index} className="telemetry-container">
            <h3>
              <FontAwesomeIcon icon={config.icon} /> {config.title}
            </h3>
            <div className="chart-container">
              <config.component
                data={processedTelemetryData}
                timeRange={timeRange}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Dashboard;
