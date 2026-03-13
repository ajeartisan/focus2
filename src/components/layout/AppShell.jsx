import React from 'react';
import Sidebar from './Sidebar.jsx';
import Dashboard from '../dashboard/Dashboard.jsx';
import WeekCalendar from '../dashboard/WeekCalendar.jsx';
import KanbanBoard from '../kanban/KanbanBoard.jsx';
import ProjectsView from '../projects/ProjectsView.jsx';
import ScheduleView from '../schedule/ScheduleView.jsx';
import HouseholdView from '../household/HouseholdView.jsx';
import useAppStore from '../../store/appStore.js';

function ViewSwitch({ view }) {
  switch (view) {
    case 'kanban': return <KanbanBoard />;
    case 'projects': return <ProjectsView />;
    case 'schedule': return <ScheduleView />;
    case 'household': return <HouseholdView />;
    default: return (
      <>
        <WeekCalendar />
        <Dashboard />
      </>
    );
  }
}

export default function AppShell() {
  const sidebarHidden = useAppStore(s => s.sidebarHidden);
  const currentView = useAppStore(s => s.currentView);

  return (
    <div className={`app-shell ${sidebarHidden ? 'sidebar-collapsed' : ''}`}>
      <Sidebar />
      <main className="main-content">
        <ViewSwitch view={currentView} />
      </main>
    </div>
  );
}
