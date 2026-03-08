import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface Teacher {
    id: string;
    name: string;
    bio?: string;
    languages: string[];
    price_per_hour: number;
    video_url?: string;
    calendly_url?: string;
}

export const teacherService = {
    getTeachers: async (): Promise<Teacher[]> => {
        const response = await axios.get(`${API_URL}/teachers/`);
        return response.data;
    },
    getTeacher: async (id: string): Promise<Teacher> => {
        const response = await axios.get(`${API_URL}/teachers/${id}`);
        return response.data;
    },
};
