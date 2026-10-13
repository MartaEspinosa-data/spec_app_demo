import React from 'react';
import { Calendar } from 'lucide-react';

interface AddToCalendarProps {
    title: string;
    startTime: string; // ISO string
    durationMinutes: number;
    description: string;
    location: string;
    className?: string;
    label?: string;
    children?: React.ReactNode;
}

export const AddToCalendar: React.FC<AddToCalendarProps> = ({
    title,
    startTime,
    durationMinutes,
    description,
    location,
    className,
    label,
    children
}) => {
    const generateGoogleUrl = () => {
        const start = new Date(startTime);
        const end = new Date(start.getTime() + durationMinutes * 60000);

        const format = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');
        
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: title,
            dates: `${format(start)}/${format(end)}`,
            details: description,
            location: location,
        });

        return `https://calendar.google.com/calendar/render?${params.toString()}`;
    };

    return (
        <a
            href={generateGoogleUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className={className || "flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"}
        >
            {children ? (
                children
            ) : (
                <>
                    <Calendar size={16} className="text-indigo-600 shrink-0" />
                    <span>{label || 'Add to Google Calendar'}</span>
                </>
            )}
        </a>
    );
};
