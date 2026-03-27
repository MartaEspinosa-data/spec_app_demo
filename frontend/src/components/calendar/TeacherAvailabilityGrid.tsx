import { useState, useEffect } from 'react';
import { Save, Loader, Plus, Trash2, CalendarPlus } from 'lucide-react';

interface AvailabilitySlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface DateOverride {
  id: string;
  specific_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export const TeacherAvailabilityGrid = ({ teacherId }: { teacherId: string }) => {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  
  // New override form
  const [newOverrideDate, setNewOverrideDate] = useState('');
  const [newOverrideStart, setNewOverrideStart] = useState('09:00');
  const [newOverrideEnd, setNewOverrideEnd] = useState('17:00');
  const [newOverrideAvailable, setNewOverrideAvailable] = useState(true);
  const [savingOverride, setSavingOverride] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, [teacherId]);

  const fetchAvailability = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/availability/teacher/${teacherId}`);
      if (!response.ok) throw new Error('Failed to load availability');
      
      const data = await response.json();
      
      // Separate recurring vs date overrides
      const recurring: AvailabilitySlot[] = [];
      const dateOverrides: DateOverride[] = [];
      
      data.availability?.forEach((a: any) => {
        if (a.specific_date) {
          dateOverrides.push({
            id: a.id,
            specific_date: a.specific_date,
            start_time: a.start_time.substring(0, 5),
            end_time: a.end_time.substring(0, 5),
            is_available: a.is_available,
          });
        } else if (a.day_of_week !== null && a.day_of_week !== undefined) {
          recurring.push({
            day_of_week: a.day_of_week,
            start_time: a.start_time.substring(0, 5),
            end_time: a.end_time.substring(0, 5),
            is_available: a.is_available,
          });
        }
      });
      
      // Map API data back to our UI state
      const initialAvailability = DAYS_OF_WEEK.map((_, index) => {
        const existing = recurring.find((a) => a.day_of_week === index);
        if (existing) return existing;
        return {
          day_of_week: index,
          start_time: '09:00',
          end_time: '17:00',
          is_available: false
        };
      });
      
      setAvailability(initialAvailability);
      setOverrides(dateOverrides.sort((a, b) => a.specific_date.localeCompare(b.specific_date)));
    } catch (err) {
      setError('Could not load availability.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg('');
    try {
      const payload = availability
        .filter(a => a.is_available)
        .map(a => ({
          ...a,
          start_time: `${a.start_time}:00`,
          end_time: `${a.end_time}:00`
        }));

      const res = await fetch(`http://localhost:8000/api/availability/teacher/${teacherId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability: payload })
      });
      
      if (!res.ok) throw new Error('Failed to save');
      setSuccessMsg('Weekly schedule saved!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Could not save availability.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddOverride = async () => {
    if (!newOverrideDate) return;
    setSavingOverride(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/availability/teacher/${teacherId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specific_date: newOverrideDate,
          start_time: `${newOverrideStart}:00`,
          end_time: `${newOverrideEnd}:00`,
          is_available: newOverrideAvailable,
        })
      });
      if (!res.ok) throw new Error('Failed to save override');
      
      setNewOverrideDate('');
      setNewOverrideStart('09:00');
      setNewOverrideEnd('17:00');
      setNewOverrideAvailable(true);
      await fetchAvailability();
      setSuccessMsg('Date override saved!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Could not save date override.');
      console.error(err);
    } finally {
      setSavingOverride(false);
    }
  };

  const handleDeleteOverride = async (overrideId: string) => {
    try {
      await fetch(`http://localhost:8000/api/availability/teacher/${teacherId}/override/${overrideId}`, {
        method: 'DELETE'
      });
      await fetchAvailability();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDay = (index: number) => {
    setAvailability(prev => prev.map(a => 
      a.day_of_week === index ? { ...a, is_available: !a.is_available } : a
    ));
  };

  const changeTime = (index: number, field: 'start_time' | 'end_time', value: string) => {
    setAvailability(prev => prev.map(a =>
      a.day_of_week === index ? { ...a, [field]: value } : a
    ));
  };

  const formatOverrideDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader className="animate-spin text-indigo-600" size={32} /></div>;
  }

  return (
    <div className="w-full max-w-4xl space-y-8">
      {/* Weekly Availability */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Weekly Schedule</h2>
            <p className="text-gray-500 font-medium mt-1">Set your default working hours for each day of the week.</p>
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition shadow-lg disabled:opacity-50"
          >
            {saving ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
            {saving ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-medium border border-red-100">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-50 text-green-600 p-4 rounded-xl mb-6 font-bold border border-green-100 text-center">
            ✓ {successMsg}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {availability.map((day) => (
            <div key={day.day_of_week} className={`flex items-center justify-between p-4 rounded-2xl transition-all ${day.is_available ? 'bg-indigo-50/50 border border-indigo-100' : 'bg-gray-50 border border-transparent'}`}>
              <div className="flex items-center gap-4 w-1/3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={day.is_available} 
                    onChange={() => toggleDay(day.day_of_week)} 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
                <span className={`font-bold ${day.is_available ? 'text-indigo-900' : 'text-gray-400'}`}>
                  {DAYS_OF_WEEK[day.day_of_week]}
                </span>
              </div>

              <div className={`flex items-center gap-3 transition-opacity ${day.is_available ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                <input 
                  type="time" 
                  value={day.start_time}
                  onChange={(e) => changeTime(day.day_of_week, 'start_time', e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" 
                />
                <span className="text-gray-400 font-medium">to</span>
                <input 
                  type="time" 
                  value={day.end_time}
                  onChange={(e) => changeTime(day.day_of_week, 'end_time', e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Date Overrides */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="mb-8 pb-6 border-b border-gray-100">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <CalendarPlus size={24} className="text-indigo-600" />
            Date Overrides
          </h2>
          <p className="text-gray-500 font-medium mt-1">Set custom hours for specific dates that differ from your weekly schedule.</p>
        </div>

        {/* Add new override */}
        <div className="bg-indigo-50/50 rounded-2xl p-6 mb-6 border border-indigo-100">
          <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Add Override</h3>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date</label>
              <input
                type="date"
                value={newOverrideDate}
                onChange={(e) => setNewOverrideDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">From</label>
                <input
                  type="time"
                  value={newOverrideStart}
                  onChange={(e) => setNewOverrideStart(e.target.value)}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 outline-none focus:border-indigo-500 transition"
                />
              </div>
              <span className="text-gray-400 font-medium mt-5">to</span>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">To</label>
                <input
                  type="time"
                  value={newOverrideEnd}
                  onChange={(e) => setNewOverrideEnd(e.target.value)}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-5">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox"
                  className="sr-only peer"
                  checked={newOverrideAvailable}
                  onChange={() => setNewOverrideAvailable(!newOverrideAvailable)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
              <span className={`font-bold text-sm ${newOverrideAvailable ? 'text-green-700' : 'text-red-500'}`}>
                {newOverrideAvailable ? 'Available' : 'Day Off'}
              </span>
            </div>
            <button
              onClick={handleAddOverride}
              disabled={!newOverrideDate || savingOverride}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-40 mt-5"
            >
              {savingOverride ? <Loader className="animate-spin" size={16} /> : <Plus size={16} />}
              Add
            </button>
          </div>
        </div>

        {/* Existing overrides */}
        {overrides.length === 0 ? (
          <div className="text-center py-10 text-gray-400 font-medium">
            <p>No date overrides set. Your weekly schedule applies to all dates.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {overrides.map((ov) => (
              <div key={ov.id} className={`flex items-center justify-between p-4 rounded-2xl ${ov.is_available ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                <div className="flex items-center gap-4">
                  <span className={`font-black text-sm ${ov.is_available ? 'text-green-700' : 'text-red-600'}`}>
                    {formatOverrideDate(ov.specific_date)}
                  </span>
                  {ov.is_available ? (
                    <span className="font-bold text-sm text-green-600">
                      {ov.start_time} — {ov.end_time}
                    </span>
                  ) : (
                    <span className="font-bold text-sm text-red-500 italic">Day Off</span>
                  )}
                </div>
                <button 
                  onClick={() => handleDeleteOverride(ov.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
