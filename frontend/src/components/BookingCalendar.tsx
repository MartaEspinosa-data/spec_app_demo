import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Lock, Info } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';
import { useLanguage } from '../i18n';
// Note: slots endpoint is public (no auth required) so we use raw axios here

const CUTOFF_HOURS = 12;

interface Props {
    teacherId: string;
    onSlotSelect: (slot: string) => void;
    selectedSlot: string | null;
}

const BookingCalendar = ({ teacherId, onSlotSelect, selectedSlot }: Props) => {
    const [viewDate, setViewDate] = useState(new Date());
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const cutoffTime = Date.now() + CUTOFF_HOURS * 60 * 60 * 1000;
    const bookableSlots = availableSlots.filter(s => new Date(s).getTime() >= cutoffTime);
    const greyedSlots = availableSlots.filter(s => new Date(s).getTime() < cutoffTime);
    const { t } = useLanguage();

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
                title={new Date(viewDate.getFullYear(), viewDate.getMonth(), day) < new Date(new Date().toDateString()) ? t('calendar.pastDate') : undefined}
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
                            {/* Bookable slots */}
                            {bookableSlots.map(slot => {
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

                            {/* Greyed out (within 12h cutoff) */}
                            {greyedSlots.length > 0 && (
                                <>
                                    <div className="flex items-center gap-1.5 text-amber-600 pt-2 pb-1">
                                        <Lock size={12} />
                                        <span className="text-xs font-medium">
                                            Unavailable — must be booked at least {CUTOFF_HOURS}h in advance
                                        </span>
                                    </div>
                                    {greyedSlots.map(slot => {
                                        const timeStr = new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        return (
                                            <button
                                                key={slot}
                                                disabled
                                                className="w-full py-4 px-6 rounded-2xl font-bold bg-gray-100 border-2 border-gray-100 text-gray-400 cursor-not-allowed line-through decoration-gray-300"
                                                title="Must be booked at least 12 hours in advance"
                                            >
                                                {timeStr}
                                            </button>
                                        );
                                    })}
                                </>
                            )}

                            {bookableSlots.length === 0 && greyedSlots.length > 0 && (
                                <div className="text-center py-6 px-4 bg-amber-50 rounded-2xl border border-amber-100">
                                    <p className="text-amber-700 font-medium text-sm">
                                        All remaining slots today require at least {CUTOFF_HOURS}h advance booking. Please try a later date.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <Info size={20} className="mx-auto mb-2 text-gray-400" />
                            <p className="text-gray-500 font-medium px-4">{t('calendar.noSlots')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingCalendar;
