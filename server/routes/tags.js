const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

// Get all tags
router.get('/', (req, res) => {
  const tags = db.prepare(`
    SELECT t.*, COUNT(nt.note_id) as usage_count
    FROM tags t
    LEFT JOIN note_tags nt ON nt.tag_id = t.id
    GROUP BY t.id
    ORDER BY t.name
  `).all();
  res.json(tags);
});

// Create tag
router.post('/', (req, res) => {
  const { name, color } = req.body;
  const id = uuidv4();
  try {
    db.prepare('INSERT INTO tags (id, name, color) VALUES (?, ?, ?)').run(id, name, color || '#888888');
    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
    res.status(201).json(tag);
  } catch (e) {
    const existing = db.prepare('SELECT * FROM tags WHERE name = ?').get(name);
    res.json(existing);
  }
});

// Delete tag
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
