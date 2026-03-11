import React from 'react';
import useAppStore from '../../store/appStore.js';
import { isOverdue, isToday } from '../../lib/utils.js';

export default function UpcomingPriority() {
  const tasks = useAppStore(s => s.tasks);
  const mutateTasks = useAppStore(s => s.mutateTasks);

  const now = new Date();
  const in14Days = new Date(now);
  in14Days.setDate(in14Days.getDate() + 14);
  const cutoff = in14Days.toISOString().slice(0, 10);

  // Filter: not done, not todayFlag, not subtask, AND (high/medium priority OR due within 14 days)
  const upcoming = tasks.filter(t => {
    if (t.status === 'done' || t.todayFlag || t.parentId) return false;
    const hasPriority = t.priority === 'high' || t.priority === 'medium';
    const hasDueSoon = t.dueDate && t.dueDate <= cutoff;
    return hasPriority || hasDueSoon;
  });

  // Sort: overdue first, then by due date, then by priority
  const priorityOrder = { high: 0, medium: 1, none: 2 };
  upcoming.sort((a, b) => {
    const aOverdue = isOverdue(a.dueDate) ? 0 : 1;
    const bOverdue = isOverdue(b.dueDate) ? 0 : 1;
    if (aOverdue !== bOverdue) return aOverdue - bOverdue;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
  });

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    // Dropping on UpcomingPriority removes todayFlag
    mutateTasks(prev => {
      const updated = prev.map(t =>
        t.id === taskId ? { ...t, todayFlag: false } : t
      );
      const changed = updated.filter(t => t.id === taskId);
      return { updated, changed };
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div
      className="column-card drop-zone"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <h3 className="column-title">Upcoming &amp; Priority</h3>
      {upcoming.length === 0 ? (
        <p className="empty-state">Nothing upcoming</p>
      ) : (
        upcoming.map(task => (
          <div
            key={task.id}
            className={`task-item ${isOverdue(task.dueDate) ? 'overdue' : ''}`}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, task.id)}
          >
            <span className="task-title">{task.title}</span>
            <div className="task-meta">
              {task.dueDate && (
                <span className={`due-date ${isOverdue(task.dueDate) ? 'overdue-text' : ''}`}>
                  {task.dueDate}
                </span>
              )}
              {task.priority !== 'none' && (
                <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
