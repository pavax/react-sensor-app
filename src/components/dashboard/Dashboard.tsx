import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { format } from "date-fns-tz";
import React, { useEffect, useState, useMemo } from "react";
import {
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
import ContextInfoBar from "./ContextInforBar";
import OverviewCards, { OverviewCardData } from "./OverviewCards";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface DashboardProps {
  deviceId: string;
  timeRange: TimeRange;
  dataPointConfigs: DataPointConfigs;
  additionalContextDataConfig: AdditionalContextConfig[];
  chartConfigs: ChartConfig[];
  overviewCardConfigs: OverviewCardConfig[];
}

export interface ChartConfig {
  title: string;
  icon: IconDefinition;
  component: React.ComponentType<{ data: ProcessedData; timeRange: TimeRange }>;
}

export interface AdditionalContextConfig {
  label: string;
  key: (processedData: ProcessedData) => string;
}

export interface OverviewCardConfig {
  title: string;
  value: (data: ProcessedData) => string;
  unit: string;
  icon: IconDefinition;
  color: string;
}

const Dashboard: React.FC<DashboardProps> = ({
  deviceId,
  timeRange,
  dataPointConfigs,
  additionalContextDataConfig,
  chartConfigs,
  overviewCardConfigs, // Add this line
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [error, setError] = useState<string | null>(null);

  const [rawTelemetryData, setRawTelemetryData] =
    useState<TelemetryTimeSeries | null>(null);

  const [processedTelemetryData, setProcessedTelemetryData] =
    useState<ProcessedData | null>(null);

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
    return overviewCardConfigs.map((config) => ({
      ...config,
      value: config.value(processedTelemetryData),
    }));
  }, [processedTelemetryData, overviewCardConfigs]);

  const contextAdditionalData = useMemo(() => {
    if (!processedTelemetryData) return new Map<string, string>();
    return new Map<string, string>(
      additionalContextDataConfig.map((config) => [
        config.label,
        config.key(processedTelemetryData),
      ])
    );
  }, [processedTelemetryData, additionalContextDataConfig]);

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
