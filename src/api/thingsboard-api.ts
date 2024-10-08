const TB_URL = process.env.REACT_APP_TB_URL || "";

const API_URL = `${TB_URL}/api/plugins/telemetry/DEVICE/%id%/values/timeseries`;

let AUTH_TOKEN = "";

interface LoginResponse {
  token: string;
}

export interface TelemetryItem {
  ts: number;
  value: string;
}

export interface TelemetryTimeSeries {
  [dataPoint: string]: TelemetryItem[];
}

export enum TimeRange {
  ONE_DAY = "ONE_DAY",
  THREE_DAYS = "THREE_DAYS",
  ONE_WEEK = "ONE_WEEK",
  TWO_WEEKS = "TWO_WEEKS",
  ONE_MONTH = "ONE_MONTH",
}

export async function loginPublic(publicId: string): Promise<void> {
  const response = await fetch(`${TB_URL}/api/auth/login/public`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId }),
  });
  if (!response.ok) throw new Error("Login failed");
  const { token }: LoginResponse = await response.json();
  AUTH_TOKEN = token;
}

export async function login(username: string, password: string): Promise<void> {
  const response = await fetch(`${TB_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) throw new Error("Login failed");
  const { token }: LoginResponse = await response.json();
  AUTH_TOKEN = token;
}

export async function fetchTelemetry(
  deviceId: string,
  maxItems: number,
  timeRange: TimeRange,
  ...keys: string[]
): Promise<TelemetryTimeSeries> {
  if (!AUTH_TOKEN) throw new Error("Not authenticated. Please login first.");

  const endTs = Date.now();

  const startTs = endTs - getTimeRangeMilliseconds(timeRange);

  const url = new URL(API_URL.replace("%id%", deviceId));

  url.search = new URLSearchParams({
    keys: keys.join(","),
    startTs: startTs.toString(),
    endTs: endTs.toString(),
    limit: maxItems.toString(),
    orderBy: "ASC",
  }).toString();

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
  });

  return response.json();
}

export function getTimeRangeMilliseconds(range: TimeRange): number {
  switch (range) {
    case TimeRange.ONE_DAY:
      return 1 * 24 * 60 * 60 * 1000;
    case TimeRange.THREE_DAYS:
      return 3 * 24 * 60 * 60 * 1000;
    case TimeRange.ONE_WEEK:
      return 7 * 24 * 60 * 60 * 1000;
    case TimeRange.TWO_WEEKS:
      return 14 * 24 * 60 * 60 * 1000;
    case TimeRange.ONE_MONTH:
      return 30 * 24 * 60 * 60 * 1000;
  }
}

export function subscribeToTelemetry(
  deviceId: string,
  callback: (data: TelemetryTimeSeries) => void
): () => void {
  if (!AUTH_TOKEN) throw new Error("Not authenticated. Please login first.");

  let ws: WebSocket | null = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectDelay = 5000;

  const connect = () => {
    ws = new WebSocket(`${TB_URL.replace('http', 'ws')}/api/ws/plugins/telemetry?token=${AUTH_TOKEN}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      reconnectAttempts = 0;
      const subscriptionCommand = {
        tsSubCmds: [
          {
            entityType: "DEVICE",
            entityId: deviceId,
            scope: "LATEST_TELEMETRY",
            cmdId: 10
          }
        ],
        historyCmds: [],
        attrSubCmds: []
      };
      ws?.send(JSON.stringify(subscriptionCommand));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.subscriptionId === 10) {
        callback(data.data);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.reason);
      if (reconnectAttempts < maxReconnectAttempts) {
        setTimeout(() => {
          reconnectAttempts++;
          connect();
        }, reconnectDelay);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  connect();

  return () => {
    if (ws) {
      ws.close();
    }
  };
}
