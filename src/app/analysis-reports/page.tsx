// "use react";
"use client";
import { useEffect, useState } from "react";
import "./analysis-reports.css";
import { useRouter } from "next/navigation";
interface Report {
  analyzed_at: string;
  summary: string;
  severity: string;
  attack_type: string;
  source_ip: string;
  dest_ip: string;
}

interface Filters {
  start_date: string;
  end_date: string;
  keyword: string;
  severity: string;
  page: number;
  limit: number;
}
export default function AnalysisReport() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filters, setFilters] = useState<Filters>({
    start_date: "",
    end_date: "",
    keyword: "",
    severity: "",
    page: 1,
    limit: 10,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    const fetchReports = async () => {
      setLoading(true);
      setError("");
      const headers = { Authorization: `Bearer ${token}` };

      try {
        const query = new URLSearchParams({
          ...filters,
          page: filters.page.toString(),
          limit: filters.limit.toString(),
        }).toString();

        const res = await fetch(
          `http://127.0.0.1:5000/analysis_reports?${query}`,
          {
            headers,
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch reports");
        }

        const data = await res.json();
        setReports(data.reports || []);
        setTotalPages(data.total_pages || 1);
      } catch (err: any) {
        setError(err.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [token, filters]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: name === "page" ? parseInt(value) : prev.page,
    }));
  };

  return (
    <div className="analysis-container">
      <h2>AI Analysis Reports</h2>

      <div className="filters-section">
        <div className="filter-row">
          <input
            type="text"
            name="keyword"
            placeholder="Search by keyword..."
            value={filters.keyword}
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
          <div className="date-filter">
            <label>Start Date:</label>
            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="date-input"
            />
          </div>
          <div className="date-filter">
            <label>End Date:</label>
            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="date-input"
            />
          </div>
        </div>
      </div>

      <div className="reports-content">
        {loading ? (
          <div className="loading-spinner">Loading reports...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : reports.length > 0 ? (
          <div className="table-container">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Source IP</th>
                  <th>Attack Type</th>
                  <th>Threat Summary</th>
                  <th>Severity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, index) => (
                  <tr key={index}>
                    <td>{new Date(report.analyzed_at).toLocaleString()}</td>
                    <td>{report.source_ip}</td>
                    <td>{report.attack_type}</td>
                    <td>{report.summary}</td>
                    <td>
                      <span
                        className={`severity-badge ${report.severity.toLowerCase()}`}
                      >
                        {report.severity}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data">No reports found.</div>
        )}

        {reports.length > 0 && (
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
        )}
      </div>
    </div>
  );
}
