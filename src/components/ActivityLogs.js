import React, { useState, useEffect } from "react";
import api from "../utils/api";

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [searchFilters, setSearchFilters] = useState({
    log_id: "",
    user_id: "",
    action: "",
    entity_affected: "",
    timestamp: "",
  });

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get("/activity-logs");
        const logsArray = Array.isArray(response.data) ? response.data : [];
        setLogs(logsArray);
        setFilteredLogs(logsArray);
        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to fetch activity logs");
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const handleSort = (key) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });

    const sortedLogs = [...filteredLogs].sort((a, b) => {
      const aValue = a[key] === null ? -1 : a[key];
      const bValue = b[key] === null ? -1 : b[key];

      if (aValue === bValue) return 0;

      return direction === "asc" ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1;
    });
    setFilteredLogs(sortedLogs);
  };

  const handleSearchChange = (key, value) => {
    setSearchFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));

    const filtered = logs.filter((log) =>
      Object.keys(searchFilters).every((filterKey) => {
        const filterValue = filterKey === key ? value : searchFilters[filterKey];
        return (
          filterValue === "" ||
          (log[filterKey] &&
            log[filterKey].toString().toLowerCase().includes(filterValue.toLowerCase()))
        );
      })
    );
    setFilteredLogs(filtered);
  };

  const handleResetFilters = () => {
    // Reset all search filters to empty strings
    setSearchFilters({
      log_id: "",
      user_id: "",
      action: "",
      entity_affected: "",
      timestamp: "",
    });

    // Reset filtered logs to the original logs
    setFilteredLogs(logs);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? "▲" : "▼";
    }
    return "⇅";
  };

  if (loading) return <p>Loading activity logs...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Activity Logs</h2>

      {/* Refresh Button */}
      <button
        onClick={handleResetFilters}
        className="mb-4 p-2 text-white bg-blue-500 rounded"
      >
        Reset Filters
      </button>

      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          {/* Search Box Row */}
          <tr>
            {["log_id", "user_id", "action", "entity_affected", "timestamp"].map((key) => (
              <th key={key} className="border border-gray-300 px-4 py-2 text-left">
                {key === "timestamp" ? (
                  <input
                    type="date"
                    className="p-1 w-full border border-gray-300 rounded"
                    value={searchFilters[key]}
                    onChange={(e) => handleSearchChange(key, e.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    placeholder={`Search ${key}`}
                    className="p-1 w-full border border-gray-300 rounded"
                    value={searchFilters[key]}
                    onChange={(e) => handleSearchChange(key, e.target.value)}
                  />
                )}
              </th>
            ))}
          </tr>
          {/* Column Titles and Sort Buttons Row */}
          <tr>
            {["log_id", "user_id", "action", "entity_affected", "timestamp"].map((key) => (
              <th key={key} className="border border-gray-300 px-4 py-2 text-left">
                <div className="flex justify-between items-center">
                  <span>
                    {key
                      .split("_")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ")}
                  </span>
                  <button
                    onClick={() => handleSort(key)}
                    className="ml-2 text-blue-500"
                  >
                    {getSortIcon(key)}
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredLogs.map((log) => (
            <tr key={log.log_id} className="hover:bg-gray-100">
              <td className="border border-gray-300 px-4 py-2 text-left">{log.log_id}</td>
              <td className="border border-gray-300 px-4 py-2 text-left">{log.user_id || -1}</td>
              <td className="border border-gray-300 px-4 py-2 text-left">{log.action}</td>
              <td className="border border-gray-300 px-4 py-2 text-left">{log.entity_affected}</td>
              <td className="border border-gray-300 px-4 py-2 text-left">
                {new Date(log.timestamp).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ActivityLogs;
