import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../api';
import './NoteEditor.css';

function NoteEditor({ note, onUpdateNote, tags, onRefreshTags, onRefreshNotes }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#4A90D9');
  const saveTimer = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setIsPreview(false);
    }
  }, [note?.id]); // eslint-disable-line

  const saveNote = useCallback((newTitle, newContent) => {
    if (!note) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onUpdateNote(note.id, { title: newTitle, content: newContent });
    }, 500);
  }, [note, onUpdateNote]);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    saveNote(e.target.value, content);
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    saveNote(title, e.target.value);
  };

  const handleTogglePin = () => {
    if (!note) return;
    onUpdateNote(note.id, { is_pinned: note.is_pinned ? 0 : 1 });
  };

  const handleAddTag = async (tagId) => {
    if (!note) return;
    await api.addTag(note.id, tagId);
    onRefreshNotes();
    onRefreshTags();
  };

  const handleRemoveTag = async (tagId) => {
    if (!note) return;
    await api.removeTag(note.id, tagId);
    onRefreshNotes();
    onRefreshTags();
  };

  const handleCreateAndAddTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim() || !note) return;
    const tag = await api.createTag({ name: newTagName, color: newTagColor });
    await api.addTag(note.id, tag.id);
    setNewTagName('');
    onRefreshTags();
    onRefreshNotes();
  };

  const insertMarkdown = (syntax) => {
    const textarea = contentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    let newText;

    switch (syntax) {
      case 'bold':
        newText = content.substring(0, start) + `**${selected || 'bold text'}**` + content.substring(end);
        break;
      case 'italic':
        newText = content.substring(0, start) + `*${selected || 'italic text'}*` + content.substring(end);
        break;
      case 'heading':
        newText = content.substring(0, start) + `## ${selected || 'Heading'}` + content.substring(end);
        break;
      case 'list':
        newText = content.substring(0, start) + `\n- ${selected || 'List item'}` + content.substring(end);
        break;
      case 'checklist':
        newText = content.substring(0, start) + `\n- [ ] ${selected || 'Task'}` + content.substring(end);
        break;
      case 'code':
        newText = content.substring(0, start) + `\`${selected || 'code'}\`` + content.substring(end);
        break;
      case 'codeblock':
        newText = content.substring(0, start) + `\n\`\`\`\n${selected || 'code block'}\n\`\`\`\n` + content.substring(end);
        break;
      case 'link':
        newText = content.substring(0, start) + `[${selected || 'text'}](url)` + content.substring(end);
        break;
      case 'quote':
        newText = content.substring(0, start) + `\n> ${selected || 'quote'}` + content.substring(end);
        break;
      case 'divider':
        newText = content.substring(0, start) + '\n---\n' + content.substring(end);
        break;
      default:
        return;
    }

    setContent(newText);
    saveNote(title, newText);
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); insertMarkdown('bold'); }
      if (e.key === 'i') { e.preventDefault(); insertMarkdown('italic'); }
      if (e.key === 'e') { e.preventDefault(); setIsPreview(!isPreview); }
    }
    // Tab handling for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = contentRef.current;
      const start = textarea.selectionStart;
      const newText = content.substring(0, start) + '  ' + content.substring(textarea.selectionEnd);
      setContent(newText);
      saveNote(title, newText);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  if (!note) {
    return (
      <div className="note-editor empty">
        <div className="empty-editor-message">
          <h2>Welcome to Productivity Suite</h2>
          <p>Select a note to start editing, or create a new one.</p>
          <div className="shortcuts-help">
            <h3>Keyboard Shortcuts</h3>
            <div className="shortcut-item"><kbd>Ctrl+B</kbd> Bold</div>
            <div className="shortcut-item"><kbd>Ctrl+I</kbd> Italic</div>
            <div className="shortcut-item"><kbd>Ctrl+E</kbd> Toggle Preview</div>
            <div className="shortcut-item"><kbd>Tab</kbd> Indent</div>
          </div>
        </div>
      </div>
    );
  }

  const noteTags = note.tags || [];

  return (
    <div className="note-editor">
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <button className="toolbar-btn" onClick={() => insertMarkdown('bold')} title="Bold (Ctrl+B)"><b>B</b></button>
          <button className="toolbar-btn" onClick={() => insertMarkdown('italic')} title="Italic (Ctrl+I)"><i>I</i></button>
          <button className="toolbar-btn" onClick={() => insertMarkdown('heading')} title="Heading">H</button>
          <span className="toolbar-divider" />
          <button className="toolbar-btn" onClick={() => insertMarkdown('list')} title="List">&#x2022;</button>
          <button className="toolbar-btn" onClick={() => insertMarkdown('checklist')} title="Checklist">&#x2611;</button>
          <button className="toolbar-btn" onClick={() => insertMarkdown('quote')} title="Quote">&ldquo;</button>
          <span className="toolbar-divider" />
          <button className="toolbar-btn" onClick={() => insertMarkdown('code')} title="Inline Code">&lt;/&gt;</button>
          <button className="toolbar-btn" onClick={() => insertMarkdown('codeblock')} title="Code Block">&#x2337;</button>
          <button className="toolbar-btn" onClick={() => insertMarkdown('link')} title="Link">&#x1f517;</button>
          <button className="toolbar-btn" onClick={() => insertMarkdown('divider')} title="Divider">&mdash;</button>
        </div>
        <div className="toolbar-right">
          <button
            className={`toolbar-btn pin-btn ${note.is_pinned ? 'active' : ''}`}
            onClick={handleTogglePin}
            title={note.is_pinned ? 'Unpin' : 'Pin'}
          >
            &#x1f4cc;
          </button>
          <button
            className="toolbar-btn tag-btn"
            onClick={() => setShowTagMenu(!showTagMenu)}
            title="Tags"
          >
            &#x1f3f7;
          </button>
          <button
            className={`toolbar-btn preview-btn ${isPreview ? 'active' : ''}`}
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

      {/* Tags bar */}
      <div className="editor-tags">
        {noteTags.map((t) => (
          <span key={t.id} className="editor-tag" style={{ borderColor: t.color, color: t.color }}>
            {t.name}
            <button className="remove-tag-btn" onClick={() => handleRemoveTag(t.id)}>&times;</button>
          </span>
        ))}
        {showTagMenu && (
          <div className="tag-menu">
            <div className="tag-menu-header">Add Tag</div>
            <div className="tag-menu-list">
              {tags.filter((t) => !noteTags.find((nt) => nt.id === t.id)).map((t) => (
                <button key={t.id} className="tag-menu-item" onClick={() => handleAddTag(t.id)}>
                  <span className="tag-menu-dot" style={{ background: t.color }} />
                  {t.name}
                </button>
              ))}
            </div>
            <form onSubmit={handleCreateAndAddTag} className="tag-menu-new">
              <input
                type="text"
                placeholder="New tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
              />
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="tag-color-input"
              />
              <button type="submit" className="btn-primary">Add</button>
            </form>
          </div>
        )}
      </div>

      {/* Title */}
      <input
        className="editor-title"
        value={title}
        onChange={handleTitleChange}
        placeholder="Note title"
      />

      {/* Content */}
      {isPreview ? (
        <div className="editor-preview markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          ref={contentRef}
          className="editor-content"
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          placeholder="Start writing... (Supports Markdown)"
        />
      )}

      {/* Status bar */}
      <div className="editor-status">
        <span>{content.split(/\s+/).filter(Boolean).length} words</span>
        <span>{content.length} characters</span>
        <span>Last saved: {note.updated_at ? new Date(note.updated_at + 'Z').toLocaleString() : 'Never'}</span>
      </div>
    </div>
  );
}

export default NoteEditor;
