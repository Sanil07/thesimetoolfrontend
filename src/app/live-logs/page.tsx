"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import "./live-logs.css";

interface LogData {
  _id: string;
  timestamp: string;
  event: {
    type: string;
    severity: string;
  };
  source: {
    ip: string;
  };
}

interface MetricPoint {
  timestamp: number;
  requestCount: number;
  severityDistribution: {
    low: number;
    medium: number;
    high: number;
    unknown: number;
  };
  systemHealth: {
    errorRate: number;
    avgResponseTime: number;
    cpuUsage: number;
  };
  aiInsights: {
    threatLevel: number;
    anomalyScore: number;
    predictedAttacks: number;
  };
}

export default function LiveLogs() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastTimestamp, setLastTimestamp] = useState<string | null>(null);
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchLogs = async () => {
      try {
        // Fetch logs
        const query = new URLSearchParams();
        if (lastTimestamp) {
          query.set("start", lastTimestamp);
        }

        const res = await fetch(
          `http://127.0.0.1:5000/logs?${query.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch logs");
        }

        const data = await res.json();
        const logs: LogData[] = data.logs;

        if (logs.length > 0) {
          // Update last timestamp for next fetch
          setLastTimestamp(logs[logs.length - 1].timestamp);

          // Calculate basic metrics
          const severityDistribution = {
            low: 0,
            medium: 0,
            high: 0,
            unknown: 0,
          };

          // Calculate severity distribution and error count
          const errorCount = logs.filter(
            (log) =>
              log.event?.type?.toLowerCase().includes("error") ||
              log.event?.type?.toLowerCase().includes("failure")
          ).length;

          logs.forEach((log) => {
            const severity = log.event?.severity?.toLowerCase() || "unknown";
            if (severity in severityDistribution) {
              severityDistribution[
                severity as keyof typeof severityDistribution
              ]++;
            }
          });

          // Calculate average response time
          const avgResponseTime =
            logs.reduce((acc, log) => {
              const responseTime = log.event?.type?.includes("response")
                ? parseInt(log.event?.type?.match(/\d+/)?.[0] || "0")
                : 0;
              return acc + responseTime;
            }, 0) / (logs.length || 1);

          // Get most recent analysis report for AI insights
          const analysisRes = await fetch(
            "http://127.0.0.1:5000/analysis_reports?limit=1",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const analysisData = await analysisRes.json();
          const latestAnalysis = analysisData.reports?.[0];

          // Create new metric point
          const newMetric: MetricPoint = {
            timestamp: Date.now(),
            requestCount: logs.length,
            severityDistribution,
            systemHealth: {
              errorRate: (errorCount / logs.length) * 100,
              avgResponseTime,
              cpuUsage: Math.random() * 30 + 40, // Simulated CPU usage between 40-70%
            },
            aiInsights: {
              threatLevel:
                latestAnalysis?.severity === "high"
                  ? 80
                  : latestAnalysis?.severity === "medium"
                  ? 50
                  : 20,
              anomalyScore: Math.min(
                100,
                logs.length > 50 ? 80 : logs.length + 30
              ),
              predictedAttacks:
                latestAnalysis?.severity === "high"
                  ? Math.floor(Math.random() * 5 + 3)
                  : Math.floor(Math.random() * 2),
            },
          };

          setMetrics((prev) => {
            const updatedMetrics = [...prev, newMetric];
            // Keep last 30 data points
            return updatedMetrics.slice(-30);
          });
        }

        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchLogs();

    // Set up polling every 5 seconds
    const interval = setInterval(fetchLogs, 5000);

    // Cleanup
    return () => clearInterval(interval);
  }, [token, router, lastTimestamp]);

  return (
    <div className="live-logs-container">
      <div className="header-section">
        <h2>Live Metrics</h2>
        <div className="refresh-status">Auto-refreshing every 5 seconds</div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-grid">
        <div className="metrics-section">
          <h3 className="section-title">Traffic Metrics</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Request Volume</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(timestamp) =>
                      new Date(timestamp).toLocaleTimeString()
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(timestamp) =>
                      new Date(timestamp).toLocaleString()
                    }
                    formatter={(value) => [`${value} requests`, "Count"]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="requestCount"
                    stroke="#3498db"
                    strokeWidth={2}
                    dot={false}
                    name="Requests"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="metric-card">
              <h3>Severity Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(timestamp) =>
                      new Date(timestamp).toLocaleTimeString()
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(timestamp) =>
                      new Date(timestamp).toLocaleString()
                    }
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="severityDistribution.high"
                    stackId="1"
                    stroke="#e74c3c"
                    fill="#e74c3c"
                    name="High"
                  />
                  <Area
                    type="monotone"
                    dataKey="severityDistribution.medium"
                    stackId="1"
                    stroke="#f1c40f"
                    fill="#f1c40f"
                    name="Medium"
                  />
                  <Area
                    type="monotone"
                    dataKey="severityDistribution.low"
                    stackId="1"
                    stroke="#2ecc71"
                    fill="#2ecc71"
                    name="Low"
                  />
                  <Area
                    type="monotone"
                    dataKey="severityDistribution.unknown"
                    stackId="1"
                    stroke="#95a5a6"
                    fill="#95a5a6"
                    name="Unknown"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="system-health-section">
          <h3 className="section-title">System Health</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Performance Metrics</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(timestamp) =>
                      new Date(timestamp).toLocaleTimeString()
                    }
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    labelFormatter={(timestamp) =>
                      new Date(timestamp).toLocaleString()
                    }
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="systemHealth.errorRate"
                    stroke="#e74c3c"
                    name="Error Rate (%)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="systemHealth.avgResponseTime"
                    stroke="#3498db"
                    name="Avg Response Time (ms)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="metric-card">
              <h3>System Usage</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(timestamp) =>
                      new Date(timestamp).toLocaleTimeString()
                    }
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    labelFormatter={(timestamp) =>
                      new Date(timestamp).toLocaleString()
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="systemHealth.cpuUsage"
                    stroke="#8e44ad"
                    name="CPU Usage (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="ai-insights-section">
          <h3 className="section-title">AI Insights</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Threat Analysis</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(timestamp) =>
                      new Date(timestamp).toLocaleTimeString()
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(timestamp) =>
                      new Date(timestamp).toLocaleString()
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="aiInsights.threatLevel"
                    stroke="#e74c3c"
                    name="Threat Level"
                  />
                  <Line
                    type="monotone"
                    dataKey="aiInsights.anomalyScore"
                    stroke="#f1c40f"
                    name="Anomaly Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="metric-card">
              <h3>Attack Prediction</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(timestamp) =>
                      new Date(timestamp).toLocaleTimeString()
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(timestamp) =>
                      new Date(timestamp).toLocaleString()
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="aiInsights.predictedAttacks"
                    stroke="#9b59b6"
                    name="Predicted Attacks"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {loading && <div className="loading-spinner">Loading metrics...</div>}
    </div>
  );
}
