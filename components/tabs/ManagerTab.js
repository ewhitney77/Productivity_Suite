'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus, Trash2, ChevronDown, ChevronRight, CheckCircle2,
  Circle, Clock, ClipboardList, StickyNote, Zap,
  ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { load, save } from '../../lib/storage';
import { getWeekKey, getWeekLabel, getPreviousWeeks, rolloverItems } from '../../lib/weekUtils';

const STATUS_CYCLE = ['open', 'in-progress', 'done'];
const STATUS_ICONS = { 'open': Circle, 'in-progress': Clock, 'done': CheckCircle2 };
const STATUS_COLORS = { 'open': 'text-text-secondary', 'in-progress': 'text-accent-blue', 'done': 'text-green-400' };

function EditableItem({ item, onUpdate, onDelete, fields }) {
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (field) => { setEditing(field); setEditValue(item[field] || ''); };
  const saveEdit = () => {
    if (editing) { onUpdate({ ...item, [editing]: editValue }); setEditing(null); }
  };

  const StatusIcon = STATUS_ICONS[item.status] || Circle;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-dark-card border border-dark-border rounded-lg group">
      {item.status !== undefined && (
        <button
          onClick={() => {
            const idx = STATUS_CYCLE.indexOf(item.status);
            onUpdate({ ...item, status: STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] });
          }}
          className={`shrink-0 ${STATUS_COLORS[item.status]} hover:opacity-70`}
        >
          <StatusIcon size={16} />
        </button>
      )}
      <div className="flex-1 flex items-center gap-3 min-w-0 flex-wrap">
        {fields.map((field) => (
          <div key={field.key} className={`${field.width || 'flex-1'} min-w-0`}>
            {editing === field.key ? (
              field.multiline ? (
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={saveEdit}
                  className="w-full text-sm bg-dark-bg px-2 py-1 rounded resize-none"
                  rows={2}
                  autoFocus
                />
              ) : (
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                  className="w-full text-sm bg-dark-bg px-2 py-1 rounded"
                  autoFocus
                />
              )
            ) : (
              <span
                onClick={() => startEdit(field.key)}
                className={`text-sm cursor-pointer hover:text-accent-blue transition-colors block
                  ${field.key === 'title' ? 'font-medium text-text-primary' : 'text-text-secondary'}
                  ${field.multiline ? '' : 'truncate'}`}
              >
                {item[field.key] || field.placeholder || '—'}
              </span>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={() => onDelete(item.id)}
        className="shrink-0 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function ManagerSection({ title, icon: Icon, storageKey, currentWeek, fields, defaultItem }) {
  const fullKey = `manager_${storageKey}`;
  const [items, setItems] = useState({});
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let loaded = load(fullKey, {});
    const weeks = getPreviousWeeks(2);
    if (weeks.length > 1) {
      loaded = rolloverItems(loaded, weeks[0], weeks[1]);
    }
    setItems(loaded);
  }, [fullKey]);

  const weekItems = items[currentWeek] || [];

  const updateItems = useCallback((newWeekItems) => {
    const updated = { ...items, [currentWeek]: newWeekItems };
    setItems(updated);
    save(fullKey, updated);
  }, [items, currentWeek, fullKey]);

  const addItem = () => {
    updateItems([...weekItems, { id: uuidv4(), ...defaultItem, createdAt: new Date().toISOString() }]);
  };

  const updateItem = (updatedItem) => {
    updateItems(weekItems.map(i => i.id === updatedItem.id ? updatedItem : i));
  };

  const deleteItem = (id) => {
    updateItems(weekItems.filter(i => i.id !== id));
  };

  return (
    <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-dark-hover transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          <Icon size={16} className="text-accent-purple" />
          <h3 className="text-sm font-semibold">{title}</h3>
          <span className="badge badge-purple">{weekItems.length}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); addItem(); }}
          className="flex items-center gap-1 px-2 py-1 text-xs text-accent-purple hover:bg-accent-purple/10 rounded transition-colors"
        >
          <Plus size={12} />
          Add
        </button>
      </div>
      {!collapsed && (
        <div className="px-4 pb-3 space-y-1.5">
          {weekItems.length === 0 ? (
            <p className="text-xs text-text-muted py-3 text-center">No items yet</p>
          ) : (
            weekItems.map((item) => (
              <EditableItem key={item.id} item={item} onUpdate={updateItem} onDelete={deleteItem} fields={fields} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function ManagerTab() {
  const [weekOffset, setWeekOffset] = useState(0);
  const weeks = getPreviousWeeks(20);
  const currentWeek = weeks[weekOffset] || weeks[0];

  return (
    <div className="space-y-6">
      {/* Week selector with history */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekOffset(Math.min(weekOffset + 1, weeks.length - 1))}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-dark-card rounded transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-center">
            <span className="text-sm font-semibold">{getWeekLabel(currentWeek)}</span>
            {weekOffset === 0 && <span className="ml-2 badge badge-green">Current</span>}
          </div>
          <button
            onClick={() => setWeekOffset(Math.max(weekOffset - 1, 0))}
            disabled={weekOffset === 0}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-dark-card rounded transition-colors disabled:opacity-30"
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>
        {/* Week history quick select */}
        <select
          value={weekOffset}
          onChange={(e) => setWeekOffset(Number(e.target.value))}
          className="text-xs bg-dark-card border border-dark-border rounded px-2 py-1"
        >
          {weeks.slice(0, 12).map((w, i) => (
            <option key={w} value={i}>{getWeekLabel(w)}{i === 0 ? ' (Current)' : ''}</option>
          ))}
        </select>
      </div>

      <ManagerSection
        title="Meeting Prep"
        icon={ClipboardList}
        storageKey="meetingprep"
        currentWeek={currentWeek}
        fields={[
          { key: 'title', width: 'flex-[2]', placeholder: 'Meeting topic...' },
          { key: 'date', width: 'w-28', placeholder: 'Date' },
          { key: 'prep', width: 'flex-1', placeholder: 'Prep notes...', multiline: true },
        ]}
        defaultItem={{ title: '', date: '', prep: '', status: 'open' }}
      />

      <ManagerSection
        title="Notes"
        icon={StickyNote}
        storageKey="notes"
        currentWeek={currentWeek}
        fields={[
          { key: 'title', width: 'flex-[2]', placeholder: 'Note title...' },
          { key: 'content', width: 'flex-[3]', placeholder: 'Note content...', multiline: true },
        ]}
        defaultItem={{ title: '', content: '' }}
      />

      <ManagerSection
        title="Action Items"
        icon={Zap}
        storageKey="actions"
        currentWeek={currentWeek}
        fields={[
          { key: 'title', width: 'flex-[2]', placeholder: 'Action item...' },
          { key: 'owner', width: 'w-28', placeholder: 'Owner' },
          { key: 'dueDate', width: 'w-28', placeholder: 'Due date' },
          { key: 'notes', width: 'flex-1', placeholder: 'Notes...' },
        ]}
        defaultItem={{ title: '', owner: '', dueDate: '', status: 'open', notes: '' }}
      />
    </div>
  );
}
