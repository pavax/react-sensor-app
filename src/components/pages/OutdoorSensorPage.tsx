import React from "react";
import Dashboard from "../dashboard/Dashboard";
import { TimeRange } from "../../api/thingsboard-api";

interface OutdoorSensorPageProps {
  timeRange: TimeRange;
}

const OutdoorSensorPage: React.FC<OutdoorSensorPageProps> = ({ timeRange }) => {
  const deviceId = process.env.REACT_APP_API_DEVICE_ID;

  if (!deviceId) {
    return (
      <div>Error: REACT_APP_API_DEVICE_ID is not set in the .env file</div>
    );
  }
  return (
    <>
      <Dashboard deviceId={deviceId} timeRange={timeRange}></Dashboard>
    </>
  );
};

export default OutdoorSensorPage;
