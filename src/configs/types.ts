import { DataPointConfigs } from "../api/data-processing";
import { AdditionalContextConfig, ChartConfig, OverviewCardConfig } from "../components/dashboard/Dashboard";

export interface DashboardConfig {
    deviceId: string;
    dataPointConfigs: DataPointConfigs;
    additionalContextDataConfig: AdditionalContextConfig[];
    chartConfigs: ChartConfig[];
    overviewCardConfigs: OverviewCardConfig[];
  }
  