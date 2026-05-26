import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';
// Note: slots endpoint is public (no auth required) so we use raw axios here

interface Props {
    teacherId: string;
    onSlotSelect: (slot: string) => void;
    selectedSlot: string | null;
}

const BookingCalendar = ({ teacherId, onSlotSelect, selectedSlot }: Props) => {
    const [viewDate, setViewDate] = useState(new Date());
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const fetchSlots = async (date: Date) => {
        setLoading(true);
        try {
            const dateStr = date.toISOString().split('T')[0];
            const response = await axios.get(`${API_URL}/lessons/slots?teacher_id=${teacherId}&date=${dateStr}`);
            setAvailableSlots(response.data.slots);
        } catch (err) {
            console.error('Error fetching slots:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSlots(viewDate);
    }, [viewDate, teacherId]);

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        setViewDate(newDate);
    };

    const monthName = viewDate.toLocaleString('default', { month: 'long' });
    const year = viewDate.getFullYear();

    const days = [];
    for (let i = 0; i < firstDayOfMonth(year, viewDate.getMonth()); i++) {
        days.push(<div key={`empty-${i}`} className="h-12" />);
    }
    for (let day = 1; day <= daysInMonth(year, viewDate.getMonth()); day++) {
        const isSelected = viewDate.getDate() === day;
        days.push(
            <button
                key={day}
                onClick={() => handleDateClick(day)}
                className={`h-12 w-full rounded-xl font-bold transition-all flex items-center justify-center ${isSelected
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110 z-10'
                    : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
            >
                {day}
            </button>
        );
    }

    return (
        <div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8 shadow-2xl border border-gray-100 flex flex-col md:flex-row gap-6 sm:gap-10">
            {/* Calendar View */}
            <div className="flex-1">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-3">
                        <CalendarIcon size={24} className="text-indigo-600" />
                        {monthName} {year}
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={handlePrevMonth} className="p-2 rounded-xl hover:bg-gray-100 transition"><ChevronLeft size={20} /></button>
                        <button onClick={handleNextMonth} className="p-2 rounded-xl hover:bg-gray-100 transition"><ChevronRight size={20} /></button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(d => (
                        <div key={d} className="text-center text-xs font-black text-gray-400 uppercase tracking-widest py-2">
                            {d}
                        </div>
                    ))}
                    {days}
                </div>
            </div>

            {/* Slots View */}
            <div className="w-full md:w-64 flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                    <Clock size={24} className="text-indigo-600" />
                    <h3 className="text-2xl font-black text-gray-900">Horas</h3>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-14 bg-gray-50 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : availableSlots.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {availableSlots.map(slot => {
                                const timeStr = new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                const isSelected = selectedSlot === slot;
                                return (
                                    <button
                                        key={slot}
                                        onClick={() => onSlotSelect(slot)}
                                        className={`w-full py-4 px-6 rounded-2xl font-bold transition-all border-2 ${isSelected
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 -translate-x-1'
                                            : 'bg-white border-transparent text-gray-700 hover:border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600'
                                            }`}
                                    >
                                        {timeStr}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-400 font-bold px-4">No hay horarios disponibles para este día</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingCalendar;
