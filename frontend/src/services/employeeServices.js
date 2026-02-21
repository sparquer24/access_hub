import api from './api';

// Profile & Dashboard
export const employeeDashboardAPI = {
    getProfile: async () => {
        const response = await api.get('/api/employee/profile');
        return response.data;
    },

    getStatsSummary: async () => {
        const response = await api.get('/api/employee/stats/summary');
        return response.data;
    },

    getTodayAttendance: async () => {
        const response = await api.get('/api/employee/attendance/today');
        return response.data;
    }
};

// Leave Requests
export const leaveRequestsAPI = {
    create: async (data) => {
        const response = await api.post('/api/v2/leaves', data);
        return response.data;
    },

    getMyRequests: async (params = {}) => {
        const response = await api.get('/api/v2/leaves', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/api/v2/leaves/${id}`);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/api/v2/leaves/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/api/v2/leaves/${id}`);
        return response.data;
    },

    approve: async (id, notes = '') => {
        const response = await api.post(`/api/v2/leaves/${id}/approve`, { approval_notes: notes });
        return response.data;
    },

    reject: async (id, notes) => {
        const response = await api.post(`/api/v2/leaves/${id}/reject`, { status: 'rejected', approval_notes: notes });
        return response.data;
    }
};

// Attendance
export const attendanceAPI = {
    checkIn: async (data = {}) => {
        const response = await api.post('/api/v2/attendance/check-in', data);
        return response.data;
    },

    checkOut: async (data = {}) => {
        const response = await api.post('/api/v2/attendance/check-out', data);
        return response.data;
    },

    getToday: async () => {
        const response = await api.get('/api/v2/attendance', {
            params: {
                date: new Date().toISOString().split('T')[0]
            }
        });
        return response.data;
    },

    getMyHistory: async (params = {}) => {
        const response = await api.get('/api/v2/attendance', { params });
        return response.data;
    }
};

// Attendance Change Requests
export const attendanceChangeRequestsAPI = {
    create: async (data) => {
        const response = await api.post('/api/attendance-change-requests', data);
        return response.data;
    },

    getMyRequests: async (params = {}) => {
        const response = await api.get('/api/attendance-change-requests', { params });
        return response.data;
    },

    approve: async (id, notes = '') => {
        const response = await api.post(`/api/attendance-change-requests/${id}/approve`, { notes });
        return response.data;
    },

    reject: async (id, notes) => {
        const response = await api.post(`/api/attendance-change-requests/${id}/reject`, { notes });
        return response.data;
    }
};
