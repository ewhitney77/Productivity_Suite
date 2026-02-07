'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus, Trash2, ChevronDown, ChevronRight, CheckCircle2,
  Circle, Clock, PauseCircle, Send,
  ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { load, save } from '../../lib/storage';
import { getWeekLabel, getPreviousWeeks, rolloverItems } from '../../lib/weekUtils';

const JIRA_STATUSES = ['open', 'in-progress', 'on-hold', 'closed'];
const STATUS_LABELS = { 'open': 'Open', 'in-progress': 'In Progress', 'on-hold': 'On Hold', 'closed': 'Closed' };
const STATUS_ICONS = { 'open': Circle, 'in-progress': Clock, 'on-hold': PauseCircle, 'closed': CheckCircle2 };
const STATUS_COLORS = {
  'open': 'text-text-secondary',
  'in-progress': 'text-accent-green',
  'on-hold': 'text-yellow-400',
  'closed': 'text-green-400',
};

function JiraRow({ item, onUpdate, onDelete }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 bg-dark-card border border-dark-border rounded-lg group
                    ${item.rolledOver ? 'border-l-2 border-l-yellow-500/50' : ''}`}>
      <select
        value={item.status}
        onChange={(e) => onUpdate({ ...item, status: e.target.value })}
        className={`text-xs px-1 py-0.5 rounded border-none bg-transparent cursor-pointer ${STATUS_COLORS[item.status]}`}
      >
        {JIRA_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </select>

      <input
        value={item.title}
        onChange={(e) => onUpdate({ ...item, title: e.target.value })}
        placeholder="Jira title..."
        className="flex-[2] text-sm bg-transparent border-none px-1 py-0 font-medium text-text-primary"
      />
      <input
        value={item.ticket}
        onChange={(e) => onUpdate({ ...item, ticket: e.target.value })}
        placeholder="PROJ-123"
        className="w-24 text-xs bg-transparent border-none px-1 py-0 font-mono text-text-muted"
      />
      <select
        value={item.priority || 'medium'}
        onChange={(e) => onUpdate({ ...item, priority: e.target.value })}
        className="text-xs bg-transparent border-none px-1 py-0 text-text-secondary"
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <input
        value={item.notes}
        onChange={(e) => onUpdate({ ...item, notes: e.target.value })}
        placeholder="Notes..."
        className="flex-1 text-xs bg-transparent border-none px-1 py-0 text-text-secondary"
      />
      {item.rolledOver && <span className="badge badge-yellow text-[9px] shrink-0">carried</span>}
      <button onClick={() => onDelete(item.id)}
        className="shrink-0 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
        <Trash2 size={12} />
      </button>
    </div>
  );
}

function TextSection({ title, storageKey, tabId, currentWeek, placeholder }) {
  const fullKey = `${tabId}_${storageKey}`;
  const [data, setData] = useState({});
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setData(load(fullKey, {}));
  }, [fullKey]);

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
          <textarea
            value={text}
            onChange={(e) => updateText(e.target.value)}
            placeholder={placeholder}
            className="w-full text-sm bg-dark-bg border border-dark-border rounded-lg px-3 py-2 resize-y min-h-[80px] text-text-primary"
            rows={4}
          />
        </div>
      )}
    </div>
  );
}

function JiraSection({ tabId, currentWeek }) {
  const fullKey = `${tabId}_jiras`;
  const [items, setItems] = useState({});
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let loaded = load(fullKey, {});
    const weeks = getPreviousWeeks(2);
    if (weeks.length > 1) {
      loaded = rolloverItems(loaded, weeks[0], weeks[1]);
    }
    setItems(loaded);
    save(fullKey, loaded);
  }, [fullKey]);

  const weekItems = items[currentWeek] || [];

  const updateItems = useCallback((newWeekItems) => {
    const updated = { ...items, [currentWeek]: newWeekItems };
    setItems(updated);
    save(fullKey, updated);
  }, [items, currentWeek, fullKey]);

  const addItem = () => {
    updateItems([...weekItems, {
      id: uuidv4(), title: '', ticket: '', priority: 'medium', status: 'open', notes: '',
      sourceTab: tabId, createdAt: new Date().toISOString()
    }]);
  };

  const updateItem = (updatedItem) => {
    const newItems = weekItems.map(i => i.id === updatedItem.id ? updatedItem : i);
    updateItems(newItems);
    syncToDataEngineering(newItems);
  };

  const deleteItem = (id) => {
    updateItems(weekItems.filter(i => i.id !== id));
  };

  const syncToDataEngineering = (jiras) => {
    const deKey = 'de_tickets';
    const deData = load(deKey, {});
    const deWeekItems = deData[currentWeek] || [];
    const openJiras = jiras.filter(j => j.status !== 'closed');

    const existingLinkedIds = new Set(deWeekItems.filter(t => t.linkedFrom).map(t => t.linkedFrom));
    const newLinked = openJiras
      .filter(j => !existingLinkedIds.has(j.id))
      .map(j => ({
        id: uuidv4(), title: j.title || 'Untitled', ticketId: j.ticket,
        status: j.status === 'in-progress' ? 'in-progress' : 'open',
        notes: `From ${tabId}: ${j.notes || ''}`, assignee: '', critical: false,
        linkedFrom: j.id, sourceTab: tabId, createdAt: new Date().toISOString()
      }));

    const updatedDe = deWeekItems
      .map(t => {
        if (!t.linkedFrom) return t;
        const sourceJira = jiras.find(j => j.id === t.linkedFrom);
        if (!sourceJira) return t;
        if (sourceJira.status === 'closed') return { ...t, status: 'done' };
        return { ...t, title: sourceJira.title || t.title, ticketId: sourceJira.ticket || t.ticketId };
      })
      .concat(newLinked);

    deData[currentWeek] = updatedDe;
    save(deKey, deData);
  };

  return (
    <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-dark-hover transition-colors"
        onClick={() => setCollapsed(!collapsed)}>
        <div className="flex items-center gap-2">
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          <h3 className="text-sm font-semibold text-text-primary">Jiras</h3>
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
            <p className="text-xs text-text-muted py-3 text-center">No jiras yet — click Add to start</p>
          ) : (
            weekItems.map((item) => (
              <JiraRow key={item.id} item={item} onUpdate={updateItem} onDelete={deleteItem} />
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
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Week selector */}
      <div className="flex items-center justify-center gap-3">
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

      <JiraSection tabId={tabId} currentWeek={currentWeek} />

      <TextSection
        title="Commitments from Calls"
        storageKey="commitments"
        tabId={tabId}
        currentWeek={currentWeek}
        placeholder="Type your commitments here... These are free-form notes from calls and meetings."
      />

      <TextSection
        title="Call Prep"
        storageKey="callprep"
        tabId={tabId}
        currentWeek={currentWeek}
        placeholder="Prepare for upcoming calls... Agenda items, talking points, questions to ask."
      />
    </div>
  );
}
