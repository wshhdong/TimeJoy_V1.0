
import React, { useState, useEffect, useMemo } from 'react';
import { TimeEntry, WorkType, MoodOption } from '../types';
import { Smile, Meh, Frown, Clock, Save, LayoutDashboard, AlertCircle } from 'lucide-react';

interface TimeLoggerProps {
  workTypes: WorkType[];
  moodOptions: MoodOption[];
  existingEntries: TimeEntry[]; // Need this for overlap check
  onAddEntry: (entry: Omit<TimeEntry, 'id' | 'userId'>, redirectToDashboard: boolean) => void;
  lastEntryEndTime?: string;
}

// Generate 30 min time slots
const generateTimeSlots = () => {
  const slots = [];
  for (let i = 0; i < 48; i++) {
    const h = Math.floor(i / 2);
    const m = (i % 2) * 30;
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
  slots.push("24:00");
  return slots;
};

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const getIcon = (iconName: string) => {
    switch(iconName) {
        case 'smile': return Smile;
        case 'frown': return Frown;
        case 'meh': 
        default: return Meh;
    }
};

export const TimeLogger: React.FC<TimeLoggerProps> = ({ workTypes, moodOptions, existingEntries, onAddEntry, lastEntryEndTime }) => {
  const timeSlots = useMemo(() => generateTimeSlots(), []);
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(lastEntryEndTime || '09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [selectedType, setSelectedType] = useState<string>(workTypes[0]?.id || '');
  const [selectedMoodId, setSelectedMoodId] = useState<string>(moodOptions[0]?.id || '');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  // Update start time if prop changes (e.g. after submission)
  useEffect(() => {
    if (lastEntryEndTime) {
      setStartTime(lastEntryEndTime);
      const startIdx = timeSlots.indexOf(lastEntryEndTime);
      if (startIdx !== -1 && startIdx < timeSlots.length - 1) {
        setEndTime(timeSlots[startIdx + 1]);
      }
    }
  }, [lastEntryEndTime, timeSlots]);

  // Ensure selectedType matches valid types (in case admin deleted one)
  useEffect(() => {
    if (workTypes.length > 0 && !workTypes.find(t => t.id === selectedType)) {
        setSelectedType(workTypes[0].id);
    }
  }, [workTypes, selectedType]);

  // Ensure selectedMood matches valid moods
  useEffect(() => {
    if (moodOptions.length > 0 && !moodOptions.find(m => m.id === selectedMoodId)) {
        setSelectedMoodId(moodOptions[0].id);
    }
  }, [moodOptions, selectedMoodId]);


  const checkOverlap = (newStart: number, newEnd: number, currentDate: string): boolean => {
    const daysEntries = existingEntries.filter(e => e.date === currentDate);
    
    for (const entry of daysEntries) {
        const existingStart = timeToMinutes(entry.startTime);
        const existingEnd = timeToMinutes(entry.endTime);

        // Overlap condition: (StartA < EndB) and (EndA > StartB)
        if (existingStart < newEnd && existingEnd > newStart) {
            return true;
        }
    }
    return false;
  };

  const handleSubmit = (e: React.FormEvent, redirectToDashboard: boolean) => {
    e.preventDefault();
    setError('');

    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);

    // 1. Basic Validation
    if (endMins <= startMins) {
      setError('End time must be after start time.');
      return;
    }

    if (!selectedType) {
        setError('Please select a work type.');
        return;
    }

    // 2. Overlap Validation
    if (checkOverlap(startMins, endMins, date)) {
        setError('This time slot overlaps with an existing entry. Please choose a different time.');
        return;
    }

    const duration = endMins - startMins;

    onAddEntry({
      date,
      startTime,
      endTime,
      durationMinutes: duration,
      workTypeId: selectedType,
      moodId: selectedMoodId,
      comment
    }, redirectToDashboard);

    if (!redirectToDashboard) {
       setComment('');
       // Start time updates via parent effect
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 bg-indigo-600 text-white">
          <h2 className="text-xl font-bold flex items-center">
            <Clock className="w-6 h-6 mr-2" />
            Log Activity
          </h2>
          <p className="text-indigo-100 text-sm mt-1">Track your time to understand your happiness.</p>
        </div>

        <form className="p-6 space-y-6">
          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {timeSlots.map(t => <option key={`start-${t}`} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {timeSlots.map(t => <option key={`end-${t}`} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Work Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Activity Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {workTypes.map((type) => (
                <label
                  key={type.id}
                  className={`cursor-pointer rounded-lg border p-3 flex items-center transition-all ${
                    selectedType === type.id
                      ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="workType"
                    value={type.id}
                    checked={selectedType === type.id}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="sr-only"
                  />
                  <span className={`w-3 h-3 rounded-full mr-3 bg-${type.color}-500`} />
                  <span className="text-sm font-medium text-slate-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Satisfaction (Dynamic Moods) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">How did it feel?</label>
            <div className="grid grid-cols-3 gap-4">
              {moodOptions.map((mood) => {
                  const Icon = getIcon(mood.icon);
                  const isSelected = selectedMoodId === mood.id;
                  return (
                    <button
                        key={mood.id}
                        type="button"
                        onClick={() => setSelectedMoodId(mood.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                            isSelected
                            ? `border-${mood.color}-500 bg-${mood.color}-50 text-${mood.color}-700`
                            : 'border-slate-200 hover:bg-slate-50 text-slate-400'
                        }`}
                    >
                        <Icon className={`w-8 h-8 mb-2 ${isSelected ? `fill-${mood.color}-200` : ''}`} />
                        <span className="text-xs font-semibold">{mood.label}</span>
                    </button>
                  );
              })}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Comment (Optional)</label>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What were you working on?"
              className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center">
               <AlertCircle className="w-4 h-4 mr-2" />
               {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              className="w-full bg-white border-2 border-indigo-600 text-indigo-700 hover:bg-indigo-50 font-semibold py-3 rounded-lg transition-all flex items-center justify-center"
            >
              <Save className="w-5 h-5 mr-2" />
              Submit & Add More
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center"
            >
              <LayoutDashboard className="w-5 h-5 mr-2" />
              Submit & View Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
