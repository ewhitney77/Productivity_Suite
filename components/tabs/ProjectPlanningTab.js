'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Calendar, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { load, save } from '../../lib/storage';

const COLUMNS = [
  { id: 'backlog', label: 'Backlog', color: '#8892A7', borderClass: 'border-t-text-secondary' },
  { id: 'scoping', label: 'Scoping', color: '#7C5CFC', borderClass: 'border-t-accent-purple' },
  { id: 'dev', label: 'Dev', color: '#4ADE80', borderClass: 'border-t-accent-green' },
  { id: 'complete', label: 'Complete', color: '#34D399', borderClass: 'border-t-accent-mint' },
];

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const PRIORITY_COLORS = {
  low: 'text-green-400 bg-green-400/10',
  medium: 'text-yellow-400 bg-yellow-400/10',
  high: 'text-orange-400 bg-orange-400/10',
  urgent: 'text-red-400 bg-red-400/10',
};

function TaskCard({ task, onUpdate, onDelete, onDragStart, onDragEnd }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.currentTarget.classList.add('dragging');
        onDragStart(task.id);
      }}
      onDragEnd={(e) => {
        e.currentTarget.classList.remove('dragging');
        onDragEnd();
      }}
      className={`bg-dark-card border border-dark-border rounded-lg overflow-hidden cursor-grab active:cursor-grabbing
                  priority-${task.priority || 'medium'}`}
    >
      <div className="p-3">
        <div className="flex items-start gap-2 mb-2">
          <GripVertical size={12} className="text-text-muted mt-0.5 shrink-0" />
          <input
            value={task.name}
            onChange={(e) => onUpdate({ ...task, name: e.target.value })}
            placeholder="Task name..."
            className="flex-1 text-sm bg-transparent border-none px-0 py-0 font-medium text-text-primary"
            onClick={(e) => e.stopPropagation()}
          />
          <button onClick={() => onDelete(task.id)} className="text-text-muted hover:text-red-400 shrink-0">
            <Trash2 size={11} />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap ml-5">
          <select value={task.priority || 'medium'}
            onChange={(e) => onUpdate({ ...task, priority: e.target.value })}
            className={`text-[10px] px-1.5 py-0.5 rounded border-none ${PRIORITY_COLORS[task.priority || 'medium']}`}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <div className="flex items-center gap-1">
            <Calendar size={9} className="text-text-muted" />
            <input type="date" value={task.dueDate || ''}
              onChange={(e) => onUpdate({ ...task, dueDate: e.target.value })}
              className="text-[10px] bg-transparent border-none px-0 py-0 text-text-muted w-[90px]" />
          </div>
        </div>

        <button onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary mt-2 ml-5">
          {expanded ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
          Details
        </button>

        {expanded && (
          <div className="mt-2 pt-2 border-t border-dark-border ml-5">
            <textarea value={task.details || ''}
              onChange={(e) => onUpdate({ ...task, details: e.target.value })}
              placeholder="Add details..."
              className="w-full text-xs bg-dark-bg border border-dark-border rounded px-2 py-1 resize-none min-h-[50px]" />
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({ col, tasks, onAddTask, onUpdateTask, onDeleteTask, onDrop, onDragStart, onDragEnd }) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="flex flex-col min-w-[260px] flex-1">
      <div className="flex items-center justify-between px-3 py-2 bg-dark-surface border border-dark-border rounded-t-xl"
        style={{ borderTopColor: col.color, borderTopWidth: '2px' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: `${col.color}18`, color: col.color }}>
            {col.label}
          </span>
          <span className="text-xs text-text-muted">{tasks.length}</span>
        </div>
        <button onClick={() => onAddTask(col.id)} className="text-text-muted hover:text-accent-green transition-colors">
          <Plus size={14} />
        </button>
      </div>

      <div
        className={`flex-1 bg-dark-surface/50 border border-dark-border border-t-0 rounded-b-xl p-2 space-y-2 min-h-[300px] transition-colors
                    ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const taskId = e.dataTransfer.getData('text/plain');
          if (taskId) onDrop(taskId, col.id);
        }}
      >
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <p className="text-xs">Drop items here</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onUpdate={onUpdateTask} onDelete={onDeleteTask}
              onDragStart={onDragStart} onDragEnd={onDragEnd} />
          ))
        )}
      </div>
    </div>
  );
}

export default function ProjectPlanningTab() {
  const [tasks, setTasks] = useState([]);
  const [draggingId, setDraggingId] = useState(null);

  useEffect(() => { setTasks(load('project_planning', [])); }, []);

  const saveTasks = (updated) => { setTasks(updated); save('project_planning', updated); };

  const addTask = (column) => {
    saveTasks([...tasks, {
      id: uuidv4(), name: '', column, priority: 'medium', dueDate: '', details: '',
      createdAt: new Date().toISOString(),
    }]);
  };

  const updateTask = (updatedTask) => { saveTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t)); };
  const deleteTask = (id) => { saveTasks(tasks.filter(t => t.id !== id)); };

  const handleDrop = (taskId, newColumn) => {
    saveTasks(tasks.map(t => t.id === taskId ? { ...t, column: newColumn } : t));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Project Planning</h2>
        <span className="badge badge-green">{tasks.length} items</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '400px' }}>
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            col={col}
            tasks={tasks.filter(t => t.column === col.id)}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onDrop={handleDrop}
            onDragStart={setDraggingId}
            onDragEnd={() => setDraggingId(null)}
          />
        ))}
      </div>
    </div>
  );
}
