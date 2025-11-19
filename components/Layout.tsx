
import React, { useState } from 'react';
import { Menu, X, PieChart, Clock, LogOut, Settings, Shield, User as UserIcon } from 'lucide-react';
import { User, Role } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout, currentView, onNavigate, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavItem = ({ view, icon: Icon, label }: { view: string; icon: any; label: string }) => (
    <button
      onClick={() => {
        onNavigate(view);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
        currentView === view
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-full z-10">
        <div className="p-6 flex items-center">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
            <Clock className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-slate-800">TimeJoy</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <NavItem view="logger" icon={Clock} label="Time Logger" />
          <NavItem view="dashboard" icon={PieChart} label="Dashboard" />
          <NavItem view="profile" icon={UserIcon} label="My Profile" />
          {user.role === Role.ADMIN && (
             <NavItem view="admin" icon={Shield} label="Admin Panel" />
          )}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="px-4 py-2 mb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase">Signed in as</p>
            <p className="text-sm font-medium text-slate-700 truncate">{user.username}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed w-full bg-white border-b border-slate-200 z-20 flex items-center justify-between p-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
            <Clock className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold text-slate-800">TimeJoy</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="text-slate-600" /> : <Menu className="text-slate-600" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-10 pt-20 px-4 space-y-2">
           <NavItem view="logger" icon={Clock} label="Time Logger" />
           <NavItem view="dashboard" icon={PieChart} label="Dashboard" />
           <NavItem view="profile" icon={UserIcon} label="My Profile" />
           {user.role === Role.ADMIN && (
             <NavItem view="admin" icon={Shield} label="Admin Panel" />
           )}
           <hr className="border-slate-100 my-4"/>
           <button
            onClick={onLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-20 md:pt-0 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};
