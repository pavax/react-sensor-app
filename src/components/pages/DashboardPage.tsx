import React from "react";
import { useParams } from "react-router-dom";
import Dashboard from "../dashboard/Dashboard";
import { TimeRange } from "../../api/thingsboard-api";
import outdoorSensorConfigJson from "../../custom_config/outdoor-dashboard.json"
import { DashboardConfig } from "../../dashboards/config-types";
import { transformJsonConfig } from "../../dashboards/config-transformer";

interface DashboardPageData {
  timeRange: TimeRange;
}

const configMap: { [key: string]: any } = {
  outdoor: outdoorSensorConfigJson,
};

const DashboardPage: React.FC<DashboardPageData> = ({ timeRange }) => {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  
  const jsonConfig = configMap[dashboardId || ""];

  if (!jsonConfig) {
    return <div>Error: Invalid dashboard ID</div>;
  }

  const dashboardConfig: DashboardConfig = transformJsonConfig(jsonConfig);

  return (
    <Dashboard
      timeRange={timeRange}
      dashboardConfig={dashboardConfig}
    />
  );
};

export default DashboardPage;
