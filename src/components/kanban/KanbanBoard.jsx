import React, { useState, useMemo } from 'react';
import useAppStore from '../../store/appStore.js';
import { getCategoryColor, isOverdue } from '../../lib/utils.js';

const LANES = [
  { id: 'ready', label: 'Ready' },
  { id: 'doing', label: 'Doing' },
  { id: 'done', label: 'Done' },
];

export default function KanbanBoard() {
  const tasks = useAppStore(s => s.tasks);
  const mutateTasks = useAppStore(s => s.mutateTasks);
  const [projectFilter, setProjectFilter] = useState('');
  const [dragOverLane, setDragOverLane] = useState(null);

  const activeTasks = useMemo(() =>
    tasks.filter(t =>
      !t.parentId &&
      t.status !== 'archived' &&
      t.status !== 'cancelled' &&
      (!projectFilter || t.project === projectFilter)
    ),
    [tasks, projectFilter]
  );

  const projects = useMemo(() =>
    [...new Set(tasks.filter(t => t.project).map(t => t.project))].sort(),
    [tasks]
  );

  const lanes = useMemo(() => {
    const map = { ready: [], doing: [], done: [] };
    for (const t of activeTasks) {
      const lane = map[t.status];
      if (lane) lane.push(t);
    }
    return map;
  }, [activeTasks]);

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, laneId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverLane(laneId);
  };

  const handleDragLeave = () => setDragOverLane(null);

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    setDragOverLane(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    mutateTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (!task || task.status === newStatus) return { updated: prev, changed: [] };

      const now = new Date().toISOString();
      const patch = { status: newStatus };
      if (newStatus === 'done') patch.completedAt = now;
      if (newStatus !== 'done' && task.completedAt) patch.completedAt = null;

      const updated = prev.map(t =>
        t.id === taskId ? { ...t, ...patch } : t
      );
      const changed = updated.filter(t => t.id === taskId);
      return { updated, changed };
    });
  };

  return (
    <div className="kanban-board">
      <div className="kanban-toolbar">
        <h2 className="kanban-title">Kanban Board</h2>
        <select
          className="kanban-filter"
          value={projectFilter}
          onChange={e => setProjectFilter(e.target.value)}
        >
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="kanban-lanes">
        {LANES.map(lane => (
          <div
            key={lane.id}
            className={`kanban-lane ${dragOverLane === lane.id ? 'kanban-lane-dragover' : ''}`}
            onDragOver={e => handleDragOver(e, lane.id)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, lane.id)}
          >
            <div className="kanban-lane-header">
              <span className="kanban-lane-label">{lane.label}</span>
              <span className="kanban-lane-count">{lanes[lane.id].length}</span>
            </div>
            <div className="kanban-lane-body">
              {lanes[lane.id].length === 0 && (
                <div className="empty-state">No tasks</div>
              )}
              {lanes[lane.id].map(task => (
                <div
                  key={task.id}
                  className={`kanban-card ${isOverdue(task.dueDate) && task.status !== 'done' ? 'overdue' : ''}`}
                  draggable
                  onDragStart={e => handleDragStart(e, task.id)}
                >
                  <div className="kanban-card-top">
                    <span
                      className="project-dot"
                      style={{ backgroundColor: getCategoryColor(task.project) }}
                    />
                    <span className="kanban-card-title">{task.title}</span>
                  </div>
                  <div className="kanban-card-meta">
                    {task.priority && task.priority !== 'none' && (
                      <span className={`priority-badge priority-${task.priority}`}>
                        {task.priority}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className={`due-date ${isOverdue(task.dueDate) && task.status !== 'done' ? 'overdue-text' : ''}`}>
                        {task.dueDate}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
