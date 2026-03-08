import React, { useEffect } from 'react';

interface Props {
    url: string;
    onEventScheduled?: (event: any) => void;
}

const BookingCalendar = ({ url }: Props) => {
    useEffect(() => {
        // Load Calendly widget script
        const script = document.createElement('script');
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return (
        <div
            className="calendly-inline-widget rounded-3xl overflow-hidden shadow-2xl border-4 border-white ring-1 ring-gray-100 bg-white"
            data-url={url}
            style={{ minWidth: '320px', height: '700px' }}
        />
    );
};

export default BookingCalendar;
