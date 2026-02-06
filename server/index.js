const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const notebooksRouter = require('./routes/notebooks');
const sectionsRouter = require('./routes/sections');
const notesRouter = require('./routes/notes');
const tagsRouter = require('./routes/tags');
const searchRouter = require('./routes/search');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api/notebooks', notebooksRouter);
app.use('/api/sections', sectionsRouter);
app.use('/api/notes', notesRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/search', searchRouter);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
