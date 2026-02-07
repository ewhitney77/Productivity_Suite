'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react';
import { load, save } from '../../lib/storage';

const STAGES = ['discovery', 'scoping', 'in-progress', 'review', 'complete'];
const STAGE_COLORS = {
  'discovery': 'badge-purple',
  'scoping': 'badge-yellow',
  'in-progress': 'badge-green',
  'review': 'badge-yellow',
  'complete': 'badge-mint',
};

export default function ProjectScopingTab() {
  const [projects, setProjects] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { setProjects(load('project_scoping', [])); }, []);

  const saveProjects = (updated) => { setProjects(updated); save('project_scoping', updated); };

  const addProject = () => {
    const p = {
      id: uuidv4(), name: '', stage: 'discovery', team: '', analyst: '', scope: '', notes: '',
      createdAt: new Date().toISOString(),
    };
    saveProjects([p, ...projects]);
    setExpandedId(p.id);
  };

  const updateProject = (id, field, value) => {
    saveProjects(projects.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const deleteProject = (id) => {
    saveProjects(projects.filter(p => p.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen size={18} className="text-accent-green" />
          <h2 className="text-base font-semibold">Open Projects</h2>
          <span className="badge badge-green">{projects.length}</span>
        </div>
        <button onClick={addProject}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-accent-green bg-accent-green/10
                   border border-accent-green/30 rounded-lg hover:bg-accent-green/20 transition-colors">
          <Plus size={14} /> New Project
        </button>
      </div>

      <div className="hidden lg:grid grid-cols-12 gap-3 px-4 text-[10px] text-text-muted font-medium uppercase tracking-wider">
        <div className="col-span-3">Project</div>
        <div className="col-span-2">Stage</div>
        <div className="col-span-2">Team</div>
        <div className="col-span-2">Analyst</div>
        <div className="col-span-3">Notes</div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          <FolderOpen size={36} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">No projects yet</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {projects.map((project) => (
            <div key={project.id} className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden group">
              <div className="grid grid-cols-12 gap-3 px-4 py-2.5 items-center cursor-pointer hover:bg-dark-hover transition-colors"
                onClick={() => setExpandedId(expandedId === project.id ? null : project.id)}>
                <div className="col-span-3 flex items-center gap-2">
                  {expandedId === project.id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <input value={project.name} onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateProject(project.id, 'name', e.target.value)}
                    placeholder="Project name..."
                    className="flex-1 text-sm bg-transparent border-none px-0 py-0 font-medium text-text-primary" />
                </div>
                <div className="col-span-2" onClick={(e) => e.stopPropagation()}>
                  <select value={project.stage} onChange={(e) => updateProject(project.id, 'stage', e.target.value)}
                    className="text-xs bg-dark-bg border-none rounded px-2 py-1">
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2" onClick={(e) => e.stopPropagation()}>
                  <input value={project.team} onChange={(e) => updateProject(project.id, 'team', e.target.value)}
                    placeholder="Team..." className="w-full text-sm bg-transparent border-none px-0 py-0 text-text-secondary" />
                </div>
                <div className="col-span-2" onClick={(e) => e.stopPropagation()}>
                  <input value={project.analyst} onChange={(e) => updateProject(project.id, 'analyst', e.target.value)}
                    placeholder="Analyst..." className="w-full text-sm bg-transparent border-none px-0 py-0 text-text-secondary" />
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-text-muted truncate block">{project.notes ? project.notes.substring(0, 40) : '...'}</span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                    className="text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {expandedId === project.id && (
                <div className="px-4 pb-4 pt-2 border-t border-dark-border space-y-3">
                  <div>
                    <label className="text-[10px] text-text-muted font-medium uppercase tracking-wider mb-1 block">Scope</label>
                    <textarea value={project.scope} onChange={(e) => updateProject(project.id, 'scope', e.target.value)}
                      placeholder="Define project scope..."
                      className="w-full text-sm bg-dark-bg border border-dark-border rounded-lg px-3 py-2 resize-y min-h-[60px]" />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted font-medium uppercase tracking-wider mb-1 block">Notes</label>
                    <textarea value={project.notes} onChange={(e) => updateProject(project.id, 'notes', e.target.value)}
                      placeholder="Add project notes..."
                      className="w-full text-sm bg-dark-bg border border-dark-border rounded-lg px-3 py-2 resize-y min-h-[60px]" />
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
