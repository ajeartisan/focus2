import React, { useState } from 'react';
import useAppStore from '../../store/appStore.js';
import { isToday, generateId } from '../../lib/utils.js';

export default function TodayAgenda() {
  const tasks = useAppStore(s => s.tasks);
  const mutateTasks = useAppStore(s => s.mutateTasks);
  const dailyItems = useAppStore(s => s.dailyItems);
  const mutateDailyItems = useAppStore(s => s.mutateDailyItems);
  const [newDailyText, setNewDailyText] = useState('');

  const todayStr = new Date().toISOString().slice(0, 10);

  // Today tasks: todayFlag OR due today, not done, not subtask
  const todayTasks = tasks.filter(t =>
    (t.todayFlag || isToday(t.dueDate)) && t.status !== 'done' && !t.parentId
  );

  // Daily checklist for today
  const todayDailyItems = dailyItems.filter(d => d.date === todayStr);

  const handleTaskDone = (taskId) => {
    mutateTasks(prev => {
      const updated = prev.map(t =>
        t.id === taskId ? { ...t, status: 'done', completedAt: new Date().toISOString() } : t
      );
      const changed = updated.filter(t => t.id === taskId);
      return { updated, changed };
    });
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    // Dropping on TodayAgenda sets todayFlag = true
    mutateTasks(prev => {
      const updated = prev.map(t =>
        t.id === taskId ? { ...t, todayFlag: true } : t
      );
      const changed = updated.filter(t => t.id === taskId);
      return { updated, changed };
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDailyToggle = (itemId) => {
    mutateDailyItems(prev => {
      const updated = prev.map(d =>
        d.id === itemId ? { ...d, done: !d.done } : d
      );
      const changed = updated.filter(d => d.id === itemId);
      return { updated, changed };
    });
  };

  const handleAddDaily = (e) => {
    if (e.key !== 'Enter' || !newDailyText.trim()) return;
    const newItem = { id: generateId(), text: newDailyText.trim(), done: false, date: todayStr };
    mutateDailyItems(prev => ({
      updated: [...prev, newItem],
      changed: [newItem],
    }));
    setNewDailyText('');
  };

  return (
    <div
      className="column-card drop-zone"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <h3 className="column-title">Today</h3>

      {todayTasks.length === 0 ? (
        <p className="empty-state">No tasks for today</p>
      ) : (
        todayTasks.map(task => (
          <div
            key={task.id}
            className="task-item"
            draggable="true"
            onDragStart={(e) => handleDragStart(e, task.id)}
          >
            <label className="task-checkbox">
              <input
                type="checkbox"
                onChange={() => handleTaskDone(task.id)}
              />
              <span className="task-title">{task.title}</span>
            </label>
            {task.priority !== 'none' && (
              <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
            )}
          </div>
        ))
      )}

      <div className="daily-section">
        <h4 className="section-subtitle">Daily Checklist</h4>
        {todayDailyItems.map(item => (
          <div key={item.id} className={`daily-item ${item.done ? 'done' : ''}`}>
            <label>
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => handleDailyToggle(item.id)}
              />
              <span>{item.text}</span>
            </label>
          </div>
        ))}
        <input
          className="daily-input"
          type="text"
          placeholder="Add daily item..."
          value={newDailyText}
          onChange={e => setNewDailyText(e.target.value)}
          onKeyDown={handleAddDaily}
        />
      </div>
    </div>
  );
}
