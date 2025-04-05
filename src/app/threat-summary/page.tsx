"use client";

import "./threat.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Clock, AlertTriangle, Shield, Activity } from "react-feather";

interface ThreatData {
  total_logs: number;
  total_analysis_reports: number;
  severity_summary: {
    low: number;
    medium: number;
    high: number;
    unknown: number;
  };
  recent_threats: Array<{
    summary: string;
    attack_type: string;
    severity: string;
    analyzed_at: string;
    log_id: string;
  }>;
}

const SEVERITY_COLORS = {
  high: "#e74c3c",
  medium: "#f1c40f",
  low: "#2ecc71",
  unknown: "#95a5a6",
};

export default function ThreatSummary() {
  const router = useRouter();
  const [threatData, setThreatData] = useState<ThreatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const url = new URL("http://127.0.0.1:5000/threat-summary");
        if (severityFilter) url.searchParams.set("severity", severityFilter);

        const response = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            router.push("/login");
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ThreatData = await response.json();
        setThreatData(data);
        setLoading(false);
      } catch (err) {
        setError(
          `Error fetching data: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
        setLoading(false);
      }
    };

    fetchData();
  }, [severityFilter, router]);

  if (loading) {
    return (
      <div className="loading-container">
        <Activity className="loading-icon" size={40} />
        <p>Loading threat data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertTriangle className="error-icon" size={40} />
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!threatData) return null;

  const severityChartData = Object.entries(threatData.severity_summary)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="threat-summary-container">
      <div className="header-section">
        <h1>
          <Shield size={28} className="header-icon" />
          Threat Dashboard
        </h1>
        <div className="filters">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="severity-filter"
          >
            <option value="">All Severities</option>
            {Object.keys(SEVERITY_COLORS).map((severity) => (
              <option key={severity} value={severity}>
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card total-logs">
          <div className="card-content">
            <Activity size={24} className="card-icon" />
            <div>
              <h3>Total Logs</h3>
              <p>{threatData.total_logs.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="summary-card total-analysis">
          <div className="card-content">
            <Shield size={24} className="card-icon" />
            <div>
              <h3>Analysis Reports</h3>
              <p>{threatData.total_analysis_reports.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-container">
          <h3>Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={severityChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {severityChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      SEVERITY_COLORS[
                        entry.name as keyof typeof SEVERITY_COLORS
                      ]
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Recent Threat Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={threatData.recent_threats}>
              <XAxis
                dataKey="analyzed_at"
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="custom-tooltip">
                        <p className="date">
                          {new Date(data.analyzed_at).toLocaleString()}
                        </p>
                        <p className="attack">Attack: {data.attack_type}</p>
                        <p
                          className={`severity ${data.severity.toLowerCase()}`}
                        >
                          Severity: {data.severity}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="severity"
                fill="#1890ff"
                name="Threat Severity"
                isAnimationActive={false}
              >
                {threatData.recent_threats.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      SEVERITY_COLORS[
                        entry.severity.toLowerCase() as keyof typeof SEVERITY_COLORS
                      ]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="recent-threats">
        <h3>
          <Clock size={20} className="section-icon" />
          Recent Threats
        </h3>
        <div className="threat-list">
          {threatData.recent_threats.map((threat) => (
            <div key={threat.log_id} className="threat-card">
              <div className="threat-header">
                <span className="threat-date">
                  {new Date(threat.analyzed_at).toLocaleString()}
                </span>
                <span
                  className={`severity-badge ${threat.severity.toLowerCase()}`}
                >
                  {threat.severity}
                </span>
              </div>
              <h4 className="attack-type">{threat.attack_type}</h4>
              <p className="threat-summary">{threat.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
