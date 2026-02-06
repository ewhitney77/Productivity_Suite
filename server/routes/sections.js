const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

// Get sections for a notebook
router.get('/notebook/:notebookId', (req, res) => {
  const sections = db.prepare(`
    SELECT s.*, COUNT(n.id) as note_count
    FROM sections s
    LEFT JOIN notes n ON n.section_id = s.id
    WHERE s.notebook_id = ?
    GROUP BY s.id
    ORDER BY s.position
  `).all(req.params.notebookId);
  res.json(sections);
});

// Create section
router.post('/', (req, res) => {
  const { notebook_id, name } = req.body;
  const id = uuidv4();
  const maxPos = db.prepare('SELECT MAX(position) as max FROM sections WHERE notebook_id = ?')
    .get(notebook_id);
  const position = (maxPos.max || 0) + 1;

  db.prepare('INSERT INTO sections (id, notebook_id, name, position) VALUES (?, ?, ?, ?)')
    .run(id, notebook_id, name, position);

  const section = db.prepare('SELECT * FROM sections WHERE id = ?').get(id);
  res.status(201).json(section);
});

// Update section
router.put('/:id', (req, res) => {
  const { name } = req.body;
  db.prepare("UPDATE sections SET name = ?, updated_at = datetime('now') WHERE id = ?")
    .run(name, req.params.id);
  const section = db.prepare('SELECT * FROM sections WHERE id = ?').get(req.params.id);
  res.json(section);
});

// Delete section
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM sections WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
