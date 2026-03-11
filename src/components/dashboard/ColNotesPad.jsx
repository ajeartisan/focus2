import React, { useState } from 'react';
import useAppStore from '../../store/appStore.js';
import { generateId } from '../../lib/utils.js';

export default function ColNotesPad({ storageKey, title }) {
  const colNotes = useAppStore(s => s.colNotes);
  const mutateColNotes = useAppStore(s => s.mutateColNotes);
  const removeColNote = useAppStore(s => s.removeColNote);
  const [newText, setNewText] = useState('');

  const notes = colNotes[storageKey] || [];

  const handleAdd = (e) => {
    if (e.key !== 'Enter' || !newText.trim()) return;
    const note = { id: generateId(), text: newText.trim(), done: false };
    mutateColNotes(storageKey, () => ({
      updated: [...notes, note],
      changed: [note],
    }));
    setNewText('');
  };

  const handleToggle = (noteId) => {
    mutateColNotes(storageKey, (current) => {
      const updated = current.map(n =>
        n.id === noteId ? { ...n, done: !n.done } : n
      );
      const changed = updated.filter(n => n.id === noteId);
      return { updated, changed };
    });
  };

  const handleDelete = (noteId) => {
    removeColNote(storageKey, noteId);
  };

  return (
    <div className="column-card col-notes">
      <h4 className="section-subtitle">{title}</h4>
      {notes.map(note => (
        <div key={note.id} className={`col-note-item ${note.done ? 'done' : ''}`}>
          <label>
            <input
              type="checkbox"
              checked={note.done}
              onChange={() => handleToggle(note.id)}
            />
            <span>{note.text}</span>
          </label>
          <button className="note-delete" onClick={() => handleDelete(note.id)}>&times;</button>
        </div>
      ))}
      <input
        className="note-input"
        type="text"
        placeholder="Add note..."
        value={newText}
        onChange={e => setNewText(e.target.value)}
        onKeyDown={handleAdd}
      />
    </div>
  );
}
