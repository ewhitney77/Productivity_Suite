'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus, Trash2, ChevronDown, ChevronRight, Edit3, Check, X,
  FolderOpen, Users, BarChart
} from 'lucide-react';
import { load, save } from '../../lib/storage';

const STAGES = ['discovery', 'scoping', 'in-progress', 'review', 'complete'];
const STAGE_COLORS = {
  'discovery': 'badge-purple',
  'scoping': 'badge-yellow',
  'in-progress': 'badge-blue',
  'review': 'badge-yellow',
  'complete': 'badge-green',
};

export default function ProjectScopingTab() {
  const [projects, setProjects] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    setProjects(load('project_scoping', []));
  }, []);

  const saveProjects = (updated) => {
    setProjects(updated);
    save('project_scoping', updated);
  };

  const addProject = () => {
    const newProject = {
      id: uuidv4(),
      name: 'New Project',
      stage: 'discovery',
      team: '',
      analyst: '',
      scope: '',
      notes: '',
      createdAt: new Date().toISOString(),
    };
    saveProjects([newProject, ...projects]);
    setExpandedId(newProject.id);
  };

  const updateProject = (id, field, value) => {
    saveProjects(projects.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const deleteProject = (id) => {
    saveProjects(projects.filter(p => p.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const startEdit = (id, field) => {
    const project = projects.find(p => p.id === id);
    setEditingField(`${id}-${field}`);
    setEditValue(project[field] || '');
  };

  const saveEdit = (id, field) => {
    updateProject(id, field, editValue);
    setEditingField(null);
  };

  const renderEditableField = (project, field, placeholder, multiline = false) => {
    const key = `${project.id}-${field}`;
    if (editingField === key) {
      return multiline ? (
        <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => saveEdit(project.id, field)}
          className="w-full text-sm bg-dark-bg px-2 py-1 rounded resize-none" rows={3} autoFocus />
      ) : (
        <input value={editValue} onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => saveEdit(project.id, field)}
          onKeyDown={(e) => e.key === 'Enter' && saveEdit(project.id, field)}
          className="w-full text-sm bg-dark-bg px-2 py-1 rounded" autoFocus />
      );
    }
    return (
      <span onClick={() => startEdit(project.id, field)}
        className="text-sm text-text-secondary cursor-pointer hover:text-accent-blue block">
        {project[field] || placeholder}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen size={20} className="text-accent-blue" />
          <h2 className="text-lg font-semibold">Open Projects</h2>
          <span className="badge badge-blue">{projects.length}</span>
        </div>
        <button onClick={addProject}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-accent-blue bg-accent-blue/10
                   border border-accent-blue/30 rounded-lg hover:bg-accent-blue/20 transition-colors">
          <Plus size={14} /> New Project
        </button>
      </div>

      {/* Summary table header */}
      <div className="hidden lg:grid grid-cols-12 gap-3 px-4 text-xs text-text-muted font-medium uppercase tracking-wider">
        <div className="col-span-3">Project</div>
        <div className="col-span-2">Stage</div>
        <div className="col-span-2">Team</div>
        <div className="col-span-2">Analyst</div>
        <div className="col-span-3">Notes</div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          <FolderOpen size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">No projects yet</p>
          <p className="text-xs text-text-muted mt-1">Click "New Project" to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((project) => (
            <div key={project.id} className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden group">
              {/* Row */}
              <div className="grid grid-cols-12 gap-3 px-4 py-3 items-center cursor-pointer hover:bg-dark-hover transition-colors"
                onClick={() => setExpandedId(expandedId === project.id ? null : project.id)}>
                <div className="col-span-3 flex items-center gap-2">
                  {expandedId === project.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  {editingField === `${project.id}-name` ? (
                    <input value={editValue} onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveEdit(project.id, 'name')}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(project.id, 'name')}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 text-sm bg-dark-bg px-2 py-1 rounded font-medium" autoFocus />
                  ) : (
                    <span onClick={(e) => { e.stopPropagation(); startEdit(project.id, 'name'); }}
                      className="text-sm font-medium text-text-primary hover:text-accent-blue truncate">
                      {project.name}
                    </span>
                  )}
                </div>
                <div className="col-span-2">
                  <select value={project.stage}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateProject(project.id, 'stage', e.target.value)}
                    className="text-xs bg-dark-bg border-none rounded px-2 py-1">
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2" onClick={(e) => e.stopPropagation()}>
                  {renderEditableField(project, 'team', 'Team...')}
                </div>
                <div className="col-span-2" onClick={(e) => e.stopPropagation()}>
                  {renderEditableField(project, 'analyst', 'Analyst...')}
                </div>
                <div className="col-span-2" onClick={(e) => e.stopPropagation()}>
                  <span className="text-xs text-text-muted truncate block">
                    {project.notes ? project.notes.substring(0, 50) + '...' : '—'}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                    className="text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === project.id && (
                <div className="px-4 pb-4 pt-2 border-t border-dark-border space-y-3">
                  <div>
                    <label className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1 block">Scope</label>
                    {renderEditableField(project, 'scope', 'Define project scope...', true)}
                  </div>
                  <div>
                    <label className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1 block">Notes</label>
                    {renderEditableField(project, 'notes', 'Add project notes...', true)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                    <span className={`badge ${STAGE_COLORS[project.stage]}`}>{project.stage}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
