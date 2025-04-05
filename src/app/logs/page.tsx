"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./logs.css";

export default function Logs() {
  const router = useRouter();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState("");
  interface Filters {
    source_ip: string;
    event_type: string;
    start: string;
    end: string;
    page: number;
    limit: number;
    severity: string;
    agent_name: string;
    rule_description: string;
  }

  const [filters, setFilters] = useState<Filters>({
    source_ip: "",
    event_type: "",
    start: "",
    end: "",
    page: 1,
    limit: 10,
    severity: "",
    agent_name: "",
    rule_description: "",
  });
  const [totalPages, setTotalPages] = useState(1);
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    fetchlogs();
  }, [filters]);
  const fetchlogs = async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams(filters as any).toString();
      console.log("Making API call with query:", query);
      const res = await fetch(`http://127.0.0.1:5000/logs?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("API response status:", res.status);
      if (!res.ok) {
        const errorResponse = await res.text();
        console.error("API error response:", errorResponse);
        throw new Error("failed to retrieve the logs");
      }

      const data = await res.json();
      console.log("API data received:", data);
      setLogs(data.logs);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]:
        name === "page" || name === "limit" ? parseInt(value) || 1 : value,
    }));
  };
  return (
    <div className="logs-container">
      <h2>Security Logs</h2>
      <div className="filters-section">
        <div className="filter-row">
          <input
            type="text"
            name="source_ip"
            placeholder="Source IP"
            value={filters.source_ip}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <input
            type="text"
            name="agent_name"
            placeholder="Agent Name"
            value={filters.agent_name}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <select
            name="severity"
            value={filters.severity}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="filter-row">
          <input
            type="text"
            name="event_type"
            placeholder="Event Type"
            value={filters.event_type}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <input
            type="text"
            name="rule_description"
            placeholder="Rule Description"
            value={filters.rule_description}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>
        <div className="filter-row">
          <div className="date-filter">
            <label>Start Date:</label>
            <input
              type="date"
              name="start"
              value={filters.start}
              onChange={handleFilterChange}
              className="date-input"
            />
          </div>
          <div className="date-filter">
            <label>End Date:</label>
            <input
              type="date"
              name="end"
              value={filters.end}
              onChange={handleFilterChange}
              className="date-input"
            />
          </div>
        </div>
      </div>
      <div className="logs-content">
        {loading ? (
          <div className="loading-spinner">Loading logs...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : logs.length > 0 ? (
          <div className="content-wrapper">
            <div className="table-container">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Source IP</th>
                    <th>Agent Name</th>
                    <th>Event Type</th>
                    <th>Rule Description</th>
                    <th>Severity</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs &&
                    logs.map((log: any, index) => (
                      <tr
                        key={index}
                        className={`severity-${
                          log.event?.severity?.toLowerCase() || "unknown"
                        }`}
                      >
                        <td>{log.source?.ip || "Unknown"}</td>
                        <td>{log.agent?.name || "Unknown"}</td>
                        <td>{log.event?.type || "Unknown"}</td>
                        <td>{log.rule?.description || "Unknown"}</td>
                        <td
                          className={`severity-badge ${
                            log.event?.severity?.toLowerCase() || "unknown"
                          }`}
                        >
                          {log.event?.severity || "Unknown"}
                        </td>
                        <td>
                          {log.timestamp
                            ? new Date(log.timestamp).toLocaleString()
                            : "Unknown"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={filters.page <= 1}
                className="pagination-btn"
              >
                Previous
              </button>
              <span className="page-info">
                Page {filters.page} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={filters.page >= totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="no-data">No logs found.</div>
        )}
      </div>
    </div>
  );
}
