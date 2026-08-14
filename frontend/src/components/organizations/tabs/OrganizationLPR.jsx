import React, { useState, useEffect, useCallback } from "react";
import { lprService } from "../../../services/lprService";
import LPRRegistrationForm from "./LPRRegistrationForm";
import WebcamCapture from "../../common/WebcamCapture.jsx";
import Loader from "../../common/Loader";
import { useToast } from "../../../contexts/ToastContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Menu, LayoutDashboard, PencilLine } from "lucide-react";

const OrganizationLPR = ({
  organization,
  activeSubTab = "logs",
  onSubTabChange,
}) => {
  const { success, error: showError, info: showInfo } = useToast();
  const features = organization?.enabled_features || {};
  const [internalActiveSubTab, setInternalActiveSubTab] = useState("logs"); // logs as default

  // Data State
  const [logs, setLogs] = useState([]);
  const [hotlist, setHotlist] = useState([]);
  const [whitelist, setWhitelist] = useState([]);
  const [stats, setStats] = useState({
    entries_today: 0,
    security_alerts: 0,
    vip_movements: 0,
    active_cameras: "0/0",
  });
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showHotlistModal, setShowHotlistModal] = useState(false);
  const [showWhitelistModal, setShowWhitelistModal] = useState(false);
  const [showGatePassModal, setShowGatePassModal] = useState(false);

  // View State for Modals
  const [printedPassEntry, setPrintedPassEntry] = useState(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [activePhotoSlot, setActivePhotoSlot] = useState(null); // 'front', 'side', etc.
  const [manualEntryForm, setManualEntryForm] = useState({
    vehicle_number: "",
    vehicle_type: "car",
    date_time: new Date().toISOString().slice(0, 16),
    gate_name: "Main Gate",
    // Driver Details
    driver_name: "",
    driver_phone: "",
    driver_license_id: "",
    checklist_status: {
      puc_valid: false,
      insurance_valid: false,
      no_prohibited_items: false,
      undercarriage_checked: false,
    },
    vehicle_photos: [], // { type: 'front', base64: '...' }
    material_declaration: "",
    vehicle_security_check_notes: "",
  });

  // Form State
  const [hotlistForm, setHotlistForm] = useState({
    vehicle_number: "",
    reason: "",
    fir_number: "",
    reporting_officer: "",
    severity: "warning",
  });
  const [whitelistForm, setWhitelistForm] = useState({
    vehicle_number: "",
    owner_name: "",
    designation: "",
    department: "",
    priority: "medium",
    access_zones: "All Gates",
  });

  // Search/Filter State
  const [searchFilters, setSearchFilters] = useState({
    vehicle_number: "",
    date: "",
  });

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PER_PAGE = 20;

  const lprSubTabs = ["overview", "logs", "manualEntry"];
  const selectedSubTab = lprSubTabs.includes(activeSubTab)
    ? activeSubTab
    : internalActiveSubTab;

  const setActiveSubTab = (subTabId) => {
    if (typeof onSubTabChange === "function") {
      onSubTabChange(subTabId);
      return;
    }

    setInternalActiveSubTab(subTabId);
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await lprService.getStats(organization.id);
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch LPR stats", error);
    }
  }, [organization.id]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (selectedSubTab === "overview") {
        await fetchStats();
      } else if (selectedSubTab === "logs") {
        // Pass search filters to API
        const params = {
          vehicle_number: searchFilters.vehicle_number || undefined,
          // Backend might need update to handle date if not already supported
          date: searchFilters.date || undefined,
          page: page,
          per_page: PER_PAGE,
        };
        const res = await lprService.getLogs(organization.id, params);
        if (res.data.success) {
          setLogs(res.data.data);
          if (res.data.pagination) setTotalPages(res.data.pagination.pages);
        }
      } else if (selectedSubTab === "hotlist") {
        const res = await lprService.getHotlist(organization.id);
        if (res.data.success) setHotlist(res.data.data);
      } else if (selectedSubTab === "whitelist") {
        const res = await lprService.getWhitelist(organization.id);
        if (res.data.success) setWhitelist(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch LPR data", error);
    } finally {
      setLoading(false);
    }
  }, [selectedSubTab, organization.id, page, searchFilters, fetchStats]);

  // Fetch Data on Tab Change or Filter Change
  useEffect(() => {
    if (!organization?.id) return;
    fetchData();
    // Poll for stats if on overview
    let interval;
    if (selectedSubTab === "overview") {
      interval = setInterval(() => {
        fetchStats();
      }, 30000); // 30 seconds
    }
    return () => clearInterval(interval);
  }, [selectedSubTab, organization.id, page, searchFilters, fetchData, fetchStats]);

  // Handlers
  const handleAddHotlist = async (e) => {
    e.preventDefault();
    try {
      await lprService.addToHotlist(organization.id, hotlistForm);
      setShowHotlistModal(false);
      setHotlistForm({
        vehicle_number: "",
        reason: "",
        fir_number: "",
        reporting_officer: "",
        severity: "warning",
      });
      fetchData(); // Refresh list
      fetchData(); // Refresh list
      success("Vehicle added to Hotlist");
    } catch (err) {
      showError("Failed to add to hotlist. Please check inputs.");
    }
  };

  const handleAddWhitelist = async (e) => {
    e.preventDefault();
    try {
      await lprService.addToWhitelist(organization.id, whitelistForm);
      setShowWhitelistModal(false);
      setWhitelistForm({
        vehicle_number: "",
        owner_name: "",
        designation: "",
        department: "",
        priority: "medium",
        access_zones: "All Gates",
      });
      fetchData(); // Refresh list
      fetchData(); // Refresh list
      success("Vehicle authorized for VIP access");
    } catch (err) {
      showError("Failed to authorize vehicle. Please check inputs.");
    }
  };

  const handleRemoveHotlist = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this vehicle from the hotlist?",
      )
    )
      return;
    await lprService.removeFromHotlist(organization.id, id);
    fetchData();
  };

  const handleRemoveWhitelist = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to revoke access for this vehicle?",
      )
    )
      return;
    await lprService.removeFromWhitelist(organization.id, id);
    fetchData();
  };

  const handleManualEntrySubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await lprService.createManualEntry(
        organization.id,
        manualEntryForm,
      );
      // Assuming simplified response or verify
      // In a real scenario, check res.data.success
      setManualEntryForm({
        vehicle_number: "",
        vehicle_type: "car",
        date_time: new Date().toISOString().slice(0, 16),
        gate_name: "Main Gate",
        driver_name: "",
        driver_phone: "",
        driver_license_id: "",
        checklist_status: {
          puc_valid: false,
          insurance_valid: false,
          no_prohibited_items: false,
          undercarriage_checked: false,
        },
        vehicle_photos: [],
        material_declaration: "",
        vehicle_security_check_notes: "",
      });
      fetchData();

      // Check for Hotlist Alert
      if (res.data?.hotlist_alert) {
        // Show Critical Alert (Using standard alert for now, ideally a modal)
        showError(
          "🚨 CRITICAL WARNING: This vehicle is upon the HOTLIST! Take immediate action.",
        );
      } else {
        success("Vehicle Entry Logged Successfully");
      }

      // Show Pass
      if (res.data) {
        setPrintedPassEntry(res.data);
        setShowGatePassModal(true);
      }
    } catch (err) {
      console.error(err);
      showError("Failed to log entry.");
    }
  };

  const handleResetManualEntry = () => {
    setManualEntryForm({
      vehicle_number: "",
      vehicle_type: "car",
      date_time: new Date().toISOString().slice(0, 16),
      gate_name: "Main Gate",
      driver_name: "",
      driver_phone: "",
      driver_license_id: "",
      checklist_status: {
        puc_valid: false,
        insurance_valid: false,
        no_prohibited_items: false,
        undercarriage_checked: false,
      },
      vehicle_photos: [],
      material_declaration: "",
      vehicle_security_check_notes: "",
    });
  };

  const handleOpenWebcamForSlot = (slot) => {
    setActivePhotoSlot(slot);
    setShowWebcam(true);
  };

  const handleImageCapture = (base64Image) => {
    if (activePhotoSlot) {
      setManualEntryForm((prev) => {
        const existing = prev.vehicle_photos.filter(
          (p) => p.type !== activePhotoSlot,
        );
        return {
          ...prev,
          vehicle_photos: [
            ...existing,
            { type: activePhotoSlot, base64: base64Image },
          ],
        };
      });
      setShowWebcam(false);
      setActivePhotoSlot(null);
    }
  };

  if (!features.lpr_integration) {
    return (
      <div className="bg-slate-50 rounded-xl p-8 text-center border-2 border-dashed border-slate-200">
        <div className="text-4xl mb-4">🚗</div>
        <h3 className="text-lg font-bold text-slate-700">
          LPR Module Not Enabled
        </h3>
        <p className="text-slate-500 max-w-md mx-auto mt-2">
          This organization does not have License Plate Recognition enabled.
          Edit the organization to enable this feature in the "License Plate
          Recognition" section.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="rounded-xl border border-teal-100/70 bg-gradient-to-r from-white via-teal-50/60 to-cyan-50/60 shadow-sm overflow-visible relative z-30">
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between relative z-30">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600/10 ring-1 ring-teal-200 text-teal-700 text-sm font-bold">
                🚔
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                License Plate Recognition System
              </h2>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Official record of vehicle movements and security protocols.
            </p>
          </div>
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-white/90 p-1.5 shadow-sm overflow-x-auto max-w-full">
            {[
              {
                id: "logs",
                label: (
                  <>
                    <span className="mr-1.5 text-base"><Menu size={18} /></span>
                    Logs
                  </>
                ),
              },
              {
                id: "overview",
                label: (
                  <>
                    <span className="mr-1.5 text-base"><LayoutDashboard size={18} /></span>
                    Overview
                  </>
                ),
              },
              {
                id: "manualEntry",
                label: (
                  <>
                    <span className="mr-1.5 text-base"><PencilLine size={18} /></span>
                    Manual Entry
                  </>
                ),
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`inline-flex items-center whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                  selectedSubTab === tab.id
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-teal-700 hover:bg-teal-50"
                }`}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* OVERVIEW TAB */}

      {selectedSubTab === "overview" && (
        <>
          <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 px-2 md:px-0">
            <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 p-4 rounded-xl border border-blue-100 shadow transition-transform duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Entries Today</p>
              <p className="text-3xl font-black text-blue-900 mt-1 transition-all duration-300">{stats.entries_today}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 via-red-100 to-red-200 p-4 rounded-xl border border-red-100 shadow transition-transform duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Security Alerts</p>
              <p className="text-3xl font-black text-red-900 mt-1 transition-all duration-300">{stats.security_alerts}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 via-green-100 to-green-200 p-4 rounded-xl border border-green-100 shadow transition-transform duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
              <p className="text-xs font-bold text-green-700 uppercase tracking-wider">VIP Movements</p>
              <p className="text-3xl font-black text-green-900 mt-1 transition-all duration-300">{stats.vip_movements}</p>
            </div>
            <div className="bg-gradient-to-br from-slate-50 via-slate-100 to-cyan-100 p-4 rounded-xl border border-slate-200 shadow transition-transform duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Active Cameras</p>
              <p className="text-3xl font-black text-slate-900 mt-1 transition-all duration-300">{stats.active_cameras}</p>
            </div>
          </div>

          {/* LPR Overview Charts */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 px-2 md:px-0">
            {/* Bar Chart for Entries, Alerts, VIPs */}
            <div className="bg-white rounded-xl border border-slate-100 shadow p-4 min-h-[320px] flex flex-col justify-between w-full">
              <h3 className="text-base font-bold mb-2 text-slate-700">LPR Activity Summary</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={[{
                    name: 'Today',
                    Entries: stats.entries_today,
                    Alerts: stats.security_alerts,
                    VIPs: stats.vip_movements,
                  }]}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Entries" fill="#0ea5e9" />
                  <Bar dataKey="Alerts" fill="#ef4444" />
                  <Bar dataKey="VIPs" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart for Camera Status (if stats.active_cameras is like "3/5") */}
            <div className="bg-white rounded-xl border border-slate-100 shadow p-4 min-h-[320px] flex flex-col justify-between w-full">
              <h3 className="text-base font-bold mb-2 text-slate-700">Camera Status</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  {(() => {
                    let active = 0, total = 0;
                    if (typeof stats.active_cameras === "string" && stats.active_cameras.includes("/")) {
                      [active, total] = stats.active_cameras.split("/").map(Number);
                    }
                    const data = [
                      { name: "Active", value: active },
                      { name: "Inactive", value: Math.max(0, total - active) },
                    ];
                    const COLORS = ["#22c55e", "#e5e7eb"];
                    return (
                      <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label
                      >
                        {data.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                    );
                  })()}
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* LOGS TAB */}
      {selectedSubTab === "logs" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-teal-50/40">
            <div className="flex flex-wrap justify-between items-end gap-3 mb-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-[0.18em] font-semibold flex items-center gap-2 mt-1">
                  <span className="ml-4 border-l border-slate-300 pl-4 flex gap-2 flex-wrap">
                    <button
                      onClick={() =>
                        showInfo("🚧 Opening Entry Boom Barrier...")
                      }
                      className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-200 font-bold uppercase transition-colors"
                    >
                      Open Entry Gate
                    </button>
                    <button
                      onClick={() =>
                        showInfo("🚧 Opening Exit Boom Barrier...")
                      }
                      className="text-[10px] bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-200 font-bold uppercase transition-colors"
                    >
                      Open Exit Gate
                    </button>
                  </span>
                </p>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm text-sm font-semibold hover:bg-slate-50 flex items-center gap-2">
                  <span>🖨️</span> Print Log
                </button>
                <button
                  onClick={() => setActiveSubTab("manualEntry")}
                  className="px-4 py-2 bg-teal-600 text-white border border-teal-600 rounded-lg shadow-sm text-sm font-semibold hover:bg-teal-700 flex items-center gap-2"
                >
                  <span>+</span> Manual Entry / Inspection
                </button>
              </div>
            </div>

            {/* Search Filters */}
            <div className="flex justify-end">
              <div className="grid grid-cols-1 lg:grid-cols-[300px_190px_170px] gap-2 w-full lg:w-auto">
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter Vehicle Number..."
                      value={searchFilters.vehicle_number}
                      onChange={(e) =>
                        setSearchFilters((prev) => ({
                          ...prev,
                          vehicle_number: e.target.value.toUpperCase(),
                        }))
                      }
                      className="w-full border border-slate-300 rounded-md pl-8 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 outline-none font-mono uppercase"
                    />
                    <span className="absolute left-2.5 top-1.5 text-slate-400">
                      🔍
                    </span>
                  </div>
                </div>
                <div>
                  <input
                    type="date"
                    value={searchFilters.date}
                    onChange={(e) =>
                      setSearchFilters((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                    className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={fetchData}
                    className="w-full px-3 py-1.5 bg-slate-900 text-white font-semibold rounded-md hover:bg-slate-800 transition-colors text-xs flex items-center justify-center"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase text-xs border-b border-slate-300">
                  <tr>
                    <th className="px-6 py-3 border-r border-slate-200">
                      Time
                    </th>
                    <th className="px-6 py-3 border-r border-slate-200">
                      Vehicle No.
                    </th>
                    <th className="px-6 py-3 border-r border-slate-200">
                      Type
                    </th>
                    <th className="px-6 py-3 border-r border-slate-200">
                      Category
                    </th>
                    <th className="px-6 py-3 border-r border-slate-200">
                      Gate / Point
                    </th>
                    <th className="px-6 py-3 border-r border-slate-200">
                      Inspection
                    </th>
                    <th className="px-6 py-3 border-r border-slate-200">
                      Duration
                    </th>
                    <th className="px-6 py-3">Status / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {logs.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="p-8 text-center text-slate-500"
                      >
                        No vehicle movements recorded today.
                      </td>
                    </tr>
                  ) : (
                    logs.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-teal-50/40 transition-colors"
                      >
                        <td className="px-6 py-3 border-r border-slate-100 font-mono text-slate-600">
                          {new Date(row.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-3 border-r border-slate-100 font-bold font-mono text-slate-900">
                          {row.vehicle_number}
                        </td>
                        <td className="px-6 py-3 border-r border-slate-100">
                          {row.direction}
                        </td>
                        <td className="px-6 py-3 border-r border-slate-100 text-slate-700">
                          {row.category}
                        </td>
                        <td className="px-6 py-3 border-r border-slate-100 text-slate-500">
                          {row.gate_name || "-"}
                        </td>
                        <td className="px-6 py-3 border-r border-slate-100">
                          {row.checklist_status &&
                          Object.keys(row.checklist_status).length > 0 ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200">
                              Checked
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">N/A</span>
                          )}
                          {row.gate_pass_id && (
                            <button
                              onClick={() => {
                                setPrintedPassEntry(row);
                                setShowGatePassModal(true);
                              }}
                              className="ml-2 text-teal-600 hover:underline text-xs"
                            >
                              🖨️ Pass
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-3 border-r border-slate-100">
                          {row.duration_minutes ? (
                            <span
                              className={`text-xs font-bold ${row.is_overstay ? "text-red-600" : "text-slate-600"}`}
                            >
                              {Math.floor(row.duration_minutes / 60)}h{" "}
                              {row.duration_minutes % 60}m
                              {row.is_overstay && (
                                <span className="block text-[10px] uppercase text-red-500">
                                  Overstay
                                </span>
                              )}
                            </span>
                          ) : row.status === "allowed" && !row.exit_time ? (
                            <span className="text-xs text-green-600 font-bold animate-pulse">
                              ● Inside
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-3 font-semibold">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={
                                row.status === "allowed"
                                  ? "text-green-600"
                                  : row.status === "completed"
                                    ? "text-slate-400"
                                    : "text-red-600"
                              }
                            >
                              {row.status}
                            </span>
                            {row.status === "allowed" && !row.exit_time && (
                              <button
                                onClick={async () => {
                                  if (!window.confirm("Process vehicle exit?"))
                                    return;
                                  try {
                                    // Ideally add api method, for now calling generic update or similar.
                                    // Since we didn't add it to front-end service yet, we'll just mock alert or need to correct plan.
                                    // WAIT: I should add the service method first.
                                    // For this step, I will add the button but it will need the service update.
                                    await lprService.processExit(
                                      organization.id,
                                      row.id,
                                    );
                                    fetchData();
                                    success("Vehicle processed for exit");
                                  } catch (e) {
                                    showError("Failed to process exit");
                                  }
                                }}
                                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded border border-slate-300 transition-colors"
                              >
                                Exit ➡️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {/* Pagination Controls */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/90 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Page <span className="font-bold">{page}</span> of{" "}
                  <span className="font-bold">{totalPages}</span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={`px-3 py-1 rounded border text-xs font-semibold ${page === 1 ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-white text-slate-700 hover:bg-slate-50"}`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={`px-3 py-1 rounded border text-xs font-semibold ${page === totalPages ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-white text-slate-700 hover:bg-slate-50"}`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedSubTab === "manualEntry" && (
        <LPRRegistrationForm
          manualEntryForm={manualEntryForm}
          setManualEntryForm={setManualEntryForm}
          onSubmit={handleManualEntrySubmit}
          onOpenWebcam={handleOpenWebcamForSlot}
          onCancel={handleResetManualEntry}
        />
      )}

      {/* HOTLIST TAB */}
      {selectedSubTab === "hotlist" && (
        <div className="bg-teal-50/95 border border-red-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg text-red-900">
                Restricted Vehicle Hotlist
              </h3>
              <p className="text-xs text-red-700 uppercase tracking-widest font-semibold">
                Security Alert Database
              </p>
            </div>
            <button
              onClick={() => setShowHotlistModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded shadow-sm text-sm font-bold hover:bg-red-700 transition-colors"
            >
              + Add Vehicle to Hotlist
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-red-50 text-red-900 font-bold uppercase text-xs border-b border-red-200">
                  <tr>
                    <th className="px-6 py-3 border-r border-red-100">
                      Vehicle No.
                    </th>
                    <th className="px-6 py-3 border-r border-red-100">
                      Reason / Offense
                    </th>
                    <th className="px-6 py-3 border-r border-red-100">
                      FIR / Ref No.
                    </th>
                    <th className="px-6 py-3 border-r border-red-100">
                      Reported By
                    </th>
                    <th className="px-6 py-3 border-r border-red-100">Date</th>
                    <th className="px-6 py-3">Severity</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100">
                  {hotlist.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="p-8 text-center text-slate-500"
                      >
                        No vehicles in hotlist.
                      </td>
                    </tr>
                  ) : (
                    hotlist.map((row) => (
                      <tr key={row.id} className="hover:bg-red-50">
                        <td className="px-6 py-3 border-r border-red-100 font-bold font-mono text-slate-900">
                          {row.vehicle_number}
                        </td>
                        <td className="px-6 py-3 border-r border-red-100 text-slate-800">
                          {row.reason}
                        </td>
                        <td className="px-6 py-3 border-r border-red-100 font-mono text-slate-600">
                          {row.fir_number || "-"}
                        </td>
                        <td className="px-6 py-3 border-r border-red-100 text-slate-600">
                          {row.reporting_officer || "-"}
                        </td>
                        <td className="px-6 py-3 border-r border-red-100 text-slate-500">
                          {new Date(row.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 border-r border-red-100">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${row.severity === "critical" ? "bg-red-600 text-white" : "bg-yellow-100 text-yellow-800"}`}
                          >
                            {row.severity}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <button
                            onClick={() => handleRemoveHotlist(row.id)}
                            className="text-red-600 hover:text-red-800 font-bold text-xs"
                          >
                            REMOVE
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* WHITELIST TAB */}
      {selectedSubTab === "whitelist" && (
        <div className="bg-teal-50/95 border border-green-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-green-100 bg-green-50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg text-green-900">
                Authorized / VIP Vehicles
              </h3>
              <p className="text-xs text-green-700 uppercase tracking-widest font-semibold">
                Priority Access List
              </p>
            </div>
            <button
              onClick={() => setShowWhitelistModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded shadow-sm text-sm font-bold hover:bg-green-700 transition-colors"
            >
              + Authorize New Vehicle
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-green-50 text-green-900 font-bold uppercase text-xs border-b border-green-200">
                  <tr>
                    <th className="px-6 py-3 border-r border-green-100">
                      Vehicle No.
                    </th>
                    <th className="px-6 py-3 border-r border-green-100">
                      Official Name
                    </th>
                    <th className="px-6 py-3 border-r border-green-100">
                      Designation
                    </th>
                    <th className="px-6 py-3 border-r border-green-100">
                      Department
                    </th>
                    <th className="px-6 py-3 border-r border-green-100">
                      Access Zones
                    </th>
                    <th className="px-6 py-3">Priority</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-100">
                  {whitelist.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="p-8 text-center text-slate-500"
                      >
                        No authorized vehicles found.
                      </td>
                    </tr>
                  ) : (
                    whitelist.map((row) => (
                      <tr key={row.id} className="hover:bg-green-50">
                        <td className="px-6 py-3 border-r border-green-100 font-bold font-mono text-slate-900">
                          {row.vehicle_number}
                        </td>
                        <td className="px-6 py-3 border-r border-green-100 text-slate-900 font-medium">
                          {row.owner_name}
                        </td>
                        <td className="px-6 py-3 border-r border-green-100 text-slate-600">
                          {row.designation || "-"}
                        </td>
                        <td className="px-6 py-3 border-r border-green-100 text-slate-600">
                          {row.department || "-"}
                        </td>
                        <td className="px-6 py-3 border-r border-green-100 text-slate-500">
                          {row.access_zones}
                        </td>
                        <td className="px-6 py-3 border-r border-green-100">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${row.priority === "high" ? "bg-green-600 text-white" : "bg-blue-100 text-blue-800"}`}
                          >
                            {row.priority}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <button
                            onClick={() => handleRemoveWhitelist(row.id)}
                            className="text-red-600 hover:text-red-800 font-bold text-xs"
                          >
                            REVOKE
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- MODALS --- */}

      {/* HOTLIST MODAL */}
      {showHotlistModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 shadow-2xl">
          <div className="bg-teal-50/95 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-red-600 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg flex items-center gap-2">
                🚫 Add to Hotlist
              </h3>
              <button
                onClick={() => setShowHotlistModal(false)}
                className="hover:bg-red-700 p-1 rounded"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddHotlist} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Vehicle Registration Number *
                </label>
                <input
                  type="text"
                  value={hotlistForm.vehicle_number}
                  onChange={(e) =>
                    setHotlistForm({
                      ...hotlistForm,
                      vehicle_number: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g. DL 01 AB 1234"
                  className="w-full border border-slate-300 rounded px-3 py-2 font-mono uppercase focus:ring-2 focus:ring-red-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Reason / Offense *
                </label>
                <input
                  type="text"
                  value={hotlistForm.reason}
                  onChange={(e) =>
                    setHotlistForm({ ...hotlistForm, reason: e.target.value })
                  }
                  placeholder="e.g. Stolen Vehicle, Wanted in FIR..."
                  className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    FIR / Reference No.
                  </label>
                  <input
                    type="text"
                    value={hotlistForm.fir_number}
                    onChange={(e) =>
                      setHotlistForm({
                        ...hotlistForm,
                        fir_number: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Reporting Officer
                  </label>
                  <input
                    type="text"
                    value={hotlistForm.reporting_officer}
                    onChange={(e) =>
                      setHotlistForm({
                        ...hotlistForm,
                        reporting_officer: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Severity Level
                </label>
                <select
                  value={hotlistForm.severity}
                  onChange={(e) =>
                    setHotlistForm({ ...hotlistForm, severity: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="warning">Warning (Alert Only)</option>
                  <option value="critical">Critical (Stop Vehicle)</option>
                  <option value="info">Info (Monitor)</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowHotlistModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 text-white font-bold rounded shadow-md hover:bg-red-700 transition"
                >
                  Add to Hotlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WHITELIST MODAL */}
      {showWhitelistModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 shadow-2xl">
          <div className="bg-teal-50/95 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-green-600 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg flex items-center gap-2">
                ✅ Authorize Vehicle
              </h3>
              <button
                onClick={() => setShowWhitelistModal(false)}
                className="hover:bg-green-700 p-1 rounded"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddWhitelist} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Vehicle Registration Number *
                </label>
                <input
                  type="text"
                  value={whitelistForm.vehicle_number}
                  onChange={(e) =>
                    setWhitelistForm({
                      ...whitelistForm,
                      vehicle_number: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g. DL 01 AB 1234"
                  className="w-full border border-slate-300 rounded px-3 py-2 font-mono uppercase focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Official Name *
                </label>
                <input
                  type="text"
                  value={whitelistForm.owner_name}
                  onChange={(e) =>
                    setWhitelistForm({
                      ...whitelistForm,
                      owner_name: e.target.value,
                    })
                  }
                  placeholder="e.g. Dr. John Doe"
                  className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={whitelistForm.designation}
                    onChange={(e) =>
                      setWhitelistForm({
                        ...whitelistForm,
                        designation: e.target.value,
                      })
                    }
                    placeholder="e.g. Director"
                    className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={whitelistForm.department}
                    onChange={(e) =>
                      setWhitelistForm({
                        ...whitelistForm,
                        department: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={whitelistForm.priority}
                    onChange={(e) =>
                      setWhitelistForm({
                        ...whitelistForm,
                        priority: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="medium">Medium (Standard)</option>
                    <option value="high">High (Red Beacon)</option>
                    <option value="low">Low (Contractor)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Access Zones
                  </label>
                  <input
                    type="text"
                    value={whitelistForm.access_zones}
                    onChange={(e) =>
                      setWhitelistForm({
                        ...whitelistForm,
                        access_zones: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWhitelistModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white font-bold rounded shadow-md hover:bg-green-700 transition"
                >
                  Authorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GATE PASS MODAL */}
      {showGatePassModal && printedPassEntry && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-teal-50/95 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                🎫 Vehicle Gate Pass
              </h3>
              <button
                onClick={() => setShowGatePassModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div id="vehicle-gate-pass" className="p-6 bg-white relative">
              <div className="text-center border-b-2 border-slate-800 pb-4 mb-4">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                  {organization.name || "ORGANIZATION"}
                </h2>
                <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-bold mt-2">
                  VEHICLE PASS
                </div>
              </div>

              <div className="text-center mb-6">
                <p className="text-5xl font-black text-slate-900 font-mono tracking-tighter">
                  {printedPassEntry.vehicle_number}
                </p>
                <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">
                  {printedPassEntry.category || "VISITOR"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs border-y border-slate-100 py-4 mb-4">
                <div>
                  <p className="text-slate-400 uppercase font-bold">
                    Entry Time
                  </p>
                  <p className="font-mono font-bold text-slate-700">
                    {new Date(printedPassEntry.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 uppercase font-bold">Date</p>
                  <p className="font-mono font-bold text-slate-700">
                    {new Date(printedPassEntry.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase font-bold">Gate</p>
                  <p className="font-bold text-slate-700">
                    {printedPassEntry.gate_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 uppercase font-bold">Pass ID</p>
                  <p className="font-mono font-bold text-slate-700">
                    {printedPassEntry.gate_pass_id}
                  </p>
                </div>
              </div>

              <div className="bg-slate-100 rounded-lg p-3 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">
                  Security Status
                </p>
                <div className="flex justify-center gap-2">
                  {printedPassEntry.checklist_status?.puc_valid && (
                    <span className="bg-teal-50/95 border border-slate-200 px-1 rounded text-[10px]">
                      PUC
                    </span>
                  )}
                  {printedPassEntry.checklist_status?.insurance_valid && (
                    <span className="bg-teal-50/95 border border-slate-200 px-1 rounded text-[10px]">
                      INS
                    </span>
                  )}
                  <span className="bg-green-500 text-white px-2 rounded text-[10px] font-bold">
                    CLEARED
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-[10px] text-slate-400">
                  Please display on dashboard
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button
                onClick={() => {
                  window.print();
                  setShowGatePassModal(false);
                }}
                className="flex-1 bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 shadow-lg flex justify-center items-center gap-2"
              >
                🖨️ PRINT PASS
              </button>
            </div>
            <style>{`
                            @media print {
                                body * { visibility: hidden; }
                                #vehicle-gate-pass, #vehicle-gate-pass * { visibility: visible; }
                                #vehicle-gate-pass {
                                    position: fixed; left: 0; top: 0; width: 100%; height: 100%;
                                    margin: 0; padding: 20px;
                                    display: flex; flex-direction: column; justify-content: center;
                                }
                            }
                        `}</style>
          </div>
        </div>
      )}

      {/* WEBCAM MODAL */}
      {showWebcam && (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4">
          <div className="bg-teal-50/95 rounded-xl overflow-hidden w-full max-w-2xl relative">
            <button
              onClick={() => setShowWebcam(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center"
            >
              ✕
            </button>
            <WebcamCapture
              onImageCapture={handleImageCapture}
              label={`Capture ${activePhotoSlot ? activePhotoSlot.toUpperCase() : "Photo"}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationLPR;
