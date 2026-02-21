import api from './api';

// Manager Services API
export const managerAPI = {
    // Team Stats
    getTeamStats: async () => {
        const response = await api.get('/api/manager/team/stats');
        return response.data;
    },

    // Team Members
    getTeamMembers: async () => {
        const response = await api.get('/api/manager/team/members');
        return response.data;
    },

    // Dashboard Activities
    getDashboardActivities: async () => {
        const response = await api.get('/api/manager/dashboard/activities');
        return response.data;
    },

    // Organization Info
    getOrganizationInfo: async () => {
        const response = await api.get('/api/v2/organizations/me');
        return response.data;
    },

    // Cameras
    getCameras: async () => {
        const response = await api.get('/api/manager/cameras');
        return response.data;
    },

    // Locations
    getLocations: async () => {
        const response = await api.get('/api/manager/locations');
        return response.data;
    },

    // Today's Team Attendance
    getTodayAttendance: async (params = {}) => {
        const today = new Date().toISOString().split('T')[0];
        const response = await api.get('/api/v2/attendance', {
            params: {
                date: today,
                ...params
            }
        });
        return response.data;
    },

    // Attendance by date range
    getAttendanceByDateRange: async (startDate, endDate, params = {}) => {
        const response = await api.get('/api/v2/attendance', {
            params: {
                start_date: startDate,
                end_date: endDate,
                ...params
            }
        });
        return response.data;
    }
};

// Leave Request Management for Managers
export const managerLeaveAPI = {
    // Get pending leave requests - use manager endpoint
    getPendingLeaves: async (params = {}) => {
        const response = await api.get('/api/manager/leaves/pending', { params });
        return response.data;
    },

    // Get all leave requests with filters
    getAllLeaves: async (params = {}) => {
        const response = await api.get('/api/manager/leaves/pending', {
            params: {
                status: 'all',
                ...params
            }
        });
        return response.data;
    },

    // Approve leave request - use manager endpoint
    approve: async (leaveId, comments = '') => {
        const response = await api.post(`/api/manager/leaves/${leaveId}/approve`, { comments });
        return response.data;
    },

    // Reject leave request - use manager endpoint  
    reject: async (leaveId, comments) => {
        const response = await api.post(`/api/manager/leaves/${leaveId}/reject`, { comments });
        return response.data;
    }
};

// Manager Reports API
export const managerReportsAPI = {
    // Get attendance report
    getAttendanceReport: async (startDate, endDate) => {
        const response = await api.get('/api/manager/reports/attendance', {
            params: {
                start_date: startDate,
                end_date: endDate
            }
        });
        return response.data;
    },

    // Get leaves report
    getLeavesReport: async (startDate, endDate) => {
        const response = await api.get('/api/manager/reports/leaves', {
            params: {
                start_date: startDate,
                end_date: endDate
            }
        });
        return response.data;
    },

    // Get team performance report
    getTeamPerformanceReport: async (startDate, endDate) => {
        const response = await api.get('/api/manager/reports/team-performance', {
            params: {
                start_date: startDate,
                end_date: endDate
            }
        });
        return response.data;
    }
};

// Attendance Change Request Management for Managers
export const managerAttendanceChangeAPI = {
    // Get pending attendance change requests
    getPendingRequests: async (params = {}) => {
        const response = await api.get('/api/v2/attendance-change-requests/pending', { params });
        return response.data;
    },

    // Get all attendance change requests with filters
    getAllRequests: async (params = {}) => {
        const response = await api.get('/api/v2/attendance-change-requests', { params });
        return response.data;
    },

    // Get specific request by ID
    getById: async (requestId) => {
        const response = await api.get(`/api/v2/attendance-change-requests/${requestId}`);
        return response.data;
    },

    // Approve attendance change request
    approve: async (requestId, notes = '') => {
        const response = await api.post(`/api/v2/attendance-change-requests/${requestId}/approve`, { approval_notes: notes });
        return response.data;
    },

    // Reject attendance change request
    reject: async (requestId, notes) => {
        const response = await api.post(`/api/v2/attendance-change-requests/${requestId}/reject`, { status: 'rejected', approval_notes: notes });
        return response.data;
    }
};

export default {
    managerAPI,
    managerLeaveAPI,
    managerReportsAPI,
    managerAttendanceChangeAPI
};
