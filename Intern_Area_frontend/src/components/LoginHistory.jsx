import React, { useState, useEffect } from "react";
import { getLoginHistory } from "../api/authAPI";

export default function LoginHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getLoginHistory();
      setHistory(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load login history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const totalPages = Math.ceil(history.length / itemsPerPage);
  const paginatedHistory = history.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getDeviceIcon = (device) => {
    switch (device) {
      case "Mobile":
        return (
          <span className="inline-flex items-center text-slate-500">
            <span className="mr-1.5 text-base">📱</span> Phone
          </span>
        );
      case "Tablet":
        return (
          <span className="inline-flex items-center text-slate-500">
            <span className="mr-1.5 text-base">📟</span> Tablet
          </span>
        );
      case "Laptop":
        return (
          <span className="inline-flex items-center text-slate-500">
            <span className="mr-1.5 text-base">💻</span> Laptop
          </span>
        );
      case "Desktop":
      default:
        return (
          <span className="inline-flex items-center text-slate-500">
            <span className="mr-1.5 text-base">🖥️</span> Desktop
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    if (status === "Successful") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span>
          Successful
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-500"></span>
          Failed
        </span>
      );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="font-outfit font-extrabold text-slate-800 text-base flex items-center">
            <span className="mr-2 text-lg">🛡️</span> Account Access History
          </h3>
          <p className="text-slate-400 text-xs mt-0.5 font-sans">
            Review recent sign-in attempts on your account
          </p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-primary rounded-xl hover:bg-white border border-transparent hover:border-slate-100 shadow-sm transition-all"
          title="Refresh History"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm font-medium">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Retrieving history records...
          </div>
        ) : error ? (
          <div className="py-8 text-center text-rose-500 text-xs font-semibold bg-rose-50/50 rounded-xl border border-rose-100">
            ⚠️ {error}
          </div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-sans leading-relaxed">
            <span className="text-2xl block mb-2">📄</span>
            No access history found for this account.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Device</th>
                    <th className="py-3 px-4">Browser & OS</th>
                    <th className="py-3 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                  {paginatedHistory.map((item, idx) => (
                    <tr key={item._id || idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(item.timestamp).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>
                      <td className="py-3.5 px-4">{getDeviceIcon(item.device)}</td>
                      <td className="py-3.5 px-4 font-sans text-slate-600">
                        {item.browser} <span className="text-slate-400 font-normal">on</span> {item.os}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {item.ipAddress || "Unknown"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card List View */}
            <div className="block md:hidden space-y-3.5">
              {paginatedHistory.map((item, idx) => (
                <div key={item._id || idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-all space-y-3 text-xs shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-slate-400 font-bold">
                      {new Date(item.timestamp).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1.5 text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">Device</span>
                      {getDeviceIcon(item.device)}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">IP Address</span>
                      <span className="font-mono text-[11px] text-slate-500 font-bold">{item.ipAddress || "Unknown"}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100/60">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">Browser & OS</span>
                    <span className="text-slate-600 font-semibold">{item.browser} on {item.os}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xs">
                <span className="text-slate-400">
                  Page <strong className="text-slate-700 font-bold">{currentPage}</strong> of <strong className="text-slate-700 font-bold">{totalPages}</strong>
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
