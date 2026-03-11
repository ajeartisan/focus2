import React from 'react';
import Sidebar from './Sidebar.jsx';
import Dashboard from '../dashboard/Dashboard.jsx';
import WeekCalendar from '../dashboard/WeekCalendar.jsx';
import useAppStore from '../../store/appStore.js';

export default function AppShell() {
  const sidebarHidden = useAppStore(s => s.sidebarHidden);

  return (
    <div className={`app-shell ${sidebarHidden ? 'sidebar-collapsed' : ''}`}>
      <Sidebar />
      <main className="main-content">
        <WeekCalendar />
        <Dashboard />
      </main>
    </div>
  );
}
