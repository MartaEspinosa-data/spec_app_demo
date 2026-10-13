import { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader, 
  Lock, 
  Calendar as CalendarIcon, 
  Clock, 
  Globe, 
  CheckCircle2, 
  CalendarX,
  Sparkles
} from 'lucide-react';
import { 
  format, 
  addDays, 
  startOfWeek, 
  isBefore, 
  startOfDay, 
  addMinutes, 
  isSameDay, 
  isSameWeek, 
  isToday 
} from 'date-fns';
import { es, fr, ru, enUS } from 'date-fns/locale';
import { formatTimeInLocalzone, getLocalTimezone } from '../../utils/timezones';
import { API_URL } from '../../config';
import { useLanguage } from '../../i18n';

const CUTOFF_HOURS = 12;

const dateLocales: Record<string, any> = {
  es,
  fr,
  ru,
  en: enUS
};

export interface StudentBookingCalendarProps {
  teacherId: string;
  onSlotSelect: (slotIsoString: string) => void;
  selectedSlot?: string | null;
  durationMinutes?: number;
  onDurationChange?: (duration: number) => void;
  className?: string;
}

export const StudentBookingCalendar = ({ 
  teacherId, 
  onSlotSelect,
  selectedSlot,
  durationMinutes = 60,
  onDurationChange,
  className = ""
}: StudentBookingCalendarProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [internalSelectedSlot, setInternalSelectedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { language, t } = useLanguage();

  const activeLocale = dateLocales[language] || enUS;
  const currentSelectedSlot = selectedSlot !== undefined ? selectedSlot : internalSelectedSlot;

  const days = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
  const weekEnd = addDays(currentWeekStart, 6);

  useEffect(() => {
    if (selectedDate) {
      loadSlots(selectedDate);
    } else {
      setSlots([]);
    }
  }, [selectedDate, teacherId, durationMinutes]);

  const loadSlots = async (date: Date) => {
    setLoading(true);
    setError(null);
    try {
      const dateString = format(date, 'yyyy-MM-dd');
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
  const isCurrentWeek = isSameWeek(currentWeekStart, new Date(), { weekStartsOn: 1 });
  const canGoPrevious = !isBefore(currentWeekStart, startOfWeek(new Date(), { weekStartsOn: 1 }));

  const handleJumpToToday = () => {
    const today = new Date();
    setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
    setSelectedDate(today);
  };

  const getWeekRangeTitle = () => {
    const startMonth = format(currentWeekStart, 'MMMM', { locale: activeLocale });
    const endMonth = format(weekEnd, 'MMMM', { locale: activeLocale });
    const startYear = format(currentWeekStart, 'yyyy');
    const endYear = format(weekEnd, 'yyyy');
    
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    if (startYear !== endYear) {
      return `${capitalize(format(currentWeekStart, 'MMM yyyy', { locale: activeLocale }))} – ${capitalize(format(weekEnd, 'MMM yyyy', { locale: activeLocale }))}`;
    }
    if (startMonth !== endMonth) {
      return `${capitalize(format(currentWeekStart, 'MMM', { locale: activeLocale }))} – ${capitalize(format(weekEnd, 'MMM', { locale: activeLocale }))} ${startYear}`;
    }
    return `${capitalize(startMonth)} ${startYear}`;
  };

  const formatSelectedDateHeading = (date: Date) => {
    const formatted = format(date, 'EEEE, d MMMM yyyy', { locale: activeLocale });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const cutoffTime = Date.now() + CUTOFF_HOURS * 60 * 60 * 1000;
  const availableSlots = slots.filter(s => new Date(s).getTime() >= cutoffTime);
  const greyedSlots = slots.filter(s => new Date(s).getTime() < cutoffTime);

  return (
    <div className={`bg-white rounded-3xl p-5 sm:p-8 border border-gray-100 shadow-xl shadow-indigo-950/5 max-w-3xl mx-auto transition-all ${className}`}>
      {/* Top Header & Duration Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <CalendarIcon size={22} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {t('calendar.title')}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold mt-0.5">
              <Globe size={13} className="text-indigo-500" />
              <span>{t('calendar.timezonePrefix', { tz: getLocalTimezone() })}</span>
            </div>
          </div>
        </div>

        {/* Duration Picker or Duration Badge */}
        {onDurationChange ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-gray-100/90 rounded-2xl border border-gray-200/70">
              {[30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => onDurationChange(mins)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 flex items-center gap-1.5 ${
                    durationMinutes === mins
                      ? 'bg-white text-indigo-600 shadow-sm shadow-indigo-950/10 scale-[1.02]'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <Clock size={13} className={durationMinutes === mins ? 'text-indigo-600' : 'text-gray-400'} />
                  <span>{t('calendar.durationMinutes', { mins: mins.toString() })}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-100 self-start sm:self-auto">
            <Clock size={13} className="text-indigo-600" />
            <span>{t('calendar.durationMinutes', { mins: durationMinutes.toString() })}</span>
          </div>
        )}
      </div>

      {/* Week Navigation Toolbar */}
      <div className="flex items-center justify-between mt-6 mb-4">
        <div className="flex items-center gap-2.5">
          <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
            {getWeekRangeTitle()}
          </h3>
          {!isCurrentWeek && (
            <button
              onClick={handleJumpToToday}
              type="button"
              className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 transition-all shadow-2xs hover:scale-105 active:scale-95"
            >
              {t('calendar.today')}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            type="button"
            onClick={() => setCurrentWeekStart(prev => addDays(prev, -7))}
            disabled={!canGoPrevious}
            title={t('calendar.prevWeek')}
            className="p-2 rounded-xl border border-gray-200/80 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-all shadow-2xs disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            type="button"
            onClick={() => setCurrentWeekStart(prev => addDays(prev, 7))}
            title={t('calendar.nextWeek')}
            className="p-2 rounded-xl border border-gray-200/80 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-all shadow-2xs hover:scale-105 active:scale-95"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Weekday Selector Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 mb-6">
        {days.map((day, i) => {
          const disabled = isDayDisabled(day);
          const selected = selectedDate && isSameDay(selectedDate, day);
          const isTodayDay = isToday(day);
          const weekday = format(day, 'EEE', { locale: activeLocale }).replace('.', '').toUpperCase();
          const dayNumber = format(day, 'd');

          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedDate(day)}
              disabled={disabled}
              title={disabled ? t('calendar.pastDate') : undefined}
              className={`group relative flex flex-col items-center justify-center py-2.5 sm:py-3.5 px-1 rounded-2xl transition-all duration-200 ${
                disabled
                  ? 'opacity-30 bg-gray-50/60 border border-transparent cursor-not-allowed'
                  : selected
                  ? 'bg-gradient-to-b from-indigo-600 via-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-600 ring-offset-2 scale-105 z-10 font-black'
                  : 'bg-gray-50/90 text-gray-700 border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-600 hover:shadow-xs hover:-translate-y-0.5'
              }`}
            >
              {isTodayDay && (
                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full mb-0.5 ${
                  selected 
                    ? 'bg-white/20 text-white' 
                    : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {t('calendar.today')}
                </span>
              )}
              <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                selected ? 'text-indigo-100' : 'text-gray-400 group-hover:text-indigo-600'
              }`}>
                {weekday}
              </span>
              <span className="text-lg sm:text-2xl font-black mt-0.5">
                {dayNumber}
              </span>
            </button>
          );
        })}
      </div>

      {/* Initial Empty State (No Date Chosen Yet) */}
      {!selectedDate && (
        <div className="pt-6 border-t border-gray-100">
          <div className="text-center py-10 px-6 bg-gradient-to-b from-indigo-50/40 via-indigo-50/20 to-transparent rounded-3xl border-2 border-dashed border-indigo-100/90 relative overflow-hidden">
            <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles size={24} />
            </div>
            <h4 className="text-base sm:text-lg font-black text-gray-900 mb-1">
              {t('calendar.selectDatePromptTitle')}
            </h4>
            <p className="text-xs sm:text-sm text-gray-500 font-medium max-w-sm mx-auto">
              {t('calendar.selectDatePromptSubtitle')}
            </p>
          </div>
        </div>
      )}

      {/* Slots Section (Date Chosen) */}
      {selectedDate && (
        <div className="border-t border-gray-100 pt-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-indigo-600" />
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                {formatSelectedDateHeading(selectedDate)}
              </h3>
            </div>
            
            {loading && (
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold">
                <Loader className="animate-spin" size={14} />
              </div>
            )}

            {!loading && !error && slots.length > 0 && availableSlots.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {availableSlots.length === 1 
                  ? t('calendar.availableSlotsCountOne') 
                  : t('calendar.availableSlotsCount', { count: availableSlots.length.toString() })}
              </span>
            )}
          </div>

          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} className="h-12 bg-gray-100/80 rounded-2xl animate-pulse border border-gray-100" />
              ))}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-medium text-sm flex items-center gap-2">
              <CalendarX size={16} className="text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && slots.length === 0 && (
            <div className="text-center py-10 px-6 bg-gray-50/80 rounded-3xl border border-gray-200/70">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center">
                <CalendarX size={22} />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-gray-800 mb-1">
                {t('calendar.noSlotsShort')}
              </h4>
              <p className="text-xs text-gray-500 font-medium max-w-md mx-auto">
                {t('calendar.noSlots')}
              </p>
            </div>
          )}

          {!loading && !error && slots.length > 0 && (
            <div className="space-y-4">
              {availableSlots.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  {availableSlots.map((slotIso) => {
                    const startTime = new Date(slotIso);
                    const endTime = addMinutes(startTime, durationMinutes);
                    const isSlotSelected = currentSelectedSlot === slotIso;

                    return (
                      <button
                        key={slotIso}
                        type="button"
                        onClick={() => {
                          setInternalSelectedSlot(slotIso);
                          onSlotSelect(slotIso);
                        }}
                        className={`group relative flex items-center justify-between p-3 sm:px-4 sm:py-3.5 rounded-2xl font-bold transition-all duration-150 border-2 ${
                          isSlotSelected
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-600 shadow-md shadow-indigo-500/25 scale-[1.02] ring-2 ring-indigo-400/30'
                            : 'bg-white text-gray-800 border-gray-100 hover:border-indigo-500 hover:bg-indigo-50/40 hover:text-indigo-700 hover:shadow-xs hover:-translate-y-0.5'
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-2.5">
                          <div className={`p-1.5 rounded-xl transition-colors ${
                            isSlotSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
                          }`}>
                            <Clock size={14} />
                          </div>
                          <span className="text-xs sm:text-sm font-black tracking-tight">
                            {formatTimeInLocalzone(slotIso)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] sm:text-xs font-semibold ${
                            isSlotSelected ? 'text-indigo-100' : 'text-gray-400 group-hover:text-indigo-500'
                          }`}>
                            {formatTimeInLocalzone(endTime.toISOString())}
                          </span>
                          {isSlotSelected && (
                            <CheckCircle2 size={14} className="text-white fill-white/20 ml-1" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {greyedSlots.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold text-amber-600 flex items-center gap-1.5 px-1">
                    <Lock size={12} className="text-amber-500" />
                    <span>{t('calendar.advanceBookingNotice', { hours: CUTOFF_HOURS.toString() })}</span>
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 opacity-60">
                    {greyedSlots.map((slotIso) => {
                      const startTime = new Date(slotIso);
                      const endTime = addMinutes(startTime, durationMinutes);
                      return (
                        <button
                          key={slotIso}
                          disabled
                          type="button"
                          className="px-3 py-3 bg-gray-100/90 border border-gray-200/80 rounded-2xl font-bold text-gray-400 cursor-not-allowed transition-all text-xs sm:text-sm line-through decoration-gray-300 flex items-center justify-between"
                          title={t('calendar.advanceBookingNoticeShort', { hours: CUTOFF_HOURS.toString() })}
                        >
                          <span>{formatTimeInLocalzone(slotIso)}</span>
                          <span className="text-[11px] text-gray-400">{formatTimeInLocalzone(endTime.toISOString())}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {availableSlots.length === 0 && greyedSlots.length > 0 && (
                <div className="text-center p-4 bg-amber-50/80 rounded-2xl border border-amber-200/60">
                  <p className="text-amber-800 font-semibold text-xs sm:text-sm">
                    {t('calendar.advanceBookingAlert', { hours: CUTOFF_HOURS.toString() })}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
