const express = require('express');
const db = require('../db');

const router = express.Router();

// Full-text search across notes
router.get('/', (req, res) => {
  const { q, tag } = req.query;

  if (q) {
    const notes = db.prepare(`
      SELECT n.*, s.name as section_name, s.notebook_id, nb.name as notebook_name,
             nb.color as notebook_color
      FROM notes_fts fts
      JOIN notes n ON n.rowid = fts.rowid
      JOIN sections s ON s.id = n.section_id
      JOIN notebooks nb ON nb.id = s.notebook_id
      WHERE notes_fts MATCH ?
      ORDER BY rank
      LIMIT 50
    `).all(q + '*');
    res.json(notes);
  } else if (tag) {
    const notes = db.prepare(`
      SELECT n.*, s.name as section_name, s.notebook_id, nb.name as notebook_name,
             nb.color as notebook_color
      FROM notes n
      JOIN note_tags nt ON nt.note_id = n.id
      JOIN tags t ON t.id = nt.tag_id
      JOIN sections s ON s.id = n.section_id
      JOIN notebooks nb ON nb.id = s.notebook_id
      WHERE t.id = ?
      ORDER BY n.updated_at DESC
      LIMIT 50
    `).all(tag);
    res.json(notes);
  } else {
    res.json([]);
  }
});

module.exports = router;
