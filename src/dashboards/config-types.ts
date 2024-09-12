import { DataPointConfigs } from "../api/data-processing";
import { AdditionalContextConfig, ChartSettings, OverviewCardConfig } from "../components/dashboard/Dashboard";

export interface DashboardConfig {
    deviceId: string;
    dataPointConfigs: DataPointConfigs;
    additionalContextDataConfig: AdditionalContextConfig[];
    chartConfigs: ChartSettings[];
    overviewCardConfigs: OverviewCardConfig[];
}
