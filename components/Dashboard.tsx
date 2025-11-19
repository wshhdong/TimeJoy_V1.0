
import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TimeEntry, WorkType, MoodOption, Role, User } from '../types';
import { generateWeeklyInsightV2 } from '../services/geminiService';
import { sendWeeklyReport } from '../services/emailService';
import { Sparkles, FileText, Mail, CheckCircle, Shield } from 'lucide-react';

interface DashboardProps {
  entries: TimeEntry[];
  workTypes: WorkType[];
  moodOptions: MoodOption[];
  user: User;
  allEntries?: TimeEntry[]; // Passed only for admin
}

export const Dashboard: React.FC<DashboardProps> = ({ entries, workTypes, moodOptions, user, allEntries }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // If Admin, using aggregated data for charts to respect privacy
  const isAdmin = user.role === Role.ADMIN;
  // For charts, Admins see ALL data aggregated. For non-admins, they see their own.
  const chartEntries = (isAdmin && allEntries) ? allEntries : entries;
  
  // Helper: Map moodId to MoodOption
  const getMood = (id: string) => moodOptions.find(m => m.id === id) || { label: 'Unknown', color: 'gray' };

  // Helper: Map color names to hex
  const getHexColor = (colorName: string) => {
    const colors: Record<string, string> = {
      blue: '#3b82f6',
      green: '#22c55e',
      purple: '#a855f7',
      orange: '#f97316',
      red: '#ef4444',
      yellow: '#eab308',
      pink: '#ec4899',
      indigo: '#6366f1',
      gray: '#94a3b8',
    };
    return colors[colorName] || '#94a3b8';
  };

  // 1. Today's data for Bar Chart
  const todayData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = chartEntries.filter(e => e.date === today);
    
    const data = workTypes.map(wt => {
      const totalMinutes = todayEntries
        .filter(e => e.workTypeId === wt.id)
        .reduce((sum, e) => sum + e.durationMinutes, 0);
      return {
        name: wt.label,
        hours: Number((totalMinutes / 60).toFixed(1)),
        fill: wt.color 
      };
    });
    return data;
  }, [chartEntries, workTypes]);


  // 2. Weekly Distribution
  const weeklyData = useMemo(() => {
      return workTypes.map(wt => {
           const totalMinutes = chartEntries
            .filter(e => e.workTypeId === wt.id)
            .reduce((sum, e) => sum + e.durationMinutes, 0);
          return {
            name: wt.label,
            current: Number((totalMinutes / 60).toFixed(1)),
            previous: Number((totalMinutes * 0.8 / 60).toFixed(1)), // Mock
          };
      });
  }, [chartEntries, workTypes]);

  // 3. Mood Distribution Pie Data
  const moodData = useMemo(() => {
    const counts: Record<string, number> = {};
    chartEntries.forEach(e => {
        const mId = e.moodId;
        if (!counts[mId]) counts[mId] = 0;
        counts[mId] += e.durationMinutes;
    });

    return Object.entries(counts).map(([moodId, value]) => {
        const mood = getMood(moodId);
        return {
            name: mood.label,
            value: value,
            color: mood.color
        };
    }).filter(d => d.value > 0);
  }, [chartEntries, moodOptions]);


  const handleGenerateInsight = async () => {
    setLoadingInsight(true);
    const result = await generateWeeklyInsightV2(entries, workTypes, moodOptions);
    setInsight(result);
    setLoadingInsight(false);
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    const reportHtml = `<h1>Weekly Report for ${user.username}</h1><p>Contains charts and data...</p>`;
    await sendWeeklyReport(user.email, reportHtml);
    setSendingEmail(false);
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 5000);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">
                {isAdmin ? "Team Overview" : "My Dashboard"}
            </h1>
            <p className="text-slate-500">
                {isAdmin 
                    ? "Aggregated summary data for the team (Privacy Mode)." 
                    : "Visualize your week and understand your time."}
            </p>
        </div>
        
        {!isAdmin && (
          <div className="flex space-x-3">
            <button
              onClick={handleGenerateInsight}
              disabled={loadingInsight}
              className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium text-sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {loadingInsight ? 'Analyzing...' : 'AI Reflection'}
            </button>
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
            >
              {emailSent ? <CheckCircle className="w-4 h-4 mr-2 text-green-500"/> : <Mail className="w-4 h-4 mr-2" />}
              {emailSent ? 'Sent!' : sendingEmail ? 'Sending...' : 'Email Report'}
            </button>
          </div>
        )}
        
        {isAdmin && (
           <div className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 text-sm">
              <Shield className="w-4 h-4 mr-2" />
              <span>Privacy Mode Active: Individual logs hidden</span>
           </div>
        )}
      </header>

      {/* AI Insight Section (User Only) */}
      {insight && !isAdmin && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-100 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold text-purple-900 mb-2 flex items-center">
            <Sparkles className="w-5 h-5 mr-2" />
            Coach TimeJoy says:
          </h3>
          <div className="prose prose-purple text-slate-700 whitespace-pre-line">
            {insight}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Today's Breakdown */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Today's Activity (Hours)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={todayData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} interval={0} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {todayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getHexColor(entry.fill)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Weekly Trend */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Weekly Comparison</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} interval={0} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="current" name="This Week" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="previous" name="Last Week" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Happiness Alignment */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Satisfaction Alignment</h3>
          <div className="h-64 flex items-center justify-center">
            {moodData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={moodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {moodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getHexColor(entry.color)} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-sm">No satisfaction data yet</div>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50 rounded-xl">
              <p className="text-sm text-indigo-600 font-medium">Total Hours Tracked</p>
              <p className="text-3xl font-bold text-indigo-900">
                {(chartEntries.reduce((acc, cur) => acc + cur.durationMinutes, 0) / 60).toFixed(1)}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl">
              <p className="text-sm text-green-600 font-medium">Happy Hours</p>
              <p className="text-3xl font-bold text-green-900">
                {(chartEntries.filter(e => getMood(e.moodId).color === 'green').reduce((acc, cur) => acc + cur.durationMinutes, 0) / 60).toFixed(1)}
              </p>
            </div>
          </div>
          {isAdmin && (
             <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                 <p className="text-sm text-slate-500">Total Active Users: {new Set(chartEntries.map(e => e.userId)).size}</p>
             </div>
          )}
        </div>
      </div>

      {/* Recent Logs Table - HIDDEN FOR ADMINS */}
      {!isAdmin && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
            <FileText className="text-slate-400 w-5 h-5" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mood</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Comment</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">
                      No entries yet. Start logging your time!
                    </td>
                  </tr>
                ) : (
                  entries
                    .sort((a, b) => new Date(b.date + 'T' + b.startTime).getTime() - new Date(a.date + 'T' + a.startTime).getTime())
                    .slice(0, 10)
                    .map((entry) => {
                      const wt = workTypes.find(w => w.id === entry.workTypeId);
                      const mood = getMood(entry.moodId);
                      return (
                        <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{entry.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{entry.startTime} - {entry.endTime}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${wt?.color || 'gray'}-100 text-${wt?.color || 'gray'}-800`}>
                              {wt?.label || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`text-${mood.color}-600 font-medium flex items-center`}>
                                {mood.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={entry.comment}>
                            {entry.comment || '-'}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
