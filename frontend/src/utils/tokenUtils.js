
const ACCESS_TOKEN_KEY = 'accesshub_access_token';
const REFRESH_TOKEN_KEY = 'accesshub_refresh_token';
const USER_KEY = 'accesshub_user_data';

export const tokenUtils = {
    getAccessToken: () => {
        return localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem('token');
    },

    setAccessToken: (token) => {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
        try {
            localStorage.setItem('token', token);
        } catch (e) { }
    },

    getRefreshToken: () => {
        return localStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem('refresh_token');
    },

    setRefreshToken: (token) => {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
        try {
            localStorage.setItem('refresh_token', token);
        } catch (e) { }
    },

    getUser: () => {
        const user = localStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    setUser: (user) => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    clearTokens: () => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
    },

    isAuthenticated: () => {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem('token');
        return !!token;
    }
};
