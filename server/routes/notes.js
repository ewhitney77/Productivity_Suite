const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

// Get notes for a section
router.get('/section/:sectionId', (req, res) => {
  const notes = db.prepare(`
    SELECT n.*, GROUP_CONCAT(t.name) as tag_names, GROUP_CONCAT(t.id) as tag_ids,
           GROUP_CONCAT(t.color) as tag_colors
    FROM notes n
    LEFT JOIN note_tags nt ON nt.note_id = n.id
    LEFT JOIN tags t ON t.id = nt.tag_id
    WHERE n.section_id = ?
    GROUP BY n.id
    ORDER BY n.is_pinned DESC, n.updated_at DESC
  `).all(req.params.sectionId);

  const result = notes.map(note => ({
    ...note,
    tags: note.tag_names ? note.tag_names.split(',').map((name, i) => ({
      id: note.tag_ids.split(',')[i],
      name,
      color: note.tag_colors.split(',')[i]
    })) : []
  }));

  res.json(result);
});

// Get single note
router.get('/:id', (req, res) => {
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });

  const tags = db.prepare(`
    SELECT t.* FROM tags t
    JOIN note_tags nt ON nt.tag_id = t.id
    WHERE nt.note_id = ?
  `).all(req.params.id);

  res.json({ ...note, tags });
});

// Create note
router.post('/', (req, res) => {
  const { section_id, title, content } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO notes (id, section_id, title, content) VALUES (?, ?, ?, ?)')
    .run(id, section_id, title || 'Untitled', content || '');

  // Update parent timestamps
  db.prepare("UPDATE sections SET updated_at = datetime('now') WHERE id = ?").run(section_id);
  const section = db.prepare('SELECT notebook_id FROM sections WHERE id = ?').get(section_id);
  if (section) {
    db.prepare("UPDATE notebooks SET updated_at = datetime('now') WHERE id = ?").run(section.notebook_id);
  }

  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
  res.status(201).json({ ...note, tags: [] });
});

// Update note
router.put('/:id', (req, res) => {
  const { title, content, is_pinned } = req.body;
  const existing = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Note not found' });

  db.prepare(`
    UPDATE notes SET title = ?, content = ?, is_pinned = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title !== undefined ? title : existing.title,
    content !== undefined ? content : existing.content,
    is_pinned !== undefined ? is_pinned : existing.is_pinned,
    req.params.id
  );

  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  const tags = db.prepare(`
    SELECT t.* FROM tags t JOIN note_tags nt ON nt.tag_id = t.id WHERE nt.note_id = ?
  `).all(req.params.id);
  res.json({ ...note, tags });
});

// Add tag to note
router.post('/:id/tags', (req, res) => {
  const { tag_id } = req.body;
  try {
    db.prepare('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)').run(req.params.id, tag_id);
  } catch (e) {
    // Already exists, ignore
  }
  const tags = db.prepare(`
    SELECT t.* FROM tags t JOIN note_tags nt ON nt.tag_id = t.id WHERE nt.note_id = ?
  `).all(req.params.id);
  res.json(tags);
});

// Remove tag from note
router.delete('/:id/tags/:tagId', (req, res) => {
  db.prepare('DELETE FROM note_tags WHERE note_id = ? AND tag_id = ?').run(req.params.id, req.params.tagId);
  res.status(204).end();
});

// Delete note
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
