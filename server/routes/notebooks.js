const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

// Get all notebooks
router.get('/', (req, res) => {
  const notebooks = db.prepare(`
    SELECT n.*, COUNT(DISTINCT s.id) as section_count,
           COUNT(DISTINCT nt.id) as note_count
    FROM notebooks n
    LEFT JOIN sections s ON s.notebook_id = n.id
    LEFT JOIN notes nt ON nt.section_id = s.id
    GROUP BY n.id
    ORDER BY n.updated_at DESC
  `).all();
  res.json(notebooks);
});

// Get single notebook with sections
router.get('/:id', (req, res) => {
  const notebook = db.prepare('SELECT * FROM notebooks WHERE id = ?').get(req.params.id);
  if (!notebook) return res.status(404).json({ error: 'Notebook not found' });

  const sections = db.prepare(
    'SELECT * FROM sections WHERE notebook_id = ? ORDER BY position'
  ).all(req.params.id);

  res.json({ ...notebook, sections });
});

// Create notebook
router.post('/', (req, res) => {
  const { name, color } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO notebooks (id, name, color) VALUES (?, ?, ?)').run(id, name, color || '#4A90D9');

  // Create a default section
  const sectionId = uuidv4();
  db.prepare('INSERT INTO sections (id, notebook_id, name, position) VALUES (?, ?, ?, 0)').run(sectionId, id, 'General');

  const notebook = db.prepare('SELECT * FROM notebooks WHERE id = ?').get(id);
  res.status(201).json(notebook);
});

// Update notebook
router.put('/:id', (req, res) => {
  const { name, color } = req.body;
  db.prepare("UPDATE notebooks SET name = ?, color = ?, updated_at = datetime('now') WHERE id = ?")
    .run(name, color, req.params.id);
  const notebook = db.prepare('SELECT * FROM notebooks WHERE id = ?').get(req.params.id);
  res.json(notebook);
});

// Delete notebook
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM notebooks WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
