import React, { useState, useMemo } from 'react';
import useAppStore from '../../store/appStore.js';
import { getCategoryColor, isOverdue, generateId } from '../../lib/utils.js';

const SORTABLE_COLS = ['title', 'project', 'status', 'priority', 'dueDate', 'assignedTo'];

const COL_LABELS = {
  title: 'Title',
  project: 'Project',
  status: 'Status',
  priority: 'Priority',
  dueDate: 'Due Date',
  assignedTo: 'Assigned To',
};

const STATUS_OPTIONS = ['ready', 'doing', 'done'];
const PRIORITY_OPTIONS = ['none', 'medium', 'high'];

export default function HouseholdView() {
  const tasks = useAppStore(s => s.tasks);
  const mutateTasks = useAppStore(s => s.mutateTasks);

  const [sortCol, setSortCol] = useState('dueDate');
  const [sortAsc, setSortAsc] = useState(true);
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [newTask, setNewTask] = useState({ title: '', project: '', dueDate: '', assignedTo: '' });

  const projects = useMemo(() =>
    [...new Set(tasks.filter(t => t.project).map(t => t.project))].sort(),
    [tasks]
  );

  const filtered = useMemo(() => {
    let list = tasks.filter(t =>
      !t.parentId && t.status !== 'archived' && t.status !== 'cancelled'
    );
    if (filterProject) list = list.filter(t => t.project === filterProject);
    if (filterStatus) list = list.filter(t => t.status === filterStatus);
    if (filterPriority) list = list.filter(t => t.priority === filterPriority);

    list.sort((a, b) => {
      let va = a[sortCol] ?? '';
      let vb = b[sortCol] ?? '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
    return list;
  }, [tasks, sortCol, sortAsc, filterProject, filterStatus, filterPriority]);

  const handleSort = (col) => {
    if (sortCol === col) setSortAsc(prev => !prev);
    else { setSortCol(col); setSortAsc(true); }
  };

  const handleInlineChange = (taskId, field, value) => {
    mutateTasks(prev => {
      const now = new Date().toISOString();
      const updated = prev.map(t => {
        if (t.id !== taskId) return t;
        const patch = { [field]: value };
        if (field === 'status' && value === 'done') patch.completedAt = now;
        if (field === 'status' && value !== 'done') patch.completedAt = null;
        return { ...t, ...patch };
      });
      return { updated, changed: updated.filter(t => t.id === taskId) };
    });
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    const task = {
      id: generateId(),
      title: newTask.title.trim(),
      project: newTask.project || null,
      status: 'ready',
      priority: 'none',
      todayFlag: false,
      dueDate: newTask.dueDate || null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      notes: '',
      tags: null,
      history: [],
      subtaskIds: [],
      parentId: null,
      waitingOn: null,
      assignedTo: newTask.assignedTo || null,
      waitingOnTaskIds: [],
    };

    mutateTasks(prev => ({
      updated: [task, ...prev],
      changed: [task],
    }));

    setNewTask({ title: '', project: '', dueDate: '', assignedTo: '' });
  };

  return (
    <div className="household-view">
      <div className="household-toolbar">
        <h2 className="household-title">Household</h2>
        <div className="household-filters">
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">All Priorities</option>
            {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="household-table-wrap">
        <table className="household-table">
          <thead>
            <tr>
              {SORTABLE_COLS.map(col => (
                <th
                  key={col}
                  className={`household-th ${sortCol === col ? 'sorted' : ''}`}
                  onClick={() => handleSort(col)}
                >
                  {COL_LABELS[col]}
                  {sortCol === col && (
                    <span className="household-sort-arrow">{sortAsc ? ' ▲' : ' ▼'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Add-task row */}
            <tr className="household-add-row">
              <td>
                <form onSubmit={handleAddTask} className="household-add-form">
                  <input
                    type="text"
                    placeholder="New task..."
                    value={newTask.title}
                    onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <button type="submit" className="add-btn" title="Add task">+</button>
                </form>
              </td>
              <td>
                <input
                  type="text"
                  placeholder="Project"
                  value={newTask.project}
                  onChange={e => setNewTask(prev => ({ ...prev, project: e.target.value }))}
                  className="household-inline-input"
                />
              </td>
              <td></td>
              <td></td>
              <td>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={e => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="household-inline-input"
                />
              </td>
              <td>
                <input
                  type="text"
                  placeholder="Assigned to"
                  value={newTask.assignedTo}
                  onChange={e => setNewTask(prev => ({ ...prev, assignedTo: e.target.value }))}
                  className="household-inline-input"
                />
              </td>
            </tr>

            {filtered.map(task => (
              <tr
                key={task.id}
                className={`household-row ${task.status === 'done' ? 'household-done' : ''} ${isOverdue(task.dueDate) && task.status !== 'done' ? 'household-overdue' : ''}`}
              >
                <td className="household-title-cell">
                  <span
                    className="project-dot"
                    style={{ backgroundColor: getCategoryColor(task.project) }}
                  />
                  {task.title}
                </td>
                <td>{task.project || '—'}</td>
                <td>
                  <select
                    value={task.status}
                    onChange={e => handleInlineChange(task.id, 'status', e.target.value)}
                    className="household-inline-select"
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td>
                  <select
                    value={task.priority || 'none'}
                    onChange={e => handleInlineChange(task.id, 'priority', e.target.value)}
                    className="household-inline-select"
                  >
                    {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </td>
                <td className={isOverdue(task.dueDate) && task.status !== 'done' ? 'overdue-text' : ''}>
                  {task.dueDate || '—'}
                </td>
                <td>{task.assignedTo || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
            No tasks match filters
          </div>
        )}
      </div>
    </div>
  );
}
