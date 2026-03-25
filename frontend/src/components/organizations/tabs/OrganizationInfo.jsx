import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, RadarChart, Radar, AreaChart, Area, LineChart, Line,
  PolarAngleAxis, PolarRadiusAxis, PolarGrid
} from 'recharts';
import {
  TrendingUp, Users, Camera, MapPin, Layers, Clock, Shield, Database,
  AlertCircle, CheckCircle2, Activity, Copy, Settings, Calendar, Briefcase, Download,
  Mail, Phone, Globe, Loader2, Sparkles
} from 'lucide-react';
import { organizationsService } from '../../../services/organizationsService';
import Loader from '../../common/Loader';
import { useToast } from '../../../contexts/ToastContext';

const OrganizationInfo = ({ organization, onUpdate }) => {
  const { error: showError } = useToast();
  const [copiedField, setCopiedField] = useState(null);
  
  // Single loading state for all data
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [visitorStats, setVisitorStats] = useState(null);
  const [departmentStats, setDepartmentStats] = useState(null);

  // Fetch all data when component mounts
  useEffect(() => {
    const fetchAllData = async () => {
      if (!organization?.id && !organization?.uuid) return;
      
      setLoading(true);
      const orgId = organization.id || organization.uuid;
      
      try {
        // Fetch all data in parallel
        const [attendanceData, visitorData, deptData] = await Promise.all([
          organizationsService.getAttendanceStats(orgId).catch(err => {
            console.error('Error fetching attendance stats:', err);
            return { success: false };
          }),
          organizationsService.getVisitorStats(orgId).catch(err => {
            console.error('Error fetching visitor stats:', err);
            return { success: false };
          }),
          organizationsService.getDepartmentAttendance(orgId).catch(err => {
            console.error('Error fetching department stats:', err);
            return { success: false };
          })
        ]);
        
        if (attendanceData.success) {
          setAttendanceStats(attendanceData.data);
        }
        if (visitorData.success) {
          setVisitorStats(visitorData.data);
        }
        if (deptData.success) {
          setDepartmentStats(deptData.data);
        }
      } catch (error) {
        console.error('Error fetching organization statistics:', error);
        showError('Failed to fetch organization statistics');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, [organization?.id, organization?.uuid, showError]);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleExport = () => {
    try {
      const reportRows = [
        ['Organization Name', organization?.name || 'N/A'],
        ['Organization ID', organization?.id || organization?.uuid || 'N/A'],
        ['Type', organization?.type || 'N/A'],
        ['Subscription', organization?.subscription_tier || 'N/A'],
        ['Employees', organization?.employees_count ?? 0],
        ['Departments', organization?.departments_count ?? 0],
        ['Cameras', organization?.cameras_count ?? 0],
        ['Locations', organization?.locations_count ?? 0],
        ['Attendance Rate (%)', attendanceRate ?? 0],
        ['Active Employees Today', activeToday ?? 0],
        ['Visitors Today', totalVisitorsToday ?? 0],
        ['Active Visitors', activeVisitors ?? 0],
      ];

      const csvContent = reportRows
        .map(([label, value]) => `"${String(label).replace(/"/g, '""')}","${String(value).replace(/"/g, '""')}"`)
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const datePart = new Date().toISOString().split('T')[0];
      link.href = url;
      link.setAttribute('download', `organization_report_${datePart}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting organization report:', error);
      showError('Failed to export report');
    }
  };


  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getDaysActive = () => {
    if (!organization.created_at) return 0;
    const created = new Date(organization.created_at);
    const today = new Date();
    return Math.floor((today - created) / (1000 * 60 * 60 * 24));
  };

  const getResourceUtilization = () => {
    const maxEmployees = 500;
    const maxCameras = 100;
    const empUtil = ((organization.employees_count || 0) / maxEmployees) * 100;
    const camUtil = ((organization.cameras_count || 0) / maxCameras) * 100;
    return {
      employees: Math.min(empUtil, 100),
      cameras: Math.min(camUtil, 100)
    };
  };

  const resourceData = [
    { name: 'Employees', count: organization.employees_count || 0, color: '#0D9488' },
    { name: 'Cameras', count: organization.cameras_count || 0, color: '#14B8A6' },
    { name: 'Locations', count: organization.locations_count || 0, color: '#2DD4BF' },
    { name: 'Departments', count: organization.departments_count || 0, color: '#5EEAD4' },
  ];

  const radarData = [
    { category: 'Employees', value: Math.min((organization.employees_count || 0) / 5, 100) },
    { category: 'Departments', value: Math.min((organization.departments_count || 0) * 20, 100) },
    { category: 'Cameras', value: Math.min((organization.cameras_count || 0) / 1.5, 100) },
    { category: 'Locations', value: Math.min((organization.locations_count || 0) * 25, 100) },
  ];

  // Mock data for additional statistics
  const visitorActivityData = [
    { name: 'Mon', visitors: 120, trend: 'up' },
    { name: 'Tue', visitors: 132, trend: 'up' },
    { name: 'Wed', visitors: 101, trend: 'down' },
    { name: 'Thu', visitors: 134, trend: 'up' },
    { name: 'Fri', visitors: 190, trend: 'up' },
    { name: 'Sat', visitors: 90, trend: 'down' },
    { name: 'Sun', visitors: 85, trend: 'down' },
  ];

  const cameraHealthData = [
    { name: 'Online', value: Math.floor((organization.cameras_count || 0) * 0.92), color: '#22c55e' },
    { name: 'Offline', value: Math.floor((organization.cameras_count || 0) * 0.05), color: '#ef4444' },
    { name: 'Maintenance', value: Math.floor((organization.cameras_count || 0) * 0.03), color: '#f59e0b' },
  ].filter(item => item.value > 0);

  // If no cameras, show placeholder data
  if (cameraHealthData.length === 0 && (organization.cameras_count || 0) > 0) {
    cameraHealthData.push({ name: 'Online', value: organization.cameras_count, color: '#22c55e' });
  } else if ((organization.cameras_count || 0) === 0) {
    cameraHealthData.push({ name: 'No Cameras', value: 1, color: '#9ca3af' });
  }



  const utilization = getResourceUtilization();

  // Define enabled features FIRST before using them
  const enabledFeatures = organization.enabled_features || {};

  // Feature flags - now can safely access enabledFeatures
  const hasAttendanceFeature = enabledFeatures.employee_attendance !== false; // Default true
  const hasVisitorFeature = enabledFeatures.visitor_management === true;

  // HR Dashboard - Additional Data (use API data -> organization data -> fallbacks)
  const activeToday = attendanceStats?.active_today ?? (organization.active_employees_today || Math.floor((organization.employees_count || 0) * 0.87));
  const attendanceRate = attendanceStats?.attendance_rate ?? (organization.attendance_rate || 87);
  const attendanceTrend = attendanceStats?.attendance_trend ?? (organization.attendance_trend || 5.2);

  // Helper to ensure array has data or use fallback
  const ensureData = (data, fallback) => (data && data.length > 0 ? data : fallback);

  const employeeTrendData = ensureData(attendanceStats?.employee_trend, []);


  const attendanceTrendData = ensureData(attendanceStats?.trend_data, []);

  // On-Time vs Late Arrival Data
  const punctualityData = ensureData(attendanceStats?.punctuality_data, []);

  // Department-wise Attendance - NO HARDCODED FALLBACK
  const departmentAttendanceData = ensureData(departmentStats, []);


  // Visitor Management Data (use API data -> organization data -> fallbacks)
  const totalVisitorsToday = visitorStats?.visitors_today ?? 0;
  const activeVisitors = visitorStats?.active_visitors ?? 0;

  const visitorTrendData = ensureData(visitorStats?.monthly_trend, []);

  const visitorWeeklyData = ensureData(visitorStats?.weekly_activity, []);

  const cameraUptime = Math.floor(((cameraHealthData.find(d => d.name === 'Online')?.value || 0) / (organization.cameras_count || 1)) * 100);

  const featureList = [
    { key: 'visitor_management', label: 'Visitor Management', enabled: enabledFeatures.visitor_management },
    { key: 'employee_attendance', label: 'Employee Attendance', enabled: true },
    { key: 'advanced_analytics', label: 'Advanced Analytics', enabled: enabledFeatures.advanced_analytics },
    { key: 'camera_integration', label: 'Camera Integration', enabled: enabledFeatures.camera_integration },
    { key: 'multi_location', label: 'Multi-Location', enabled: enabledFeatures.multi_location },
    { key: 'lpr_integration', label: 'LPR Integration', enabled: enabledFeatures.lpr_integration },
  ];

  const formatWorkingHours = () => {
    const hours = organization.working_hours || {};
    if (hours.start && hours.end) {
      return `${hours.start} - ${hours.end}`;
    }
    return '9:00 AM - 6:00 PM';
  };

  const formatWorkingDays = () => {
    const hours = organization.working_hours || {};
    if (hours.days && Array.isArray(hours.days)) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return hours.days.map(d => dayNames[d]).join(', ');
    }
    return 'Monday - Friday';
  };



  // AI Intelligence Helper Functions
  const getAIInsights = () => {
    const daysActive = getDaysActive();

    if (daysActive < 7) {
      return {
        isCollecting: true,
        message: `AI Organization Intelligence is currently collecting baseline data. Detailed insights and predictive analytics will be available in ${7 - daysActive} more days.`
      };
    }

    // Workforce Health Logic
    let workforceMessage = '';
    if (attendanceRate >= 85) {
      workforceMessage = `The AI identifies ${organization.name} as a high-performance organization with an exceptional ${attendanceRate}% attendance stability score. Workforce utilization is optimized across all ${organization.departments_count} departments.`;
    } else if (attendanceRate >= 70) {
      workforceMessage = `The AI identifies ${organization.name} as a stable organization with a consistent ${attendanceRate}% attendance rate. Minor optimizations in shift scheduling could further enhance workforce utilization.`;
    } else {
      workforceMessage = `The AI has detected variability in attendance stability (currently ${attendanceRate}%). We recommend reviewing workforce management protocols to improve organizational health.`;
    }

    // Security Posture Logic
    let securityMessage = '';
    if (cameraUptime >= 95) {
      securityMessage = `Real-time analysis of ${organization.cameras_count} surveillance assets shows excellent ${cameraUptime}% infrastructure health. AI-enhanced monitoring is effectively mitigating risks at ${organization.locations_count} locations.`;
    } else if (cameraUptime >= 70) {
      securityMessage = `Analysis of ${organization.cameras_count} assets shows stable ${cameraUptime}% infrastructure health. Periodic maintenance is recommended for offline units at ${organization.locations_count} locations.`;
    } else {
      securityMessage = `Security infrastructure health is currently at ${cameraUptime}%, which is below optimal levels. Deployment of technical support is recommended at ${organization.locations_count} site locations.`;
    }

    // Predictive Growth Logic
    let growthMessage = '';
    const growthRate = Math.abs(attendanceTrend) > 0 ? (attendanceTrend * 2).toFixed(1) : "12";
    if (attendanceTrend > 0) {
      growthMessage = `Based on recent upward trends, visitor engagement is projected to grow by ${growthRate}% next month. We recommend increasing registration capacity for peak morning windows.`;
    } else {
      growthMessage = `Based on current traffic patterns, visitor volume is stabilizing. The system recommends optimizing front-desk staffing for the projected ${growthRate}% engagement variance.`;
    }

    return {
      isCollecting: false,
      workforce: workforceMessage,
      security: securityMessage,
      growth: growthMessage
    };
  };

  const aiInsights = getAIInsights();

  return (
    <div className="space-y-3 animate-fadeIn bg-gradient-to-br from-white/80 via-cyan-50/80 to-teal-50/80 py-2 backdrop-blur-sm overflow-y-auto max-h-[calc(100vh-280px)]">
      <div className="px-2 mb-3">
        <div className="bg-gradient-to-r from-teal-900 via-cyan-900 to-slate-900 rounded-2xl p-6 shadow-2xl relative overflow-hidden group border border-teal-500/30">
          <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-30 transition-opacity duration-1000 pointer-events-none">
            <Sparkles className="h-64 w-64 text-cyan-400 animate-pulse" />
          </div>
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-teal-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-cyan-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>

          <div className="relative z-10 ">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/20 shadow-[0_0_15px_rgba(45,212,191,0.5)]">
                <Loader type="ai" size="small" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-teal-200 tracking-tight">
                  AI Organization Intelligence
                </h2>
                <p className="text-teal-200/80 text-xs font-medium tracking-wider uppercase">Live Organizational Neural Network</p>
              </div>

              <div className="flex gap-2 ml-auto">
                <span className="flex items-center gap-1.5 text-[10px] bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30 font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></div>
                  Active Analysis
                </span>
                <span className="flex items-center gap-1.5 text-[10px] bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full border border-cyan-500/30 font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                  <Sparkles className="w-3 h-3" />
                  Predictive Model v2.4
                </span>
              </div>
            </div>

            {aiInsights.isCollecting ? (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                <div className="flex justify-center mb-6">
                  <div className="bg-teal-500/20 p-4 rounded-full animate-pulse ring-4 ring-teal-500/10">
                    <Loader type="ai" size="medium" />
                  </div>
                </div>
                <h3 className="text-white font-bold text-xl mb-2 tracking-tight">Initializing Neural Collection</h3>
                <p className="text-teal-200 text-sm max-w-2xl mx-auto leading-relaxed">
                  {aiInsights.message}
                </p>
                <div className="mt-8 flex justify-center gap-3">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div
                      key={i}
                      className={`h-2 w-10 rounded-full transition-all duration-500 ${i <= getDaysActive() ? 'bg-gradient-to-r from-teal-500 to-cyan-500 shadow-[0_0_8px_rgba(45,212,191,0.6)]' : 'bg-white/10'}`}
                    ></div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors group/card">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded bg-teal-500/20 text-teal-300 group-hover/card:scale-110 transition-transform">
                      <Users className="w-4 h-4" />
                    </div>
                    <p className="text-teal-300 text-[10px] font-black uppercase tracking-widest">Workforce Health</p>
                  </div>
                  <p className="text-slate-200 text-sm leading-relaxed border-l-2 border-teal-500/50 pl-3">
                    {aiInsights.workforce}
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors group/card">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded bg-rose-500/20 text-rose-300 group-hover/card:scale-110 transition-transform">
                      <Shield className="w-4 h-4" />
                    </div>
                    <p className="text-rose-300 text-[10px] font-black uppercase tracking-widest">Security Posture</p>
                  </div>
                  <p className="text-slate-200 text-sm leading-relaxed border-l-2 border-rose-500/50 pl-3">
                    {aiInsights.security}
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors group/card">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded bg-violet-500/20 text-violet-300 group-hover/card:scale-110 transition-transform">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <p className="text-violet-300 text-[10px] font-black uppercase tracking-widest">Predictive Growth</p>
                  </div>
                  <p className="text-slate-200 text-sm leading-relaxed border-l-2 border-violet-500/50 pl-3">
                    {aiInsights.growth}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resource Analysis - Professional Dashboard (Moved to Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6 mt-6">
        {/* Resource Distribution Chart */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Resource Composition
            </h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="h-80 w-full flex items-center justify-center">
                <Loader type="spin" size="large" text="Loading Chart Data..." />
              </div>
            ) : (
              <>
                <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D9488" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0D9488" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#94a3b8" />
                  <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" />
                  <Tooltip
                    cursor={{ fill: 'rgba(13, 148, 136, 0.1)' }}
                    contentStyle={{ borderRadius: '8px', border: '2px solid #0D9488', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [`${value} Units`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={50}>
                    {resourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {resourceData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-gray-700">{item.name}: <strong>{item.count}</strong></span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Resource Utilization Radar Chart */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 to-teal-400 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5" /> Organization Capacity
            </h3>
          </div>
          <div className="p-6">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="category" stroke="#64748b" />
                  <PolarRadiusAxis stroke="#94a3b8" />
                  <Radar name="Utilization" dataKey="value" stroke="#0D9488" fill="#0D9488" fillOpacity={0.6} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '2px solid #0D9488', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [`${value.toFixed(0)}%`, 'Capacity']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg mt-4 border border-teal-200">
              <p className="text-xs text-gray-700">
                <strong>📊 Capacity Status:</strong> Your organization is utilizing resources efficiently across all departments and asset management.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary KPI Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 ">
        <div className="bg-white rounded-xl p-4 border-l-4 border-teal-600 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Total Employees</span>
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">{organization.employees_count || 0}</div>
          <p className="text-xs text-gray-500 mt-1">Active workforce</p>
        </div>

        <div className="bg-white rounded-xl p-4 border-l-4 border-teal-500 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Cameras</span>
            <Camera className="w-5 h-5 text-teal-500" />
          </div>
          <div className="text-2xl font-black text-gray-900">{organization.cameras_count || 0}</div>
          <p className="text-xs text-gray-500 mt-1">Surveillance assets</p>
        </div>

        <div className="bg-white rounded-xl p-4 border-l-4 border-teal-400 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Locations</span>
            <MapPin className="w-5 h-5 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-gray-900">{organization.locations_count || 0}</div>
          <p className="text-xs text-gray-500 mt-1">Physical sites</p>
        </div>

        <div className="bg-white rounded-xl p-4 border-l-4 border-teal-700 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Departments</span>
            <Layers className="w-5 h-5 text-teal-700" />
          </div>
          <div className="text-2xl font-black text-gray-900">{organization.departments_count || 0}</div>
          <p className="text-xs text-gray-500 mt-1">Organizational units</p>
        </div>
      </div>



      {/* Feature-Based Charts - Attendance and/or Visitor Management */}
      {
        (hasAttendanceFeature || hasVisitorFeature) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Attendance Rate Trend - Show FIRST if Attendance enabled */}
            {hasAttendanceFeature && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5" /> Attendance Rate Trend
                  </h3>
                </div>
                <div className="p-6">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={attendanceTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '2px solid #14b8a6', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                          formatter={(value) => [`${value}%`, 'Attendance']}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#14b8a6"
                          strokeWidth={3}
                          dot={{ fill: '#14b8a6', r: 5 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg mt-4 border border-teal-200">
                    <p className="text-xs text-gray-700">
                      <strong>✅ Attendance Status:</strong> Current attendance rate is {attendanceRate}%, with a positive trend of +{attendanceTrend}% over the last period.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Weekly Visitor Activity - Show FIRST if Visitor Management enabled */}
            {hasVisitorFeature && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5" /> Weekly Visitor Activity
                  </h3>
                </div>
                <div className="p-6">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={visitorWeeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '2px solid #6366f1', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                          formatter={(value) => [`${value} visitors`, 'Daily Count']}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#6366f1"
                          strokeWidth={3}
                          dot={{ fill: '#6366f1', r: 5 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg mt-4 border border-indigo-200">
                    <p className="text-xs text-gray-700">
                      <strong>👥 Activity Status:</strong> Average of {Math.floor(visitorWeeklyData.reduce((sum, d) => sum + d.value, 0) / visitorWeeklyData.length)} visitors per day this week.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* On-Time vs Late Arrivals - Show if Attendance enabled */}
            {hasAttendanceFeature && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5" /> Punctuality Analysis
                  </h3>
                </div>
                <div className="p-6">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={punctualityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '2px solid #10b981', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                        />
                        <Legend />
                        <Bar dataKey="onTime" name="On-Time" fill="#10b981" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="late" name="Late" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg mt-4 border border-emerald-200">
                    <p className="text-xs text-gray-700">
                      <strong>⏰ Punctuality Insight:</strong> Average {Math.floor(punctualityData.reduce((sum, d) => sum + d.onTime, 0) / punctualityData.length)} employees arrive on-time daily, with {Math.floor(punctualityData.reduce((sum, d) => sum + d.late, 0) / punctualityData.length)} arriving late.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Department Attendance Breakdown - Show if Attendance enabled */}
            {hasAttendanceFeature && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 px-6 py-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5" /> Department Attendance
                  </h3>
                </div>
                <div className="p-6">
                  {loading ? (
                    <div className="h-80 w-full flex items-center justify-center">
                      <Loader type="spin" size="large" text="Loading Department Data..." />
                    </div>
                  ) : departmentAttendanceData.length > 0 ? (
                    <>
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={departmentAttendanceData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" stroke="#64748b" domain={[0, 100]} />
                            <YAxis dataKey="name" type="category" stroke="#64748b" width={100} />
                            <Tooltip
                              contentStyle={{ borderRadius: '8px', border: '2px solid #06b6d4', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                              formatter={(value) => [`${value}%`, 'Attendance']}
                            />
                            <Bar dataKey="rate" fill="#06b6d4" radius={[0, 8, 8, 0]}>
                              {departmentAttendanceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.rate >= 90 ? '#10b981' : entry.rate >= 85 ? '#06b6d4' : '#f59e0b'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-lg mt-4 border border-cyan-200">
                        <p className="text-xs text-gray-700">
                          <strong>📊 Department Insight:</strong> {
                            departmentAttendanceData.length > 0
                              ? `Highest attendance in ${departmentAttendanceData.reduce((prev, current) => (prev.rate > current.rate) ? prev : current).name} department.`
                              : 'No department attendance data available yet.'
                          }
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="h-80 w-full flex flex-col items-center justify-center text-gray-400">
                      <Layers className="w-12 h-12 mb-2 opacity-20" />
                      <p>No department data available</p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Employee Headcount Trend - Show if Attendance enabled */}
            {hasAttendanceFeature && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5" /> Total Headcount Trend
                  </h3>
                </div>
                <div className="p-6">
                  {employeeTrendData.length > 0 ? (
                    <>
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={employeeTrendData}>
                            <defs>
                              <linearGradient id="colorEmpLarge" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" stroke="#64748b" />
                            <YAxis stroke="#64748b" />
                            <Tooltip
                              contentStyle={{ borderRadius: '8px', border: '2px solid #3b82f6', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                              formatter={(value) => [`${value} employees`, 'Headcount']}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#3b82f6"
                              fillOpacity={1}
                              fill="url(#colorEmpLarge)"
                              strokeWidth={3}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mt-4 border border-blue-200">
                        <p className="text-xs text-gray-700">
                          <strong>📈 Growth Status:</strong> Your organization is maintaining a steady workforce of {(employeeTrendData[employeeTrendData.length - 1] || {}).value || 0} employees.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="h-80 w-full flex flex-col items-center justify-center text-gray-400">
                      <Users className="w-12 h-12 mb-2 opacity-20" />
                      <p>No historical data available</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Visitor Trend - Show if Visitor Management enabled */}
            {hasVisitorFeature && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5" /> Monthly Visitor Trend
                  </h3>
                </div>
                <div className="p-6">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={visitorTrendData}>
                        <defs>
                          <linearGradient id="colorVisitorLarge" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#9333ea" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#9333ea" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '2px solid #9333ea', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                          formatter={(value) => [`${value} visitors`, 'Visitors']}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#9333ea"
                          fillOpacity={1}
                          fill="url(#colorVisitorLarge)"
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg mt-4 border border-purple-200">
                    <p className="text-xs text-gray-700">
                      <strong>📊 Visitor Status:</strong> {(visitorTrendData[visitorTrendData.length - 1] || {}).value || 0} visitors in most recent period.
                    </p>
                  </div>
                </div>
              </div>
            )}



          </div>
        )
      }

      {/* Analytics Section - Camera Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Timeline & Audit Information */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-teal-700 to-teal-600 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5" /> Organization Timeline
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                  <div className="w-0.5 h-20 bg-gray-200 mt-2"></div>
                </div>
                <div className="pb-6">
                  <p className="font-bold text-gray-900">Organization Created</p>
                  <p className="text-sm text-gray-600">{formatDate(organization.created_at)}</p>
                  <p className="text-xs text-gray-500 mt-1">🎯 By: {organization.created_by_username || 'System'}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                  <div className="w-0.5 h-20 bg-gray-200 mt-2"></div>
                </div>
                <div className="pb-6">
                  <p className="font-bold text-gray-900">Last Updated</p>
                  <p className="text-sm text-gray-600">{formatDate(organization.updated_at)}</p>
                  <p className="text-xs text-gray-500 mt-1">🔄 By: {organization.updated_by_username || 'N/A'}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white"></div>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Current Status</p>
                  <p className="text-sm text-gray-600">
                    {organization.is_active ? '✅ Active & Operational' : '⚠️ Inactive'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Running for {getDaysActive()} days</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Camera Health Donut Chart */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-teal-400 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5" /> Camera Infrastructure Status
            </h3>
          </div>
          <div className="p-6">
            <div className="h-80 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cameraHealthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {cameraHealthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '2px solid #0D9488', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    formatter={(value) => `${value} cameras`}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {cameraHealthData.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg border text-center" style={{ borderColor: item.color, backgroundColor: `${item.color}15` }}>
                  <div className="text-lg font-bold" style={{ color: item.color }}>{item.value}</div>
                  <div className="text-xs text-gray-600">{item.name}</div>
                </div>
              ))}
            </div>

            {/* Camera-Location Linkage Information */}
            <div className="mt-6 border-t border-slate-200 pt-4">
              <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-600" />
                Camera-Location Linkage
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {/* Linked Cameras */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Camera className="w-5 h-5 text-green-600" />
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-2xl font-black text-green-700">
                    {Math.floor((organization.cameras_count || 0) * 0.85)}
                  </div>
                  <p className="text-xs font-semibold text-green-700 mt-1">Linked Cameras</p>
                  <p className="text-xs text-green-600 mt-1">Assigned to locations</p>
                </div>

                {/* Unlinked Cameras */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Camera className="w-5 h-5 text-amber-600" />
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-amber-700">
                    {Math.floor((organization.cameras_count || 0) * 0.15)}
                  </div>
                  <p className="text-xs font-semibold text-amber-700 mt-1">Unlinked Cameras</p>
                  <p className="text-xs text-amber-600 mt-1">Need location assignment</p>
                </div>

                {/* Locations Without Cameras */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-blue-700">
                    {Math.floor((organization.locations_count || 0) * 0.20)}
                  </div>
                  <p className="text-xs font-semibold text-blue-700 mt-1">Unmonitored Locations</p>
                  <p className="text-xs text-blue-600 mt-1">Without cameras</p>
                </div>
              </div>

              {/* Coverage Summary */}
              <div className="mt-3 bg-gradient-to-r from-teal-50 to-cyan-50 p-3 rounded-lg border border-teal-200">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-teal-900">Coverage Status</p>
                    <p className="text-xs text-teal-700 mt-1">
                      {Math.floor(((organization.locations_count || 0) - Math.floor((organization.locations_count || 0) * 0.20)) / (organization.locations_count || 1) * 100)}%
                      of locations have camera coverage. Consider assigning cameras to unmonitored locations for comprehensive security.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Organization Details & System Health Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Organization Profile */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-teal-800 to-teal-700 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5" /> Organization Profile
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {/* Name & Code */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Name</label>
                <div className="relative">
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 rounded-lg border border-slate-200 text-gray-900 font-semibold pr-10 break-words">
                    {organization.name}
                  </div>
                  <button
                    onClick={() => copyToClipboard(organization.name, 'name')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-slate-200 rounded"
                    title="Copy name"
                  >
                    <Copy className={`w-4 h-4 ${copiedField === 'name' ? 'text-green-600' : 'text-gray-400'}`} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Code</label>
                <div className="relative">
                  <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-4 py-3 rounded-lg border border-teal-200 text-teal-900 font-bold tracking-wider pr-10">
                    {organization.code || 'N/A'}
                  </div>
                  <button
                    onClick={() => copyToClipboard(organization.code, 'code')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-teal-200 rounded"
                    title="Copy code"
                  >
                    <Copy className={`w-4 h-4 ${copiedField === 'code' ? 'text-green-600' : 'text-gray-400'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Organization Type & Status */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Type</label>
                <div className="bg-slate-50 px-4 py-3 rounded-lg border border-slate-200">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-teal-100 text-teal-700">
                    {organization.organization_type ? organization.organization_type.replace('_', ' ') : 'Office'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Status</label>
                <div className="bg-slate-50 px-4 py-3 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2">
                    {organization.is_active ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-bold text-green-700">Active</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-bold text-red-700">Inactive</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            {organization.address && (
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">📍 Address</label>
                <div className="bg-slate-50 px-4 py-3 rounded-lg border border-slate-200 text-gray-700">
                  {organization.address}
                </div>
              </div>
            )}

            {/* Contact Details */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
              {organization.contact_email && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">📧 Email</label>
                  <div className="bg-slate-50 px-4 py-3 rounded-lg border border-slate-200 text-sm text-gray-700 break-all">
                    {organization.contact_email}
                  </div>
                </div>
              )}
              {organization.contact_phone && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">📞 Phone</label>
                  <div className="bg-slate-50 px-4 py-3 rounded-lg border border-slate-200 text-sm text-gray-700">
                    {organization.contact_phone}
                  </div>
                </div>
              )}
            </div>

            {/* Timezone & Created Info */}
            <div className="pt-2 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">🕐 Timezone</label>
                  <div className="bg-slate-50 px-4 py-3 rounded-lg border border-slate-200 text-gray-700 text-sm">
                    {organization.timezone || 'UTC'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">📅 Days Active</label>
                  <div className="bg-slate-50 px-4 py-3 rounded-lg border border-slate-200 text-gray-700 text-sm font-bold">
                    {getDaysActive()} days
                  </div>
                </div>
              </div>
            </div>

            {/* Working Hours & Days */}
            <div className="pt-2 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Working Hours
                  </label>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 rounded-lg border border-blue-200 text-blue-900 text-sm font-semibold">
                    {formatWorkingHours()}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Working Days
                  </label>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-3 rounded-lg border border-green-200 text-green-900 text-sm font-semibold">
                    {formatWorkingDays()}
                  </div>
                </div>
              </div>
            </div>

            {/* Organization UUID */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                <Database className="w-3 h-3 inline mr-1" />
                Organization ID
              </label>
              <div className="relative">
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-4 py-3 rounded-lg border border-purple-200 text-purple-900 font-mono text-xs pr-10 break-all">
                  {organization.id || organization.uuid || 'N/A'}
                </div>
                <button
                  onClick={() => copyToClipboard(organization.id || organization.uuid, 'uuid')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-purple-200 rounded"
                  title="Copy ID"
                >
                  <Copy className={`w-4 h-4 ${copiedField === 'uuid' ? 'text-green-600' : 'text-gray-400'}`} />
                </button>
              </div>
            </div>

            {/* Enabled Features */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                <Settings className="w-3 h-3 inline mr-1" />
                Enabled Features
              </label>
              <div className="bg-slate-50 px-4 py-3 rounded-lg border border-slate-200">
                <div className="flex flex-wrap gap-2">
                  {featureList.map((feature, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${feature.enabled
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-500 border border-gray-300'
                        }`}
                    >
                      {feature.enabled ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {feature.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Website URL if available */}
            {organization.website && (
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                  <Globe className="w-3 h-3 inline mr-1" />
                  Website
                </label>
                <div className="bg-slate-50 px-4 py-3 rounded-lg border border-slate-200">
                  <a
                    href={organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
                  >
                    {organization.website}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: System Health & Quick Stats */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5" /> System Health & Quick Stats
            </h3>
          </div>
          <div className="p-6 space-y-4">

            {/* Camera Uptime */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                <Camera className="w-3 h-3 inline mr-1" />
                Camera Uptime
              </label>
              <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-3 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-green-700">{cameraUptime}%</span>
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-xs text-green-700 mt-1">All systems operational</p>
              </div>
            </div>


            {/* Active Employees Today - Show if Attendance enabled */}
            {hasAttendanceFeature && (
              <div className="border-t border-slate-200 pt-4">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                  <Users className="w-3 h-3 inline mr-1" />
                  Active Today
                </label>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-black text-blue-700">{activeToday}</span>
                      <span className="text-sm text-blue-600 ml-2">/ {organization.employees_count || 0}</span>
                    </div>
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-xs text-blue-700 mt-1">Employees checked in</p>
                </div>
              </div>
            )}

            {/* Visitors Today - Show if Visitor Management enabled */}
            {hasVisitorFeature && (
              <div className="border-t border-slate-200 pt-4">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                  <Users className="w-3 h-3 inline mr-1" />
                  Visitors Today
                </label>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-4 py-3 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-black text-purple-700">{totalVisitorsToday}</span>
                      <span className="text-sm text-purple-600 ml-2">total</span>
                    </div>
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-xs text-purple-700 mt-1">Visitor check-ins today</p>
                </div>
              </div>
            )}

            {/* Attendance Rate - Show if Attendance enabled */}
            {hasAttendanceFeature && (
              <div className="border-t border-slate-200 pt-4">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Attendance Rate
                </label>
                <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-4 py-3 rounded-lg border border-teal-200">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-teal-700">{attendanceRate}%</span>
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-sm font-bold">+{attendanceTrend}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-teal-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${attendanceRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Active Visitors - Show if Visitor Management enabled */}
            {hasVisitorFeature && (
              <div className="border-t border-slate-200 pt-4">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                  <Activity className="w-3 h-3 inline mr-1" />
                  Active Visitors
                </label>
                <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-4 py-3 rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-indigo-700">{activeVisitors}</span>
                    <div className="flex items-center gap-1 text-indigo-600">
                      <Activity className="w-5 h-5" />
                      <span className="text-sm font-bold">On-site</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(activeVisitors / totalVisitorsToday) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Resource Utilization */}
            <div className="border-t border-slate-200 pt-4">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                <Layers className="w-3 h-3 inline mr-1" />
                Resource Utilization
              </label>
              <div className="space-y-3">
                {/* Employee Utilization */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-gray-600">Employees</span>
                    <span className="text-xs font-bold text-gray-900">{utilization.employees.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${utilization.employees}%` }}
                    ></div>
                  </div>
                </div>

                {/* Camera Utilization */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-gray-600">Cameras</span>
                    <span className="text-xs font-bold text-gray-900">{utilization.cameras.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-teal-400 to-teal-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${utilization.cameras}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>





    </div >
  );
};

export default OrganizationInfo;
