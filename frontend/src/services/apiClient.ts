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
    // Try student token first, then teacher token
    const studentAuth = localStorage.getItem('student_auth');
    const teacherAuth = localStorage.getItem('teacher_auth');

    let token: string | null = null;

    if (studentAuth) {
        try {
            const parsed = JSON.parse(studentAuth);
            token = parsed.access_token || null;
        } catch { /* ignore */ }
    }

    if (!token && teacherAuth) {
        try {
            const parsed = JSON.parse(teacherAuth);
            token = parsed.access_token || null;
        } catch { /* ignore */ }
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
            // Token expired or invalid — clear auth and redirect to login
            const studentAuth = localStorage.getItem('student_auth');
            const teacherAuth = localStorage.getItem('teacher_auth');

            if (studentAuth) {
                localStorage.removeItem('student_auth');
                window.location.href = '/student/login';
            } else if (teacherAuth) {
                localStorage.removeItem('teacher_auth');
                window.location.href = '/teacher/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
