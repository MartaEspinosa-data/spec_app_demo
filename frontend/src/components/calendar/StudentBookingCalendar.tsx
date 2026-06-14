import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader, Lock, Info } from 'lucide-react';
import { format, addDays, startOfWeek, isBefore, startOfDay, addMinutes } from 'date-fns';
import { formatTimeInLocalzone, getLocalTimezone } from '../../utils/timezones';
import { API_URL } from '../../config';
import { useLanguage } from '../../i18n';

const CUTOFF_HOURS = 12;

export const StudentBookingCalendar = ({ 
  teacherId, 
  onSlotSelect,
  durationMinutes = 60 // Default, will be managed by US3
}: { 
  teacherId: string;
  onSlotSelect: (slotIsoString: string) => void;
  durationMinutes?: number;
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const days = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

  useEffect(() => {
    if (selectedDate) {
      loadSlots(selectedDate);
    }
  }, [selectedDate, teacherId, durationMinutes]);

  const loadSlots = async (date: Date) => {
    setLoading(true);
    setError(null);
    try {
      const dateString = format(date, 'yyyy-MM-dd');
      // Later in US3, we can pass durationMinutes to the API to filter slots dynamically
      // For now, we fetch all 30-min candidate slots
      const response = await fetch(`${API_URL}/lessons/slots?teacher_id=${teacherId}&date=${dateString}&duration=${durationMinutes}`);
      if (!response.ok) throw new Error('Failed to fetch slots');
      const data = await response.json();
      setSlots(data.slots || []);
    } catch (err) {
      console.error(err);
      setError(t('calendar.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const isDayDisabled = (day: Date) => isBefore(day, startOfDay(new Date()));

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-gray-100 shadow-xl max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">Select a Date & Time</h2>
          <p className="text-indigo-600 font-medium text-xs sm:text-sm mt-1 bg-indigo-50 inline-block px-2 sm:px-3 py-1 rounded-full">
            Times shown in {getLocalTimezone()}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentWeekStart(prev => addDays(prev, -7))}
            disabled={isBefore(currentWeekStart, startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="p-2 rounded-full hover:bg-gray-100 transition disabled:opacity-30"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={() => setCurrentWeekStart(prev => addDays(prev, 7))}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-8">
        {days.map((day, i) => {
          const disabled = isDayDisabled(day);
          const selected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
          
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(day)}
              disabled={disabled}
              title={disabled ? t('calendar.pastDate') : undefined}
              className={`flex flex-col items-center p-3 rounded-2xl transition-all ${
                disabled ? 'opacity-30 cursor-not-allowed' :
                selected ? 'bg-indigo-600 text-white shadow-lg scale-105' :
                'bg-gray-50 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              <span className="text-xs font-bold uppercase mb-1">{format(day, 'EEE')}</span>
              <span className="text-xl font-black">{format(day, 'd')}</span>
            </button>
          );
        })}
      </div>

      {!selectedDate && (
        <div className="border-t border-gray-100 pt-8 animate-fade-in">
          <div className="text-center p-8 bg-indigo-50/50 rounded-2xl border border-dashed border-indigo-200">
            <Info size={20} className="mx-auto mb-2 text-indigo-400" />
            <p className="text-indigo-600 font-medium">{t('calendar.selectDatePrompt')}</p>
          </div>
        </div>
      )}

      {selectedDate && (
        <div className="border-t border-gray-100 pt-8 animate-fade-in">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center justify-between">
            Available on {format(selectedDate, 'MMMM do, yyyy')}
            {loading && <Loader className="animate-spin text-indigo-600" size={16} />}
          </h3>

          {error && <p className="text-red-500 font-medium p-4 bg-red-50 rounded-xl">{error}</p>}
          
          {!loading && !error && slots.length === 0 && (
            <div className="text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Info size={20} className="mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500 font-medium">{t('calendar.noSlots')}</p>
            </div>
          )}

          {!loading && !error && slots.length > 0 && (() => {
            const cutoffTime = Date.now() + CUTOFF_HOURS * 60 * 60 * 1000;
            const availableSlots = slots.filter(s => new Date(s).getTime() >= cutoffTime);
            const greyedSlots = slots.filter(s => new Date(s).getTime() < cutoffTime);

            return (
              <div className="space-y-3">
                {availableSlots.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {availableSlots.map((slotIso) => {
                      const startTime = new Date(slotIso);
                      const endTime = addMinutes(startTime, durationMinutes);
                      return (
                        <button
                          key={slotIso}
                          onClick={() => onSlotSelect(slotIso)}
                          className="px-4 py-3 bg-white border-2 border-gray-100 rounded-xl font-bold text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50 transition-all text-sm"
                        >
                          {formatTimeInLocalzone(slotIso)} - {formatTimeInLocalzone(endTime.toISOString())}
                        </button>
                      );
                    })}
                  </div>
                )}

                {greyedSlots.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-amber-600 flex items-center gap-1.5 px-1">
                      <Lock size={12} />
                      Unavailable — must be booked at least {CUTOFF_HOURS} hours in advance
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                      {greyedSlots.map((slotIso) => {
                        const startTime = new Date(slotIso);
                        const endTime = addMinutes(startTime, durationMinutes);
                        return (
                          <button
                            key={slotIso}
                            disabled
                            className="px-4 py-3 bg-gray-100 border-2 border-gray-100 rounded-xl font-bold text-gray-400 cursor-not-allowed transition-all text-sm line-through decoration-gray-300"
                            title="Must be booked at least 12 hours in advance"
                          >
                            {formatTimeInLocalzone(slotIso)} - {formatTimeInLocalzone(endTime.toISOString())}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {availableSlots.length === 0 && greyedSlots.length > 0 && (
                  <div className="text-center p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-amber-700 font-medium text-sm">
                      All remaining slots today require at least {CUTOFF_HOURS} hours advance booking. Please try a later date.
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
