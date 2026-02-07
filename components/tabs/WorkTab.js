'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus, Trash2, ChevronDown, ChevronRight, CheckCircle2,
  Circle, Clock, AlertCircle, Bug, MessageSquare, Phone,
  ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { load, save } from '../../lib/storage';
import { getWeekKey, getWeekLabel, getPreviousWeeks, rolloverItems } from '../../lib/weekUtils';

const JIRA_STATUSES = ['open', 'in-progress', 'blocked', 'done'];
const STATUS_ICONS = {
  'open': Circle,
  'in-progress': Clock,
  'blocked': AlertCircle,
  'done': CheckCircle2,
};
const STATUS_COLORS = {
  'open': 'text-text-secondary',
  'in-progress': 'text-accent-blue',
  'blocked': 'text-red-400',
  'done': 'text-green-400',
};

function ItemRow({ item, onUpdate, onDelete, fields }) {
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (field) => {
    setEditing(field);
    setEditValue(item[field] || '');
  };

  const saveEdit = () => {
    if (editing) {
      onUpdate({ ...item, [editing]: editValue });
      setEditing(null);
    }
  };

  const StatusIcon = STATUS_ICONS[item.status] || Circle;

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 bg-dark-card border border-dark-border rounded-lg group
                    ${item.rolledOver ? 'border-l-2 border-l-yellow-500/50' : ''}`}>
      {item.status !== undefined && (
        <button
          onClick={() => {
            const idx = JIRA_STATUSES.indexOf(item.status);
            const next = JIRA_STATUSES[(idx + 1) % JIRA_STATUSES.length];
            onUpdate({ ...item, status: next });
          }}
          className={`shrink-0 ${STATUS_COLORS[item.status] || 'text-text-secondary'} hover:opacity-70`}
          title={item.status}
        >
          <StatusIcon size={16} />
        </button>
      )}

      <div className="flex-1 flex items-center gap-3 min-w-0 flex-wrap">
        {fields.map((field) => (
          <div key={field.key} className={`${field.width || 'flex-1'} min-w-0`}>
            {editing === field.key ? (
              <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                className="w-full text-sm bg-dark-bg px-2 py-1 rounded"
                autoFocus
              />
            ) : (
              <span
                onClick={() => startEdit(field.key)}
                className={`text-sm cursor-pointer hover:text-accent-blue transition-colors truncate block
                  ${field.key === 'title' ? 'font-medium text-text-primary' : 'text-text-secondary'}`}
              >
                {item[field.key] || field.placeholder || '—'}
              </span>
            )}
          </div>
        ))}
      </div>

      {item.rolledOver && (
        <span className="badge badge-yellow shrink-0">carried</span>
      )}

      <button
        onClick={() => onDelete(item.id)}
        className="shrink-0 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function Section({ title, icon: Icon, storageKey, tabId, currentWeek, fields, defaultItem }) {
  const fullKey = `${tabId}_${storageKey}`;
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
    const newItem = { id: uuidv4(), ...defaultItem, createdAt: new Date().toISOString() };
    updateItems([...weekItems, newItem]);
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
          <Icon size={16} className="text-accent-blue" />
          <h3 className="text-sm font-semibold">{title}</h3>
          <span className="badge badge-blue">{weekItems.length}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); addItem(); }}
          className="flex items-center gap-1 px-2 py-1 text-xs text-accent-blue hover:bg-accent-blue/10 rounded transition-colors"
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
              <ItemRow
                key={item.id}
                item={item}
                onUpdate={updateItem}
                onDelete={deleteItem}
                fields={fields}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function WorkTab({ tabId, tabName }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const weeks = getPreviousWeeks(12);
  const currentWeek = weeks[weekOffset] || weeks[0];

  return (
    <div className="space-y-6">
      {/* Week selector */}
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
      </div>

      {/* Sections */}
      <Section
        title="Jiras"
        icon={Bug}
        storageKey="jiras"
        tabId={tabId}
        currentWeek={currentWeek}
        fields={[
          { key: 'title', width: 'flex-[2]', placeholder: 'Jira title...' },
          { key: 'ticket', width: 'w-28', placeholder: 'PROJ-123' },
          { key: 'priority', width: 'w-20', placeholder: 'Priority' },
          { key: 'notes', width: 'flex-1', placeholder: 'Notes...' },
        ]}
        defaultItem={{ title: '', ticket: '', priority: 'medium', status: 'open', notes: '' }}
      />

      <Section
        title="Commitments from Calls"
        icon={MessageSquare}
        storageKey="commitments"
        tabId={tabId}
        currentWeek={currentWeek}
        fields={[
          { key: 'title', width: 'flex-[2]', placeholder: 'Commitment...' },
          { key: 'owner', width: 'w-28', placeholder: 'Owner' },
          { key: 'dueDate', width: 'w-28', placeholder: 'Due date' },
          { key: 'notes', width: 'flex-1', placeholder: 'Notes...' },
        ]}
        defaultItem={{ title: '', owner: '', dueDate: '', status: 'open', notes: '' }}
      />

      <Section
        title="Call Prep"
        icon={Phone}
        storageKey="callprep"
        tabId={tabId}
        currentWeek={currentWeek}
        fields={[
          { key: 'title', width: 'flex-[2]', placeholder: 'Meeting / call...' },
          { key: 'date', width: 'w-28', placeholder: 'Date' },
          { key: 'agenda', width: 'flex-1', placeholder: 'Agenda / prep notes...' },
        ]}
        defaultItem={{ title: '', date: '', agenda: '' }}
      />
    </div>
  );
}
