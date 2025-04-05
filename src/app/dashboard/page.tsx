"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./dashboard.css";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface LogData {
  name: string;
  logs: number;
}

interface ThreatData {
  name: string;
  value: number;
}

interface AIPrediction {
  predictedThreats: number;
  anomalyScore: number;
  riskLevel: "low" | "medium" | "high";
  nextAttackProbability: number;
  recommendedActions: string[];
}

export default function Dashboard() {
  const router = useRouter();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [logData, setLogData] = useState<LogData[]>([]);
  const [threatData, setThreatData] = useState<ThreatData[]>([]);
  const [aiPredictions, setAiPredictions] = useState<AIPrediction>({
    predictedThreats: 0,
    anomalyScore: 0,
    riskLevel: "low",
    nextAttackProbability: 0,
    recommendedActions: [],
  });
  const [loading, setLoading] = useState<boolean>(true);

  const COLORS = ["#2ecc71", "#f1c40f", "#e74c3c", "#3498db", "#9b59b6"];

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch logs, threats, and analysis reports
        const [logsRes, threatRes, analysisRes] = await Promise.all([
          fetch("http://127.0.0.1:5000/logs", { headers }),
          fetch("http://127.0.0.1:5000/threat-summary", { headers }),
          fetch("http://127.0.0.1:5000/analysis_reports?limit=5", { headers }),
        ]);

        const logsJson = await logsRes.json();
        const logsFormatted = logsJson.logs.map((item: any) => ({
          name: item.name || "Unknown",
          logs: item.count,
        }));
        setLogData(logsFormatted);

        const threatJson = await threatRes.json();
        const severitySummary = threatJson.severity_summary;
        const threatsFormatted = Object.entries(severitySummary).map(
          ([key, value]) => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: value as number,
          })
        );
        setThreatData(threatsFormatted);

        // Process analysis reports for AI predictions
        const analysisJson = await analysisRes.json();
        const recentReports = analysisJson.reports || [];

        // Calculate AI predictions
        const highSeverityCount = recentReports.filter(
          (r: any) => r.severity?.toLowerCase() === "high"
        ).length;

        const anomalyScore = (highSeverityCount / recentReports.length) * 100;
        const nextAttackProbability = Math.min(
          highSeverityCount * 20 + anomalyScore * 0.5,
          100
        );

        setAiPredictions({
          predictedThreats: highSeverityCount,
          anomalyScore: Math.round(anomalyScore),
          riskLevel:
            anomalyScore > 70 ? "high" : anomalyScore > 40 ? "medium" : "low",
          nextAttackProbability: Math.round(nextAttackProbability),
          recommendedActions: recentReports
            .filter((r: any) => r.suggested_actions)
            .flatMap((r: any) => r.suggested_actions)
            .slice(0, 3),
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data", err);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [token, router]);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  if (loading)
    return <div className="loading-screen">Loading Dashboard...</div>;

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <h1 className="dashboard-title">WebShield Dashboard</h1>
        <div className="nav-buttons">
          <button onClick={() => handleNavigation("/live-logs")}>
            Live Monitoring
          </button>
          <button onClick={() => handleNavigation("/threat-summary")}>
            Threat Summary
          </button>
          <button onClick={() => handleNavigation("/analysis-reports")}>
            Analysis Reports
          </button>
          <button onClick={() => handleNavigation("/logs")}>Log History</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="predictions-section">
          <h2>AI Predictions</h2>
          <div className="prediction-cards">
            <div
              className={`prediction-card ${aiPredictions.riskLevel}`}
              onClick={() => handleNavigation("/live-logs")}
            >
              <h3>Risk Level</h3>
              <div className="prediction-value">
                {aiPredictions.riskLevel.toUpperCase()}
              </div>
              <div className="prediction-detail">
                Based on recent threat patterns
              </div>
            </div>

            <div
              className="prediction-card"
              onClick={() => handleNavigation("/live-logs")}
            >
              <h3>Anomaly Score</h3>
              <div className="prediction-value">
                {aiPredictions.anomalyScore}%
              </div>
              <div className="prediction-detail">
                Deviation from normal behavior
              </div>
            </div>

            <div
              className="prediction-card"
              onClick={() => handleNavigation("/live-logs")}
            >
              <h3>Next Attack Probability</h3>
              <div className="prediction-value">
                {aiPredictions.nextAttackProbability}%
              </div>
              <div className="prediction-detail">
                Likelihood in next 24 hours
              </div>
            </div>
          </div>

          {aiPredictions.recommendedActions.length > 0 && (
            <div className="recommended-actions">
              <h3>Recommended Actions</h3>
              <ul>
                {aiPredictions.recommendedActions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="charts-section">
          <div className="chart-box">
            <h2>Threat Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              {threatData.length > 0 ? (
                <PieChart>
                  <Pie
                    data={threatData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                  >
                    {threatData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              ) : (
                <div className="empty-chart-message">
                  No threat data available.
                </div>
              )}
            </ResponsiveContainer>
          </div>

          <div className="chart-box">
            <h2>Log Activity</h2>
            <ResponsiveContainer width="100%" height={300}>
              {logData.length > 0 ? (
                <BarChart data={logData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="logs" fill="#3498db" />
                </BarChart>
              ) : (
                <div className="empty-chart-message">
                  No log data available.
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
