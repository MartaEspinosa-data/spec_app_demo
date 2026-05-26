import axios from 'axios';
import { API_URL } from '../config';
// Note: teacher profile endpoints are public, so we use raw axios (no auth needed)

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
