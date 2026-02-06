import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import SearchResults from './components/SearchResults';
import { api } from './api';
import './App.css';

function App() {
  const [notebooks, setNotebooks] = useState([]);
  const [activeNotebook, setActiveNotebook] = useState(null);
  const [sections, setSections] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [tags, setTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load notebooks and tags on mount
  useEffect(() => {
    api.getNotebooks().then(setNotebooks);
    api.getTags().then(setTags);
  }, []);

  // Load sections when notebook changes
  useEffect(() => {
    if (activeNotebook) {
      api.getSections(activeNotebook.id).then((s) => {
        setSections(s);
        if (s.length > 0 && !activeSection) {
          setActiveSection(s[0]);
        }
      });
    } else {
      setSections([]);
      setActiveSection(null);
    }
  }, [activeNotebook]); // eslint-disable-line

  // Load notes when section changes
  useEffect(() => {
    if (activeSection) {
      api.getNotes(activeSection.id).then((n) => {
        setNotes(n);
        if (n.length > 0) setActiveNote(n[0]);
        else setActiveNote(null);
      });
    } else {
      setNotes([]);
      setActiveNote(null);
    }
  }, [activeSection]);

  const refreshNotebooks = useCallback(() => {
    api.getNotebooks().then(setNotebooks);
  }, []);

  const refreshNotes = useCallback(() => {
    if (activeSection) {
      api.getNotes(activeSection.id).then(setNotes);
    }
  }, [activeSection]);

  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await api.search(query);
      setSearchResults(results);
    } else {
      setSearchResults(null);
    }
  }, []);

  const handleSelectNotebook = (notebook) => {
    setActiveNotebook(notebook);
    setActiveSection(null);
    setActiveNote(null);
    setSearchResults(null);
    setSearchQuery('');
  };

  const handleSelectSection = (section) => {
    setActiveSection(section);
    setActiveNote(null);
  };

  const handleCreateNote = async () => {
    if (!activeSection) return;
    const note = await api.createNote({
      section_id: activeSection.id,
      title: 'Untitled',
      content: '',
    });
    setNotes((prev) => [note, ...prev]);
    setActiveNote(note);
  };

  const handleUpdateNote = async (id, data) => {
    const updated = await api.updateNote(id, data);
    setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    setActiveNote(updated);
  };

  const handleDeleteNote = async (id) => {
    await api.deleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNote?.id === id) setActiveNote(null);
  };

  const handleNavigateToNote = async (note) => {
    // Navigate from search result to the actual note
    const section = { id: note.section_id, name: note.section_name, notebook_id: note.notebook_id };
    const notebook = { id: note.notebook_id, name: note.notebook_name, color: note.notebook_color };
    setActiveNotebook(notebook);
    setActiveSection(section);
    setSearchResults(null);
    setSearchQuery('');
    const fullNote = await api.getNote(note.id);
    setActiveNote(fullNote);
  };

  return (
    <div className="app">
      <Sidebar
        notebooks={notebooks}
        activeNotebook={activeNotebook}
        onSelectNotebook={handleSelectNotebook}
        onRefreshNotebooks={refreshNotebooks}
        sections={sections}
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        tags={tags}
        onRefreshTags={() => api.getTags().then(setTags)}
        searchQuery={searchQuery}
        onSearch={handleSearch}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {searchResults ? (
        <SearchResults
          results={searchResults}
          query={searchQuery}
          onSelectNote={handleNavigateToNote}
        />
      ) : (
        <>
          <NoteList
            notes={notes}
            activeNote={activeNote}
            onSelectNote={setActiveNote}
            onCreateNote={handleCreateNote}
            onDeleteNote={handleDeleteNote}
            sectionName={activeSection?.name}
            notebookName={activeNotebook?.name}
          />
          <NoteEditor
            note={activeNote}
            onUpdateNote={handleUpdateNote}
            tags={tags}
            onRefreshTags={() => api.getTags().then(setTags)}
            onRefreshNotes={refreshNotes}
          />
        </>
      )}
    </div>
  );
}

export default App;
