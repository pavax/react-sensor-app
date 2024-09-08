import React, { useMemo } from "react";
import Dashboard, {
  AdditionalContextConfig,
  ChartConfig,
  OverviewCardConfig,
} from "../dashboard/Dashboard";
import { TimeRange } from "../../api/thingsboard-api";
import { AggregationType, DataPointConfigs } from "../../api/data-processing";
import {
  faThermometerHalf,
  faWind,
  faCloudRain,
  faSun,
  faCloud,
  faTemperatureLow,
  faWater,
  faTachometerAlt,
  faSnowflake,
} from "@fortawesome/free-solid-svg-icons";
import CloudBaseHeightChart from "../charts/CloudBaseHeightChart";
import LightChart from "../charts/LightChart";
import RainEventChart from "../charts/RainEventChart";
import TemperatureChart from "../charts/TemperatureChart";
import WindChart from "../charts/WindChart";

interface OutdoorSensorPageProps {
  timeRange: TimeRange;
}

const OutdoorSensorPage: React.FC<OutdoorSensorPageProps> = ({ timeRange }) => {
  const deviceId = process.env.REACT_APP_API_DEVICE_ID;

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

  const additionalContextDataConfig: AdditionalContextConfig[] = [
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
        `${data.entries.temperature2.latestValue?.toString() ?? "0"}°C`,
    },
    {
      label: "Gehäuse Hum.",
      key: (data) =>
        `${data.entries.humidity2.latestValue?.toString() ?? "0"}%`,
    },
  ];

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
  
  const overviewCardConfigs: OverviewCardConfig[] = useMemo(() => [
    {
      title: "Temperatur",
      value: (data) => data.entries.temperature?.latestValue?.toFixed(0) ?? "--",
      unit: "°C",
      icon: faTemperatureLow,
      color: "#8e44ad",
    },
    {
      title: "Feuchtigkeit",
      value: (data) => data.entries.humidity?.latestValue?.toFixed(0) ?? "--",
      unit: "%",
      icon: faWater,
      color: "#1abc9c",
    },
    {
      title: "Wind",
      value: (data) => data.entries.windVoltageMax?.latestValue?.toFixed(0) ?? "--",
      unit: "m/s",
      icon: faWind,
      color: "#3498db",
    },
    {
      title: "Regen",
      value: (data) => data.entries.rainEventAccDifference.values.reduce(
        (sum, value) => sum + value,
        0
      ).toString() ?? "--",
      unit: "mm",
      icon: faCloudRain,
      color: "#2ecc71",
    },
    {
      title: "Luftdruck",
      value: (data) => data.entries.pressure?.latestValue?.toFixed(0) ?? "--",
      unit: "hpa",
      icon: faTachometerAlt,
      color: "#e74c3c",
    },
    {
      title: "Schnee",
      value: () => "--",
      unit: "",
      icon: faSnowflake,
      color: "#34495e",
    },
    {
      title: "UV-Index",
      value: (data) => data.entries.uvIndex?.latestValue?.toFixed(0) ?? "--",
      unit: "",
      icon: faSun,
      color: "#f39c12",
    },
    {
      title: "Cloudbase Height",
      value: (data) => data.entries.cloudBaseHeight?.latestValue?.toFixed(0) ?? "--",
      unit: "m",
      icon: faCloud,
      color: "#7f8c8d",
    },
  ], []);

  if (!deviceId) {
    return (
      <div>Error: REACT_APP_API_DEVICE_ID is not set in the .env file</div>
    );
  }
  return (
    <>
      <Dashboard
        deviceId={deviceId}
        timeRange={timeRange}
        dataPointConfigs={dataPointConfigs}
        additionalContextDataConfig={additionalContextDataConfig}
        chartConfigs={chartConfigs}
        overviewCardConfigs={overviewCardConfigs}
      />
    </>
  );
};

export default OutdoorSensorPage;
