import React from 'react';
import './NoteList.css';

function NoteList({ notes, activeNote, onSelectNote, onCreateNote, onDeleteNote, sectionName, notebookName }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'Z');
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  const getPreview = (content) => {
    if (!content) return 'Empty note';
    // Strip markdown syntax for preview
    return content
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .substring(0, 100);
  };

  return (
    <div className="note-list">
      <div className="note-list-header">
        <div>
          <div className="note-list-title">{sectionName || 'Notes'}</div>
          {notebookName && <div className="note-list-subtitle">{notebookName}</div>}
        </div>
        <button className="new-note-btn" onClick={onCreateNote} disabled={!sectionName}>
          + New Note
        </button>
      </div>

      <div className="note-list-items">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`note-item ${activeNote?.id === note.id ? 'active' : ''} ${note.is_pinned ? 'pinned' : ''}`}
            onClick={() => onSelectNote(note)}
          >
            <div className="note-item-header">
              <span className="note-item-title">
                {note.is_pinned && <span className="pin-indicator" title="Pinned">&#x1f4cc;</span>}
                {note.title || 'Untitled'}
              </span>
              <button
                className="note-delete-btn"
                onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                title="Delete note"
              >
                &times;
              </button>
            </div>
            <div className="note-item-preview">{getPreview(note.content)}</div>
            <div className="note-item-footer">
              <span className="note-item-date">{formatDate(note.updated_at)}</span>
              {note.tags && note.tags.length > 0 && (
                <div className="note-item-tags">
                  {note.tags.map((t) => (
                    <span key={t.id} className="note-tag-dot" style={{ background: t.color }} title={t.name} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {notes.length === 0 && sectionName && (
          <div className="note-list-empty">
            <p>No notes in this section</p>
            <button className="btn-primary" onClick={onCreateNote}>Create your first note</button>
          </div>
        )}
        {!sectionName && (
          <div className="note-list-empty">
            <p>Select a notebook and section to view notes</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NoteList;
