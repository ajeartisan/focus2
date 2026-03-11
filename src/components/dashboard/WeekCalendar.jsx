import React from 'react';
import useAppStore from '../../store/appStore.js';
import { getWeekDays, getMonday, getCategoryColor } from '../../lib/utils.js';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeekCalendar() {
  const tasks = useAppStore(s => s.tasks);
  const weekStartDate = useAppStore(s => s.weekStartDate);
  const calendarViewMode = useAppStore(s => s.calendarViewMode);
  const calendarOpen = useAppStore(s => s.calendarOpen);
  const setWeekStartDate = useAppStore(s => s.setWeekStartDate);
  const setCalendarViewMode = useAppStore(s => s.setCalendarViewMode);
  const setCalendarOpen = useAppStore(s => s.setCalendarOpen);

  const days = getWeekDays(weekStartDate, calendarViewMode);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build map of date -> tasks due that day
  const tasksByDate = {};
  for (const t of tasks) {
    if (t.dueDate && t.status !== 'done') {
      if (!tasksByDate[t.dueDate]) tasksByDate[t.dueDate] = [];
      tasksByDate[t.dueDate].push(t);
    }
  }

  const handlePrev = () => {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() - 7);
    setWeekStartDate(getMonday(d));
  };

  const handleNext = () => {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + 7);
    setWeekStartDate(getMonday(d));
  };

  const handleToday = () => {
    setWeekStartDate(getMonday(new Date()));
  };

  const formatRange = () => {
    if (days.length === 0) return '';
    const first = days[0];
    const last = days[days.length - 1];
    const opts = { month: 'short', day: 'numeric' };
    return `${first.toLocaleDateString('en-US', opts)} — ${last.toLocaleDateString('en-US', opts)}, ${last.getFullYear()}`;
  };

  if (!calendarOpen) {
    return (
      <div className="week-calendar collapsed">
        <button className="calendar-toggle" onClick={() => setCalendarOpen(true)}>
          Show Calendar
        </button>
      </div>
    );
  }

  return (
    <div className="week-calendar">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button onClick={handlePrev}>&lt;</button>
          <button className="today-btn" onClick={handleToday}>Today</button>
          <button onClick={handleNext}>&gt;</button>
          <span className="calendar-range">{formatRange()}</span>
        </div>
        <div className="calendar-controls">
          {['workweek', 'week'].map(mode => (
            <button
              key={mode}
              className={calendarViewMode === mode ? 'active' : ''}
              onClick={() => setCalendarViewMode(mode)}
            >
              {mode === 'workweek' ? '5-day' : '7-day'}
            </button>
          ))}
          <button className="calendar-toggle" onClick={() => setCalendarOpen(false)}>
            Hide
          </button>
        </div>
      </div>
      <div className="calendar-days">
        {days.map((day, i) => {
          const dateStr = day.toISOString().slice(0, 10);
          const isToday = day.getTime() === today.getTime();
          const dayTasks = tasksByDate[dateStr] || [];
          return (
            <div key={i} className={`calendar-day ${isToday ? 'today' : ''}`}>
              <div className="day-name">{DAY_NAMES[day.getDay() === 0 ? 6 : day.getDay() - 1]}</div>
              <div className="day-number">{day.getDate()}</div>
              <div className="day-dots">
                {dayTasks.slice(0, 5).map(t => (
                  <span
                    key={t.id}
                    className="task-dot"
                    style={{ backgroundColor: getCategoryColor(t.project) }}
                    title={t.title}
                  />
                ))}
                {dayTasks.length > 5 && <span className="dots-more">+{dayTasks.length - 5}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
