const BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Notebooks
  getNotebooks: () => request('/notebooks'),
  getNotebook: (id) => request(`/notebooks/${id}`),
  createNotebook: (data) => request('/notebooks', { method: 'POST', body: data }),
  updateNotebook: (id, data) => request(`/notebooks/${id}`, { method: 'PUT', body: data }),
  deleteNotebook: (id) => request(`/notebooks/${id}`, { method: 'DELETE' }),

  // Sections
  getSections: (notebookId) => request(`/sections/notebook/${notebookId}`),
  createSection: (data) => request('/sections', { method: 'POST', body: data }),
  updateSection: (id, data) => request(`/sections/${id}`, { method: 'PUT', body: data }),
  deleteSection: (id) => request(`/sections/${id}`, { method: 'DELETE' }),

  // Notes
  getNotes: (sectionId) => request(`/notes/section/${sectionId}`),
  getNote: (id) => request(`/notes/${id}`),
  createNote: (data) => request('/notes', { method: 'POST', body: data }),
  updateNote: (id, data) => request(`/notes/${id}`, { method: 'PUT', body: data }),
  deleteNote: (id) => request(`/notes/${id}`, { method: 'DELETE' }),
  addTag: (noteId, tagId) => request(`/notes/${noteId}/tags`, { method: 'POST', body: { tag_id: tagId } }),
  removeTag: (noteId, tagId) => request(`/notes/${noteId}/tags/${tagId}`, { method: 'DELETE' }),

  // Tags
  getTags: () => request('/tags'),
  createTag: (data) => request('/tags', { method: 'POST', body: data }),
  deleteTag: (id) => request(`/tags/${id}`, { method: 'DELETE' }),

  // Search
  search: (query) => request(`/search?q=${encodeURIComponent(query)}`),
  searchByTag: (tagId) => request(`/search?tag=${tagId}`),
};
