
import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Layout } from './components/Layout';
import { TimeLogger } from './components/TimeLogger';
import { Dashboard } from './components/Dashboard';
import { Auth } from './components/Auth';
import { Profile } from './components/Profile';
import { AdminPanel } from './components/AdminPanel';
import { User, Role, TimeEntry, WorkType, AppState, MoodOption } from './types';

// --- Default Data Constants ---
const DEFAULT_WORK_TYPES: WorkType[] = [
  { id: '1', label: 'Daily Project Work', color: 'blue' },
  { id: '2', label: 'Life & Family', color: 'green' },
  { id: '3', label: 'Long-Term Investment', color: 'purple' },
];

const DEFAULT_MOOD_OPTIONS: MoodOption[] = [
    { id: 'm1', label: 'Happy', value: 10, icon: 'smile', color: 'green' },
    { id: 'm2', label: 'OK', value: 5, icon: 'meh', color: 'yellow' },
    { id: 'm3', label: 'Not so good', value: 1, icon: 'frown', color: 'red' },
];

const INITIAL_STATE: AppState = {
  user: null,
  users: [
    {
      id: 'admin-default-id',
      username: 'Admin',
      email: 'admin@timejoy.com',
      role: Role.ADMIN
    }
  ],
  workTypes: DEFAULT_WORK_TYPES,
  moodOptions: DEFAULT_MOOD_OPTIONS,
  entries: [],
};

const App: React.FC = () => {
  // --- State Management ---
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('timejoy_v1_1'); // Bump version to reset config if needed
    if (saved) return JSON.parse(saved);
    return INITIAL_STATE;
  });

  const [currentView, setCurrentView] = useState('logger');

  useEffect(() => {
    localStorage.setItem('timejoy_v1_1', JSON.stringify(state));
  }, [state]);

  // --- Actions ---

  const handleLogin = useCallback((username: string, email: string, isRegistering: boolean) => {
    const inputEmail = email.trim();
    const inputUsername = username.trim();
    
    if (isRegistering) {
      const emailExists = state.users.some(u => u.email.toLowerCase() === inputEmail.toLowerCase());
      const usernameExists = state.users.some(u => u.username.toLowerCase() === inputUsername.toLowerCase());

      if (emailExists) { alert("This email address is already registered."); return; }
      if (usernameExists) { alert("This username is already taken."); return; }
      
      const newUser: User = {
        id: uuidv4(),
        username: inputUsername,
        email: inputEmail,
        role: inputUsername.toLowerCase() === 'admin' ? Role.ADMIN : Role.USER
      };

      setState(prev => ({ ...prev, users: [...prev.users, newUser], user: newUser }));
    } else {
      const existingUser = state.users.find(u => u.email.toLowerCase() === inputEmail.toLowerCase());
      if (!existingUser) { alert("No account found with this email."); return; }
      if (existingUser.username.toLowerCase() !== inputUsername.toLowerCase()) { alert("Username and Email do not match."); return; }
      setState(prev => ({ ...prev, user: existingUser }));
    }
  }, [state.users]);

  const handleLogout = useCallback(() => {
    setState(prev => ({ ...prev, user: null }));
    setCurrentView('logger');
  }, []);

  const handleUpdateUser = useCallback((updatedData: Partial<User>) => {
    if (!state.user) return;
    const otherUsers = state.users.filter(u => u.id !== state.user!.id);
    
    if (updatedData.email && otherUsers.some(u => u.email.toLowerCase() === updatedData.email!.toLowerCase())) {
        alert("Email already in use."); return;
    }
    if (updatedData.username && otherUsers.some(u => u.username.toLowerCase() === updatedData.username!.toLowerCase())) {
        alert("Username already in use."); return;
    }

    const updatedUser = { ...state.user, ...updatedData };
    setState(prev => ({
      ...prev,
      user: updatedUser,
      users: prev.users.map(u => u.id === state.user!.id ? updatedUser : u)
    }));
  }, [state.user, state.users]);

  const handleAddEntry = useCallback((entryData: Omit<TimeEntry, 'id' | 'userId'>, redirectToDashboard: boolean) => {
    if (!state.user) return;
    const newEntry: TimeEntry = { id: uuidv4(), userId: state.user.id, ...entryData };
    setState(prev => ({ ...prev, entries: [...prev.entries, newEntry] }));
    if (redirectToDashboard) setCurrentView('dashboard');
  }, [state.user]);

  const getLastEntryEndTime = useCallback(() => {
    if (!state.user) return undefined;
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = state.entries
      .filter(e => e.userId === state.user!.id && e.date === today)
      .sort((a, b) => a.endTime.localeCompare(b.endTime));
    return todayEntries.length > 0 ? todayEntries[todayEntries.length - 1].endTime : '09:00';
  }, [state.user, state.entries]);

  // Admin Handlers
  const handleUpdateWorkTypes = (newTypes: WorkType[]) => {
      setState(prev => ({ ...prev, workTypes: newTypes }));
  };
  const handleUpdateMoodOptions = (newMoods: MoodOption[]) => {
      setState(prev => ({ ...prev, moodOptions: newMoods }));
  };

  const handleImportState = (newState: AppState) => {
    // We keep the current session user if valid, otherwise logout might happen naturally or we force it.
    // Ideally, if importing a whole DB, we might need to re-login.
    // Let's keep it simple: overwrite everything, but try to keep current user logged in if they exist in new DB.
    setState(newState);
  };

  // --- Render ---

  if (!state.user) {
    return <Auth onLogin={handleLogin} />;
  }

  const userEntries = state.entries.filter(e => e.userId === state.user?.id);

  return (
    <Layout
      user={state.user}
      onLogout={handleLogout}
      currentView={currentView}
      onNavigate={setCurrentView}
    >
      {currentView === 'dashboard' && (
        <Dashboard 
          entries={userEntries} 
          workTypes={state.workTypes}
          moodOptions={state.moodOptions}
          user={state.user}
          allEntries={state.entries} 
        />
      )}
      {currentView === 'logger' && (
        <TimeLogger
          workTypes={state.workTypes}
          moodOptions={state.moodOptions}
          existingEntries={userEntries} // Pass existing entries for overlap check
          onAddEntry={handleAddEntry}
          lastEntryEndTime={getLastEntryEndTime()}
        />
      )}
      {currentView === 'profile' && (
        <Profile 
          user={state.user} 
          onUpdateUser={handleUpdateUser} 
        />
      )}
      {currentView === 'admin' && state.user.role === Role.ADMIN && (
        <AdminPanel 
            fullState={state}
            workTypes={state.workTypes}
            moodOptions={state.moodOptions}
            onUpdateWorkTypes={handleUpdateWorkTypes}
            onUpdateMoodOptions={handleUpdateMoodOptions}
            onImportState={handleImportState}
        />
      )}
    </Layout>
  );
};

export default App;
