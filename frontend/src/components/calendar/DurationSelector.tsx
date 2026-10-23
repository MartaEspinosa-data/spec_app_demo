import { Clock } from 'lucide-react';
import { useLanguage } from '../../i18n';

export const DurationSelector = ({
  selected,
  onChange,
}: {
  selected: number;
  onChange: (d: number) => void;
}) => {
  const options = [30, 45, 60];
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xl shadow-indigo-950/5 max-w-3xl mx-auto mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Clock size={18} />
          </div>
          {t('calendar.durationTitle')}
        </h3>
        <div className="flex items-center p-1 bg-gray-100/90 rounded-2xl border border-gray-200/70">
          {options.map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => onChange(mins)}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all duration-150 flex items-center justify-center gap-1.5 ${
                selected === mins
                  ? 'bg-white text-indigo-600 shadow-sm shadow-indigo-950/10 scale-[1.02]'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Clock size={13} className={selected === mins ? 'text-indigo-600' : 'text-gray-400'} />
              <span>{t('calendar.durationMinutes', { mins: mins.toString() })}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
