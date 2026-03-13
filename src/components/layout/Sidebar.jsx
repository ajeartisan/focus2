import React from 'react';
import useAppStore from '../../store/appStore.js';
import { signOut } from '../../lib/supabase.js';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
  { id: 'kanban', label: 'Kanban', icon: '▦' },
  { id: 'projects', label: 'Projects', icon: '◈' },
  { id: 'schedule', label: 'Schedule', icon: '◷' },
  { id: 'household', label: 'Household', icon: '⌂' },
];

const SYNC_COLORS = {
  offline: '#9E9E9E',
  syncing: '#F9A825',
  synced: '#43A047',
  error: '#E53935',
};

export default function Sidebar() {
  const currentView = useAppStore(s => s.currentView);
  const setCurrentView = useAppStore(s => s.setCurrentView);
  const syncStatus = useAppStore(s => s.syncStatus);
  const currentUser = useAppStore(s => s.currentUser);
  const setCurrentUser = useAppStore(s => s.setCurrentUser);

  const handleNav = (id) => {
    setCurrentView(id);
  };

  const handleSignOut = async () => {
    await signOut();
    setCurrentUser(null);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Focus2</h2>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => handleNav(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sync-indicator">
          <span className="sync-dot" style={{ backgroundColor: SYNC_COLORS[syncStatus] }} />
          <span className="sync-label">{syncStatus}</span>
        </div>
        {currentUser && (
          <div className="user-info">
            <span className="user-email">{currentUser.email}</span>
            <button className="sign-out-btn" onClick={handleSignOut}>Sign out</button>
          </div>
        )}
      </div>
    </aside>
  );
}
