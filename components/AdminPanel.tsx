
import React, { useState, useRef } from 'react';
import { WorkType, MoodOption, AppState } from '../types';
import { Plus, Trash2, Edit2, Save, X, Download, Upload, Database } from 'lucide-react';

interface AdminPanelProps {
  fullState: AppState;
  workTypes: WorkType[];
  moodOptions: MoodOption[];
  onUpdateWorkTypes: (types: WorkType[]) => void;
  onUpdateMoodOptions: (moods: MoodOption[]) => void;
  onImportState: (state: AppState) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  fullState,
  workTypes,
  moodOptions,
  onUpdateWorkTypes,
  onUpdateMoodOptions,
  onImportState,
}) => {
  const [editingType, setEditingType] = useState<string | null>(null);
  const [tempTypeLabel, setTempTypeLabel] = useState('');
  
  const [editingMood, setEditingMood] = useState<string | null>(null);
  const [tempMoodLabel, setTempMoodLabel] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Work Type Handlers ---
  const handleAddType = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newType: WorkType = { id: newId, label: 'New Activity', color: 'gray' };
    onUpdateWorkTypes([...workTypes, newType]);
    setEditingType(newId);
    setTempTypeLabel('New Activity');
  };

  const handleDeleteType = (id: string) => {
    if (window.confirm('Are you sure? Associated logs might lose their label.')) {
      onUpdateWorkTypes(workTypes.filter(t => t.id !== id));
    }
  };

  const saveType = (id: string) => {
    onUpdateWorkTypes(workTypes.map(t => t.id === id ? { ...t, label: tempTypeLabel } : t));
    setEditingType(null);
  };

  // --- Mood Handlers ---
  const handleAddMood = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newMood: MoodOption = { 
      id: newId, 
      label: 'New Mood', 
      value: 5, 
      icon: 'meh', 
      color: 'gray' 
    };
    onUpdateMoodOptions([...moodOptions, newMood]);
    setEditingMood(newId);
    setTempMoodLabel('New Mood');
  };

  const handleDeleteMood = (id: string) => {
    if (window.confirm('Are you sure?')) {
      onUpdateMoodOptions(moodOptions.filter(m => m.id !== id));
    }
  };

  const saveMood = (id: string) => {
    onUpdateMoodOptions(moodOptions.map(m => m.id === id ? { ...m, label: tempMoodLabel } : m));
    setEditingMood(null);
  };

  const cycleColor = (id: string, current: string, isWorkType: boolean) => {
    const colors = ['blue', 'green', 'purple', 'red', 'orange', 'yellow', 'pink', 'indigo', 'gray'];
    const idx = colors.indexOf(current);
    const nextColor = colors[(idx + 1) % colors.length];
    
    if (isWorkType) {
      onUpdateWorkTypes(workTypes.map(t => t.id === id ? { ...t, color: nextColor } : t));
    } else {
      onUpdateMoodOptions(moodOptions.map(m => m.id === id ? { ...m, color: nextColor } : m));
    }
  };

  // --- Backup Handlers ---
  const handleExport = () => {
    const dataStr = JSON.stringify(fullState, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timejoy_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedState = JSON.parse(content);
        // Basic validation
        if (parsedState.users && parsedState.entries && parsedState.workTypes) {
            if(window.confirm("This will overwrite current data. Continue?")) {
                onImportState(parsedState);
                alert("Database restored successfully!");
            }
        } else {
            alert("Invalid backup file format.");
        }
      } catch (error) {
        alert("Error parsing file.");
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = ''; 
  };

  return (
    <div className="space-y-8">
      {/* System Backup Section */}
      <div className="bg-slate-800 text-white rounded-2xl shadow-lg border border-slate-700 p-6">
        <div className="flex justify-between items-center mb-4">
            <div>
                <h3 className="text-lg font-bold flex items-center">
                    <Database className="w-5 h-5 mr-2 text-indigo-400"/>
                    System Data & Backup
                </h3>
                <p className="text-slate-400 text-sm">Export your data to move between devices or restore a backup.</p>
            </div>
            <div className="flex space-x-3">
                <button 
                    onClick={handleExport}
                    className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors text-sm font-medium"
                >
                    <Download className="w-4 h-4 mr-2"/>
                    Export Database
                </button>
                <button 
                    onClick={handleImportClick}
                    className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg transition-colors text-sm font-medium"
                >
                    <Upload className="w-4 h-4 mr-2"/>
                    Import Database
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".json"
                />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Work Types Manager */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Activity Types</h3>
            <button onClick={handleAddType} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            {workTypes.map(type => (
              <div key={type.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                <div className="flex items-center flex-1">
                  <button 
                    onClick={() => cycleColor(type.id, type.color, true)}
                    className={`w-6 h-6 rounded-full bg-${type.color}-500 mr-3 border-2 border-white shadow-sm cursor-pointer`}
                    title="Click to change color"
                  />
                  {editingType === type.id ? (
                    <input 
                      value={tempTypeLabel}
                      onChange={(e) => setTempTypeLabel(e.target.value)}
                      className="border rounded px-2 py-1 text-sm w-full mr-2"
                      autoFocus
                    />
                  ) : (
                    <span className="font-medium text-slate-700">{type.label}</span>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-2">
                  {editingType === type.id ? (
                    <button onClick={() => saveType(type.id)} className="text-green-600 hover:text-green-700"><Save className="w-4 h-4"/></button>
                  ) : (
                    <button onClick={() => { setEditingType(type.id); setTempTypeLabel(type.label); }} className="text-slate-400 hover:text-indigo-600"><Edit2 className="w-4 h-4"/></button>
                  )}
                  <button onClick={() => handleDeleteType(type.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Moods Manager */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Mood & Feelings</h3>
            <button onClick={handleAddMood} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            {moodOptions.map(mood => (
              <div key={mood.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                <div className="flex items-center flex-1">
                  <button 
                    onClick={() => cycleColor(mood.id, mood.color, false)}
                    className={`w-6 h-6 rounded-full bg-${mood.color}-500 mr-3 border-2 border-white shadow-sm cursor-pointer`}
                    title="Click to change color"
                  />
                  {editingMood === mood.id ? (
                    <input 
                      value={tempMoodLabel}
                      onChange={(e) => setTempMoodLabel(e.target.value)}
                      className="border rounded px-2 py-1 text-sm w-full mr-2"
                      autoFocus
                    />
                  ) : (
                    <span className="font-medium text-slate-700">{mood.label}</span>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-2">
                  {editingMood === mood.id ? (
                    <button onClick={() => saveMood(mood.id)} className="text-green-600 hover:text-green-700"><Save className="w-4 h-4"/></button>
                  ) : (
                    <button onClick={() => { setEditingMood(mood.id); setTempMoodLabel(mood.label); }} className="text-slate-400 hover:text-indigo-600"><Edit2 className="w-4 h-4"/></button>
                  )}
                  <button onClick={() => handleDeleteMood(mood.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
