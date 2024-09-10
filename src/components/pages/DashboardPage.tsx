import React from "react";
import { useParams } from "react-router-dom";
import Dashboard from "../dashboard/Dashboard";
import { TimeRange } from "../../api/thingsboard-api";
import outdoorDashboardConfig from "../../configs/outdoorSensorConfig";
import { DashboardConfig } from "../../configs/types";


interface DashboardPageData {
  timeRange: TimeRange;
}

const configMap: { [key: string]: DashboardConfig } = {
  outdoor: outdoorDashboardConfig,
};

const DashboardPage: React.FC<DashboardPageData> = ({ timeRange }) => {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  
  const dashboardConfig = configMap[dashboardId || ""];

  if (!dashboardConfig) {
    return <div>Error: Invalid dashboard ID</div>;
  }

  return (
    <Dashboard
      deviceId={dashboardConfig.deviceId}
      timeRange={timeRange}
      dataPointConfigs={dashboardConfig.dataPointConfigs}
      additionalContextDataConfig={dashboardConfig.additionalContextDataConfig}
      chartConfigs={dashboardConfig.chartConfigs}
      overviewCardConfigs={dashboardConfig.overviewCardConfigs}
    />
  );
};

export default DashboardPage;
