'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus, Trash2, GripVertical, Calendar, Flag, FileText,
  ChevronDown, ChevronRight, MoreHorizontal
} from 'lucide-react';
import { load, save } from '../../lib/storage';

const COLUMNS = [
  { id: 'backlog', label: 'Backlog', color: 'border-text-muted', bgLabel: 'bg-text-muted/10 text-text-secondary' },
  { id: 'scoping', label: 'Scoping', color: 'border-accent-purple', bgLabel: 'bg-accent-purple/10 text-accent-purple' },
  { id: 'dev', label: 'Dev', color: 'border-accent-blue', bgLabel: 'bg-accent-blue/10 text-accent-blue' },
  { id: 'complete', label: 'Complete', color: 'border-green-500', bgLabel: 'bg-green-500/10 text-green-400' },
];

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const PRIORITY_COLORS = {
  low: 'text-green-400 bg-green-400/10',
  medium: 'text-yellow-400 bg-yellow-400/10',
  high: 'text-orange-400 bg-orange-400/10',
  urgent: 'text-red-400 bg-red-400/10',
};

function TaskCard({ task, onUpdate, onDelete, onMove }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (field) => { setEditing(field); setEditValue(task[field] || ''); };
  const saveEdit = () => {
    if (editing) { onUpdate({ ...task, [editing]: editValue }); setEditing(null); }
  };

  const colIdx = COLUMNS.findIndex(c => c.id === task.column);

  return (
    <div className={`bg-dark-card border border-dark-border rounded-lg overflow-hidden
                    priority-${task.priority || 'medium'}`}>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          {editing === 'name' ? (
            <input value={editValue} onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveEdit} onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
              className="flex-1 text-sm bg-dark-bg px-2 py-1 rounded font-medium" autoFocus />
          ) : (
            <span onClick={() => startEdit('name')}
              className="text-sm font-medium text-text-primary cursor-pointer hover:text-accent-blue flex-1">
              {task.name || 'Untitled task'}
            </span>
          )}
          <button onClick={() => onDelete(task.id)}
            className="text-text-muted hover:text-red-400 shrink-0">
            <Trash2 size={12} />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority */}
          <select value={task.priority || 'medium'}
            onChange={(e) => onUpdate({ ...task, priority: e.target.value })}
            className={`text-xs px-1.5 py-0.5 rounded border-none ${PRIORITY_COLORS[task.priority || 'medium']}`}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {/* Due date */}
          {editing === 'dueDate' ? (
            <input type="date" value={editValue} onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveEdit} className="text-xs bg-dark-bg px-1.5 py-0.5 rounded" autoFocus />
          ) : (
            <span onClick={() => startEdit('dueDate')}
              className="flex items-center gap-1 text-xs text-text-muted cursor-pointer hover:text-accent-blue">
              <Calendar size={10} />
              {task.dueDate || 'No date'}
            </span>
          )}
        </div>

        {/* Details toggle */}
        <button onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mt-2">
          {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          Details
        </button>

        {expanded && (
          <div className="mt-2 pt-2 border-t border-dark-border">
            {editing === 'details' ? (
              <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)}
                onBlur={saveEdit} className="w-full text-xs bg-dark-bg px-2 py-1 rounded resize-none" rows={3} autoFocus />
            ) : (
              <p onClick={() => startEdit('details')}
                className="text-xs text-text-secondary cursor-pointer hover:text-accent-blue">
                {task.details || 'Click to add details...'}
              </p>
            )}
          </div>
        )}

        {/* Move buttons */}
        <div className="flex items-center gap-1 mt-2">
          {colIdx > 0 && (
            <button onClick={() => onMove(task.id, COLUMNS[colIdx - 1].id)}
              className="text-xs px-2 py-0.5 text-text-muted hover:text-text-primary bg-dark-bg rounded">
              ← {COLUMNS[colIdx - 1].label}
            </button>
          )}
          {colIdx < COLUMNS.length - 1 && (
            <button onClick={() => onMove(task.id, COLUMNS[colIdx + 1].id)}
              className="text-xs px-2 py-0.5 text-text-muted hover:text-text-primary bg-dark-bg rounded ml-auto">
              {COLUMNS[colIdx + 1].label} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProjectPlanningTab() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    setTasks(load('project_planning', []));
  }, []);

  const saveTasks = (updated) => {
    setTasks(updated);
    save('project_planning', updated);
  };

  const addTask = (column) => {
    const newTask = {
      id: uuidv4(),
      name: '',
      column,
      priority: 'medium',
      dueDate: '',
      details: '',
      createdAt: new Date().toISOString(),
    };
    saveTasks([...tasks, newTask]);
  };

  const updateTask = (updatedTask) => {
    saveTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const deleteTask = (id) => {
    saveTasks(tasks.filter(t => t.id !== id));
  };

  const moveTask = (id, newColumn) => {
    saveTasks(tasks.map(t => t.id === id ? { ...t, column: newColumn } : t));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText size={20} className="text-accent-blue" />
        <h2 className="text-lg font-semibold">Project Planning</h2>
        <span className="badge badge-blue">{tasks.length} items</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter(t => t.column === col.id);
          return (
            <div key={col.id} className="flex flex-col">
              {/* Column header */}
              <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl border-t-2 ${col.color}
                             bg-dark-surface border border-dark-border border-t-0`}>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${col.bgLabel}`}>
                    {col.label}
                  </span>
                  <span className="text-xs text-text-muted">{colTasks.length}</span>
                </div>
                <button onClick={() => addTask(col.id)}
                  className="text-text-muted hover:text-accent-blue transition-colors">
                  <Plus size={14} />
                </button>
              </div>

              {/* Column body */}
              <div className="flex-1 bg-dark-surface/50 border border-dark-border border-t-0 rounded-b-xl p-2 space-y-2 kanban-col">
                {colTasks.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">
                    <p className="text-xs">No items</p>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onUpdate={updateTask}
                      onDelete={deleteTask} onMove={moveTask} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
