import React from "react";
import { useParams } from "react-router-dom";

import { TimeRange } from "../../api/thingsboard-api";
import outdoorSensorConfigJson from "../../custom_config/outdoor-dashboard.json";
import indoorSensorConfigJson from "../../custom_config/indoor-dashboard.json";
import { transformJsonConfig } from "../../dashboards/config-transformer";
import Dashboard from "../dashboard/Dashboard";

interface DashboardProps {
  timeRange: TimeRange;
}

const configMap: { [key: string]: any } = {
  outdoor: outdoorSensorConfigJson,
  indoor: indoorSensorConfigJson,
};

const DashboardPage: React.FC<DashboardProps> = ({ timeRange }) => {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  
  const jsonConfig = configMap[dashboardId || ""];

  if (!jsonConfig) {
    return <div>Error: Invalid dashboard ID</div>;
  }

  const dashboardConfig = transformJsonConfig(jsonConfig);

  return (
    <Dashboard
      timeRange={timeRange}
      dashboardConfig={dashboardConfig}
    />
  );
};

export default DashboardPage;
