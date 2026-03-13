import React, { useState, useMemo } from 'react';
import useAppStore from '../../store/appStore.js';
import { getCategoryColor } from '../../lib/utils.js';

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7; // Monday-first
  const days = [];

  // Padding from previous month
  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, outside: true });
  }

  // Current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), outside: false });
  }

  // Pad to complete last week
  while (days.length % 7 !== 0) {
    const next = new Date(year, month + 1, days.length - startPad - lastDay.getDate() + 1);
    days.push({ date: next, outside: true });
  }

  return days;
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ScheduleView() {
  const tasks = useAppStore(s => s.tasks);
  const mutateTasks = useAppStore(s => s.mutateTasks);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const activeTasks = useMemo(() =>
    tasks.filter(t => !t.parentId && t.status !== 'archived' && t.status !== 'cancelled'),
    [tasks]
  );

  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  const tasksByDate = useMemo(() => {
    const map = {};
    for (const t of activeTasks) {
      if (t.dueDate) {
        if (!map[t.dueDate]) map[t.dueDate] = [];
        map[t.dueDate].push(t);
      }
    }
    return map;
  }, [activeTasks]);

  const undated = useMemo(() =>
    activeTasks.filter(t => !t.dueDate && t.status !== 'done'),
    [activeTasks]
  );

  const selectedTasks = selectedDate ? (tasksByDate[selectedDate] || []) : [];
  const todayStr = formatDate(today);

  const goPrev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const goNext = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDate(todayStr);
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
      return { updated, changed: updated.filter(t => t.id === taskId) };
    });
  };

  return (
    <div className="schedule-view">
      <div className="schedule-header">
        <h2 className="schedule-title">{MONTH_NAMES[month]} {year}</h2>
        <div className="schedule-nav">
          <button onClick={goPrev}>‹</button>
          <button onClick={goToday} className="today-btn">Today</button>
          <button onClick={goNext}>›</button>
        </div>
      </div>

      <div className="schedule-body">
        <div className="schedule-calendar">
          <div className="schedule-day-headers">
            {DAY_HEADERS.map(d => (
              <div key={d} className="schedule-day-header">{d}</div>
            ))}
          </div>
          <div className="schedule-grid">
            {days.map(({ date, outside }, i) => {
              const dateStr = formatDate(date);
              const dayTasks = tasksByDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              return (
                <div
                  key={i}
                  className={`schedule-cell ${outside ? 'outside' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedDate(dateStr)}
                >
                  <span className="schedule-cell-number">{date.getDate()}</span>
                  {dayTasks.length > 0 && (
                    <div className="schedule-cell-dots">
                      {dayTasks.slice(0, 4).map(t => (
                        <span
                          key={t.id}
                          className="task-dot"
                          style={{ backgroundColor: getCategoryColor(t.project) }}
                        />
                      ))}
                      {dayTasks.length > 4 && (
                        <span className="dots-more">+{dayTasks.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedDate && (
            <div className="schedule-detail">
              <h3 className="schedule-detail-title">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              {selectedTasks.length === 0 && (
                <div className="empty-state">No tasks on this date</div>
              )}
              {selectedTasks.map(task => (
                <div key={task.id} className="task-item">
                  <label className="task-checkbox">
                    <input
                      type="checkbox"
                      checked={task.status === 'done'}
                      onChange={() => handleToggleDone(task.id)}
                    />
                    <span className="task-title">{task.title}</span>
                  </label>
                  <div className="task-meta">
                    <span
                      className="project-dot"
                      style={{ backgroundColor: getCategoryColor(task.project) }}
                    />
                    <span className="due-date">{task.project || 'Uncategorized'}</span>
                    {task.priority && task.priority !== 'none' && (
                      <span className={`priority-badge priority-${task.priority}`}>
                        {task.priority}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="schedule-sidebar">
          <h3 className="schedule-sidebar-title">Undated Tasks</h3>
          {undated.length === 0 && (
            <div className="empty-state">All tasks have dates</div>
          )}
          {undated.slice(0, 30).map(task => (
            <div key={task.id} className="task-item">
              <label className="task-checkbox">
                <input
                  type="checkbox"
                  checked={task.status === 'done'}
                  onChange={() => handleToggleDone(task.id)}
                />
                <span className="task-title">{task.title}</span>
              </label>
              <span
                className="project-dot"
                style={{ backgroundColor: getCategoryColor(task.project) }}
              />
            </div>
          ))}
          {undated.length > 30 && (
            <div className="empty-state">+{undated.length - 30} more</div>
          )}
        </div>
      </div>
    </div>
  );
}
