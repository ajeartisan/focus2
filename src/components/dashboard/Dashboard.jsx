import React from 'react';
import BigProjects from './BigProjects.jsx';
import TodayAgenda from './TodayAgenda.jsx';
import UpcomingPriority from './UpcomingPriority.jsx';
import BigBills from './BigBills.jsx';
import ColNotesPad from './ColNotesPad.jsx';

export default function Dashboard() {
  return (
    <div className="dashboard-grid">
      <div className="dashboard-col">
        <BigProjects />
        <ColNotesPad storageKey="focus_notes_projects" title="Project Notes" />
      </div>
      <div className="dashboard-col">
        <TodayAgenda />
      </div>
      <div className="dashboard-col">
        <UpcomingPriority />
        <ColNotesPad storageKey="focus_notes_upcoming" title="Upcoming Notes" />
      </div>
      <div className="dashboard-col">
        <BigBills />
      </div>
    </div>
  );
}
