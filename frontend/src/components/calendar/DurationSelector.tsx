import { Clock } from 'lucide-react';

export const DurationSelector = ({
  selected,
  onChange,
}: {
  selected: number;
  onChange: (d: number) => void;
}) => {
  const options = [30, 45, 60];

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl max-w-2xl mx-auto mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Clock size={20} className="text-indigo-600" />
        Lesson Duration
      </h3>
      <div className="flex gap-4">
        {options.map((mins) => (
          <button
            key={mins}
            onClick={() => onChange(mins)}
            className={`flex-1 py-3 rounded-2xl font-bold transition-all ${
              selected === mins
                ? 'bg-indigo-600 text-white shadow-lg scale-[1.02]'
                : 'bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
            }`}
          >
            {mins} min
          </button>
        ))}
      </div>
    </div>
  );
};
