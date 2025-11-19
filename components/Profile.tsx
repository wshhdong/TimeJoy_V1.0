
import React, { useState } from 'react';
import { User } from '../types';
import { User as UserIcon, Mail, Save, CheckCircle } from 'lucide-react';

interface ProfileProps {
  user: User;
  onUpdateUser: (updatedData: Partial<User>) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ username, email });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 bg-indigo-600 text-white">
          <h2 className="text-xl font-bold flex items-center">
            <UserIcon className="w-6 h-6 mr-2" />
            My Profile
          </h2>
          <p className="text-indigo-100 text-sm mt-1">Manage your personal information.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
            <div className="relative">
                <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border-slate-300 border focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
            <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border-slate-300 border focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
                />
            </div>
          </div>

          {success && (
            <div className="flex items-center p-4 bg-green-50 text-green-700 rounded-lg">
              <CheckCircle className="w-5 h-5 mr-2" />
              Profile updated successfully!
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center"
          >
            <Save className="w-5 h-5 mr-2" />
            Update Information
          </button>
        </form>
      </div>
    </div>
  );
};
