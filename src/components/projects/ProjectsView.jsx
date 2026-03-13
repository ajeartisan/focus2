import React, { useState, useMemo } from 'react';
import useAppStore from '../../store/appStore.js';
import { getCategoryColor } from '../../lib/utils.js';

const STATUS_ORDER = { doing: 0, ready: 1, done: 2 };

export default function ProjectsView() {
  const tasks = useAppStore(s => s.tasks);
  const mutateTasks = useAppStore(s => s.mutateTasks);
  const [collapsed, setCollapsed] = useState({});

  const grouped = useMemo(() => {
    const active = tasks.filter(t =>
      !t.parentId && t.status !== 'archived' && t.status !== 'cancelled'
    );

    const map = {};
    for (const t of active) {
      const key = t.project || 'Uncategorized';
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }

    // Sort tasks within each project
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) =>
        (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
      );
    }

    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [tasks]);

  const toggleCollapse = (project) => {
    setCollapsed(prev => ({ ...prev, [project]: !prev[project] }));
  };

  const handleToggleDone = (taskId) => {
    mutateTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (!task) return { updated: prev, changed: [] };

      const now = new Date().toISOString();
      const newStatus = task.status === 'done' ? 'ready' : 'done';
      const updated = prev.map(t =>
        t.id === taskId
          ? { ...t, status: newStatus, completedAt: newStatus === 'done' ? now : null }
          : t
      );
      const changed = updated.filter(t => t.id === taskId);
      return { updated, changed };
    });
  };

  return (
    <div className="projects-view">
      <h2 className="projects-title">Projects</h2>

      {grouped.length === 0 && (
        <div className="empty-state">No tasks found</div>
      )}

      {grouped.map(([project, projectTasks]) => (
        <div key={project} className="projects-group">
          <button
            className="projects-group-header"
            onClick={() => toggleCollapse(project)}
            style={{ borderLeftColor: getCategoryColor(project) }}
          >
            <span
              className="project-dot"
              style={{ backgroundColor: getCategoryColor(project) }}
            />
            <span className="projects-group-name">{project}</span>
            <span className="project-count">{projectTasks.length}</span>
            <span className="projects-chevron">
              {collapsed[project] ? '▸' : '▾'}
            </span>
          </button>

          {!collapsed[project] && (
            <div className="projects-task-list">
              {projectTasks.map(task => (
                <div key={task.id} className="task-item">
                  <label className="task-checkbox">
                    <input
                      type="checkbox"
                      checked={task.status === 'done'}
                      onChange={() => handleToggleDone(task.id)}
                    />
                    <span
                      className="task-title"
                      style={task.status === 'done' ? { textDecoration: 'line-through', color: 'var(--text-muted)' } : {}}
                    >
                      {task.title}
                    </span>
                  </label>
                  <div className="task-meta">
                    <span className="projects-status-badge" data-status={task.status}>
                      {task.status}
                    </span>
                    {task.priority && task.priority !== 'none' && (
                      <span className={`priority-badge priority-${task.priority}`}>
                        {task.priority}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="due-date">{task.dueDate}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
