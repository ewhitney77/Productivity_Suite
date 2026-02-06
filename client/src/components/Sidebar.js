import React, { useState } from 'react';
import { api } from '../api';
import './Sidebar.css';

const COLORS = ['#4A90D9', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#3498db'];

function Sidebar({
  notebooks, activeNotebook, onSelectNotebook, onRefreshNotebooks,
  sections, activeSection, onSelectSection,
  tags, onRefreshTags,
  searchQuery, onSearch,
  collapsed, onToggleCollapse,
}) {
  const [showNewNotebook, setShowNewNotebook] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [newNotebookColor, setNewNotebookColor] = useState('#4A90D9');
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [editingNotebook, setEditingNotebook] = useState(null);

  const handleCreateNotebook = async (e) => {
    e.preventDefault();
    if (!newNotebookName.trim()) return;
    await api.createNotebook({ name: newNotebookName, color: newNotebookColor });
    setNewNotebookName('');
    setShowNewNotebook(false);
    onRefreshNotebooks();
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!newSectionName.trim() || !activeNotebook) return;
    await api.createSection({ notebook_id: activeNotebook.id, name: newSectionName });
    setNewSectionName('');
    setShowNewSection(false);
    // Refresh by re-selecting notebook
    onSelectNotebook({ ...activeNotebook });
  };

  const handleDeleteNotebook = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this notebook and all its contents?')) {
      await api.deleteNotebook(id);
      if (activeNotebook?.id === id) onSelectNotebook(null);
      onRefreshNotebooks();
    }
  };

  const handleDeleteSection = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this section and all its notes?')) {
      await api.deleteSection(id);
      if (activeSection?.id === id) onSelectSection(null);
      onSelectNotebook({ ...activeNotebook });
    }
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && <h1 className="app-title">Productivity Suite</h1>}
        <button className="collapse-btn" onClick={onToggleCollapse}>
          {collapsed ? '\u2192' : '\u2190'}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Search */}
          <div className="search-box">
            <input
              type="text"
              placeholder="Search all notes..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>

          {/* Notebooks */}
          <div className="sidebar-section">
            <div className="section-header">
              <span>Notebooks</span>
              <button className="add-btn" onClick={() => setShowNewNotebook(!showNewNotebook)}>+</button>
            </div>

            {showNewNotebook && (
              <form onSubmit={handleCreateNotebook} className="new-item-form">
                <input
                  type="text"
                  placeholder="Notebook name"
                  value={newNotebookName}
                  onChange={(e) => setNewNotebookName(e.target.value)}
                  autoFocus
                />
                <div className="color-picker">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`color-dot ${newNotebookColor === c ? 'active' : ''}`}
                      style={{ background: c }}
                      onClick={() => setNewNotebookColor(c)}
                    />
                  ))}
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">Create</button>
                  <button type="button" className="btn-ghost" onClick={() => setShowNewNotebook(false)}>Cancel</button>
                </div>
              </form>
            )}

            <div className="notebook-list">
              {notebooks.map((nb) => (
                <div
                  key={nb.id}
                  className={`notebook-item ${activeNotebook?.id === nb.id ? 'active' : ''}`}
                  onClick={() => onSelectNotebook(nb)}
                >
                  <div className="notebook-color" style={{ background: nb.color }} />
                  <div className="notebook-info">
                    <span className="notebook-name">{nb.name}</span>
                    <span className="notebook-meta">
                      {nb.section_count} sections &middot; {nb.note_count} notes
                    </span>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDeleteNotebook(nb.id, e)}
                    title="Delete notebook"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {notebooks.length === 0 && (
                <div className="empty-state">No notebooks yet. Create one to get started!</div>
              )}
            </div>
          </div>

          {/* Sections */}
          {activeNotebook && (
            <div className="sidebar-section">
              <div className="section-header">
                <span>Sections</span>
                <button className="add-btn" onClick={() => setShowNewSection(!showNewSection)}>+</button>
              </div>

              {showNewSection && (
                <form onSubmit={handleCreateSection} className="new-item-form">
                  <input
                    type="text"
                    placeholder="Section name"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    autoFocus
                  />
                  <div className="form-actions">
                    <button type="submit" className="btn-primary">Create</button>
                    <button type="button" className="btn-ghost" onClick={() => setShowNewSection(false)}>Cancel</button>
                  </div>
                </form>
              )}

              <div className="section-list">
                {sections.map((s) => (
                  <div
                    key={s.id}
                    className={`section-item ${activeSection?.id === s.id ? 'active' : ''}`}
                    onClick={() => onSelectSection(s)}
                  >
                    <span className="section-name">{s.name}</span>
                    <span className="section-count">{s.note_count}</span>
                    <button
                      className="delete-btn"
                      onClick={(e) => handleDeleteSection(s.id, e)}
                      title="Delete section"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="sidebar-section tags-section">
            <div className="section-header">
              <span>Tags</span>
            </div>
            <div className="tag-list">
              {tags.map((t) => (
                <span key={t.id} className="tag-badge" style={{ borderColor: t.color, color: t.color }}>
                  {t.name} ({t.usage_count})
                </span>
              ))}
              {tags.length === 0 && <div className="empty-state">No tags yet</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Sidebar;
