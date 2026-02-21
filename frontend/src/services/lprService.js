import api from './api';

export const lprService = {
    // --- THE REGISTER (LOGS) ---
    getStats: (organizationId) =>
        api.get(`/api/v2/organizations/${organizationId}/lpr/stats`),

    getLogs: (organizationId, params) =>
        api.get(`/api/v2/organizations/${organizationId}/lpr/logs`, { params }),

    // --- HOTLIST ---
    getHotlist: (organizationId) =>
        api.get(`/api/v2/organizations/${organizationId}/lpr/hotlist`),

    addToHotlist: (organizationId, data) =>
        api.post(`/api/v2/organizations/${organizationId}/lpr/hotlist`, data),

    removeFromHotlist: (organizationId, entryId) =>
        api.delete(`/api/v2/organizations/${organizationId}/lpr/hotlist/${entryId}`),

    // --- WHITELIST ---
    getWhitelist: (organizationId) =>
        api.get(`/api/v2/organizations/${organizationId}/lpr/whitelist`),

    addToWhitelist: (organizationId, data) =>
        api.post(`/api/v2/organizations/${organizationId}/lpr/whitelist`, data),

    removeFromWhitelist: (organizationId, entryId) =>
        api.delete(`/api/v2/organizations/${organizationId}/lpr/whitelist/${entryId}`),

    createManualEntry: (organizationId, data) =>
        api.post(`/api/v2/organizations/${organizationId}/lpr/manual-entry`, data),

    processExit: (organizationId, logId) =>
        api.post(`/api/v2/organizations/${organizationId}/lpr/logs/${logId}/exit`),
};
