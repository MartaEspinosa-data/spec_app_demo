import axios from 'axios';
import { API_URL } from '../config';

/**
 * Creates an axios instance that automatically attaches the JWT Bearer token
 * from localStorage for authenticated requests.
 */
const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: attach JWT token if available
apiClient.interceptors.request.use((config) => {
    const studentAuth = localStorage.getItem('student_auth');
    const teacherAuth = localStorage.getItem('teacher_auth');

    let token: string | null = null;

    // Determine context based on current page path or request URL
    const isTeacherContext =
        window.location.pathname.startsWith('/teacher') ||
        Boolean(config.url && (config.url.includes('/teacher') || config.url.includes('/teachers')));

    if (isTeacherContext) {
        // In teacher context, prioritize teacher token
        if (teacherAuth) {
            try {
                const parsed = JSON.parse(teacherAuth);
                token = parsed.access_token || null;
            } catch { /* ignore */ }
        } else if (studentAuth) {
            try {
                const parsed = JSON.parse(studentAuth);
                token = parsed.access_token || null;
            } catch { /* ignore */ }
        }
    } else {
        // In student/public context, prioritize student token
        if (studentAuth) {
            try {
                const parsed = JSON.parse(studentAuth);
                token = parsed.access_token || null;
            } catch { /* ignore */ }
        } else if (teacherAuth) {
            try {
                const parsed = JSON.parse(teacherAuth);
                token = parsed.access_token || null;
            } catch { /* ignore */ }
        }
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Response interceptor: handle 401 globally
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const isTeacherRoute = window.location.pathname.startsWith('/teacher');
            if (isTeacherRoute) {
                localStorage.removeItem('teacher_auth');
                window.location.href = '/teacher/login';
            } else {
                localStorage.removeItem('student_auth');
                window.location.href = '/student/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
