'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus, Trash2, ChevronDown, ChevronRight, CheckCircle2,
  Circle, Clock,
  ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { load, save } from '../../lib/storage';
import { getWeekLabel, getPreviousWeeks, rolloverItems } from '../../lib/weekUtils';

const STATUS_CYCLE = ['open', 'in-progress', 'done'];
const STATUS_ICONS = { 'open': Circle, 'in-progress': Clock, 'done': CheckCircle2 };
const STATUS_COLORS = { 'open': 'text-text-secondary', 'in-progress': 'text-accent-green', 'done': 'text-green-400' };

function ActionRow({ item, onUpdate, onDelete }) {
  const StatusIcon = STATUS_ICONS[item.status] || Circle;
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-dark-card border border-dark-border rounded-lg group">
      <button
        onClick={() => {
          const idx = STATUS_CYCLE.indexOf(item.status);
          onUpdate({ ...item, status: STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] });
        }}
        className={`shrink-0 ${STATUS_COLORS[item.status]} hover:opacity-70`}
      >
        <StatusIcon size={14} />
      </button>
      <input value={item.title} onChange={(e) => onUpdate({ ...item, title: e.target.value })}
        placeholder="Action item..." className="flex-[2] text-sm bg-transparent border-none px-1 py-0 font-medium text-text-primary" />
      <input value={item.owner} onChange={(e) => onUpdate({ ...item, owner: e.target.value })}
        placeholder="Owner" className="w-24 text-xs bg-transparent border-none px-1 py-0 text-text-secondary" />
      <input value={item.dueDate} onChange={(e) => onUpdate({ ...item, dueDate: e.target.value })}
        placeholder="Due date" className="w-24 text-xs bg-transparent border-none px-1 py-0 text-text-muted" />
      <button onClick={() => onDelete(item.id)}
        className="shrink-0 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
        <Trash2 size={12} />
      </button>
    </div>
  );
}

function ActionSection({ title, storageKey, currentWeek }) {
  const fullKey = `manager_${storageKey}`;
  const [items, setItems] = useState({});
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let loaded = load(fullKey, {});
    const weeks = getPreviousWeeks(2);
    if (weeks.length > 1) loaded = rolloverItems(loaded, weeks[0], weeks[1]);
    setItems(loaded);
  }, [fullKey]);

  const weekItems = items[currentWeek] || [];

  const updateItems = useCallback((newWeekItems) => {
    const updated = { ...items, [currentWeek]: newWeekItems };
    setItems(updated);
    save(fullKey, updated);
  }, [items, currentWeek, fullKey]);

  const addItem = () => {
    updateItems([...weekItems, { id: uuidv4(), title: '', owner: '', dueDate: '', status: 'open', createdAt: new Date().toISOString() }]);
  };

  return (
    <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-dark-hover transition-colors"
        onClick={() => setCollapsed(!collapsed)}>
        <div className="flex items-center gap-2">
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          <span className="badge badge-green">{weekItems.length}</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); addItem(); }}
          className="flex items-center gap-1 px-2 py-1 text-xs text-accent-green hover:bg-accent-green/10 rounded transition-colors">
          <Plus size={12} /> Add
        </button>
      </div>
      {!collapsed && (
        <div className="px-4 pb-3 space-y-1">
          {weekItems.length === 0 ? (
            <p className="text-xs text-text-muted py-3 text-center">No items yet</p>
          ) : (
            weekItems.map((item) => (
              <ActionRow key={item.id} item={item} onUpdate={(u) => updateItems(weekItems.map(i => i.id === u.id ? u : i))} onDelete={(id) => updateItems(weekItems.filter(i => i.id !== id))} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function TextSection({ title, storageKey, currentWeek, placeholder }) {
  const fullKey = `manager_${storageKey}`;
  const [data, setData] = useState({});
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => { setData(load(fullKey, {})); }, [fullKey]);

  const text = data[currentWeek] || '';
  const updateText = (value) => {
    const updated = { ...data, [currentWeek]: value };
    setData(updated);
    save(fullKey, updated);
  };

  return (
    <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-dark-hover transition-colors"
        onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      {!collapsed && (
        <div className="px-4 pb-3">
          <textarea value={text} onChange={(e) => updateText(e.target.value)} placeholder={placeholder}
            className="w-full text-sm bg-dark-bg border border-dark-border rounded-lg px-3 py-2 resize-y min-h-[80px] text-text-primary" rows={4} />
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
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset(Math.min(weekOffset + 1, weeks.length - 1))}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-dark-card rounded transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div className="text-center min-w-[180px]">
            <span className="text-sm font-semibold">{getWeekLabel(currentWeek)}</span>
            {weekOffset === 0 && <span className="ml-2 badge badge-green">Current</span>}
          </div>
          <button onClick={() => setWeekOffset(Math.max(weekOffset - 1, 0))}
            disabled={weekOffset === 0}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-dark-card rounded transition-colors disabled:opacity-30">
            <ChevronRightIcon size={16} />
          </button>
        </div>
        <select value={weekOffset} onChange={(e) => setWeekOffset(Number(e.target.value))}
          className="text-xs bg-dark-card border border-dark-border rounded px-2 py-1">
          {weeks.slice(0, 12).map((w, i) => (
            <option key={w} value={i}>{getWeekLabel(w)}{i === 0 ? ' (Current)' : ''}</option>
          ))}
        </select>
      </div>

      <TextSection title="Meeting Prep" storageKey="meetingprep" currentWeek={currentWeek}
        placeholder="Prepare for manager meetings... Topics to discuss, updates to share, questions to ask." />

      <TextSection title="Notes" storageKey="notes" currentWeek={currentWeek}
        placeholder="Meeting notes, key takeaways, decisions made..." />

      <ActionSection title="Action Items" storageKey="actions" currentWeek={currentWeek} />
    </div>
  );
}
