import React from 'react';
import './SearchResults.css';

function SearchResults({ results, query, onSelectNote }) {
  return (
    <div className="search-results">
      <div className="search-results-header">
        <h2>Search Results</h2>
        <span className="search-results-count">
          {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
        </span>
      </div>
      <div className="search-results-list">
        {results.map((note) => (
          <div key={note.id} className="search-result-item" onClick={() => onSelectNote(note)}>
            <div className="search-result-path">
              <span className="search-result-notebook" style={{ color: note.notebook_color }}>
                {note.notebook_name}
              </span>
              <span className="search-result-separator">/</span>
              <span className="search-result-section">{note.section_name}</span>
            </div>
            <div className="search-result-title">{note.title}</div>
            <div className="search-result-preview">
              {(note.content || '').substring(0, 200)}
            </div>
          </div>
        ))}
        {results.length === 0 && (
          <div className="search-results-empty">
            No notes found matching "{query}"
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchResults;
