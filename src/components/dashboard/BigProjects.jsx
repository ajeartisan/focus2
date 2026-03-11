import React from 'react';
import useAppStore from '../../store/appStore.js';
import { getCategoryColor } from '../../lib/utils.js';

export default function BigProjects() {
  const tasks = useAppStore(s => s.tasks);

  // Filter: doing, not a subtask
  const doingTasks = tasks.filter(t => t.status === 'doing' && !t.parentId);

  // Group by project
  const grouped = {};
  for (const t of doingTasks) {
    const proj = t.project || 'Blank';
    if (!grouped[proj]) grouped[proj] = [];
    grouped[proj].push(t);
  }
  const projects = Object.keys(grouped).sort();

  return (
    <div className="column-card">
      <h3 className="column-title">Big Projects</h3>
      {projects.length === 0 ? (
        <p className="empty-state">No active projects</p>
      ) : (
        projects.map(proj => (
          <div key={proj} className="project-group">
            <div className="project-header" style={{ borderLeftColor: getCategoryColor(proj) }}>
              <span className="project-dot" style={{ backgroundColor: getCategoryColor(proj) }} />
              {proj}
              <span className="project-count">{grouped[proj].length}</span>
            </div>
            {grouped[proj].map(task => (
              <div key={task.id} className="task-item">
                <span className="task-title">{task.title}</span>
                {task.priority !== 'none' && (
                  <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
                )}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
