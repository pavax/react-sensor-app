import React from "react";
import { useParams } from "react-router-dom";

import { TimeRange } from "../../api/thingsboard-api";
import indoorSensorConfigJson from "../../custom_config/indoor-dashboard.json";
import outdoorSensorConfigJson from "../../custom_config/outdoor-dashboard.json";
import waterSensorConfigJson from "../../custom_config/wassertank-dashboard.json";
import { transformJsonConfig } from "../../dashboards/config-transformer";
import Dashboard from "../dashboard/Dashboard";

interface DashboardProps {
  timeRange: TimeRange;
}

const configMap: { [key: string]: any } = {
  outdoor: outdoorSensorConfigJson,
  indoor: indoorSensorConfigJson,
  water: waterSensorConfigJson,
};

const DashboardPage: React.FC<DashboardProps> = ({ timeRange }) => {
  const { dashboardId } = useParams<{ dashboardId: string }>();

  const jsonConfig = configMap[dashboardId || ""];

  if (!jsonConfig) {
    return <div>Error: Invalid dashboard ID</div>;
  }

  const dashboardConfig = transformJsonConfig(jsonConfig);

  return <Dashboard timeRange={timeRange} dashboardConfig={dashboardConfig} />;
};

export default DashboardPage;
