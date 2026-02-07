'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus, Trash2, ChevronDown, ChevronRight, CheckCircle2,
  Circle, Clock, AlertCircle, AlertTriangle, Layers, GripVertical,
  ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { load, save } from '../../lib/storage';
import { getWeekKey, getWeekLabel, getPreviousWeeks, rolloverItems } from '../../lib/weekUtils';

const STATUSES = ['open', 'in-progress', 'blocked', 'done'];
const STATUS_ICONS = { 'open': Circle, 'in-progress': Clock, 'blocked': AlertCircle, 'done': CheckCircle2 };
const STATUS_COLORS = { 'open': 'text-text-secondary', 'in-progress': 'text-accent-blue', 'blocked': 'text-red-400', 'done': 'text-green-400' };
const STATUS_BG = { 'open': 'badge-blue', 'in-progress': 'badge-blue', 'blocked': 'badge-red', 'done': 'badge-green' };

function TicketCard({ ticket, onUpdate, onDelete, stackable }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');

  const StatusIcon = STATUS_ICONS[ticket.status] || Circle;

  const startEdit = (field) => { setEditing(field); setEditValue(ticket[field] || ''); };
  const saveEdit = () => {
    if (editing) { onUpdate({ ...ticket, [editing]: editValue }); setEditing(null); }
  };

  return (
    <div className={`bg-dark-card border border-dark-border rounded-lg overflow-hidden group
                    ${ticket.critical ? 'border-l-2 border-l-red-500' : ''}`}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        {stackable && (
          <GripVertical size={14} className="text-text-muted shrink-0 cursor-grab" />
        )}
        <button
          onClick={() => {
            const idx = STATUSES.indexOf(ticket.status);
            onUpdate({ ...ticket, status: STATUSES[(idx + 1) % STATUSES.length] });
          }}
          className={`shrink-0 ${STATUS_COLORS[ticket.status]} hover:opacity-70`}
        >
          <StatusIcon size={16} />
        </button>

        <div className="flex-1 min-w-0 flex items-center gap-3">
          {editing === 'title' ? (
            <input value={editValue} onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveEdit} onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
              className="flex-1 text-sm bg-dark-bg px-2 py-1 rounded" autoFocus />
          ) : (
            <span onClick={() => startEdit('title')}
              className="text-sm font-medium text-text-primary cursor-pointer hover:text-accent-blue truncate">
              {ticket.title || 'Untitled ticket'}
            </span>
          )}

          {editing === 'ticketId' ? (
            <input value={editValue} onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveEdit} onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
              className="w-24 text-xs bg-dark-bg px-2 py-1 rounded font-mono" autoFocus />
          ) : (
            <span onClick={() => startEdit('ticketId')}
              className="text-xs font-mono text-text-muted cursor-pointer hover:text-accent-blue shrink-0">
              {ticket.ticketId || 'ID'}
            </span>
          )}
        </div>

        <span className={`badge ${STATUS_BG[ticket.status]} shrink-0`}>{ticket.status}</span>

        <button onClick={() => setExpanded(!expanded)}
          className="text-text-muted hover:text-text-primary">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <button onClick={() => onDelete(ticket.id)}
          className="shrink-0 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
          <Trash2 size={14} />
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-dark-border space-y-2">
          <div className="flex gap-2">
            <label className="text-xs text-text-muted w-16 pt-1">Notes:</label>
            {editing === 'notes' ? (
              <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)}
                onBlur={saveEdit} className="flex-1 text-sm bg-dark-bg px-2 py-1 rounded resize-none" rows={2} autoFocus />
            ) : (
              <span onClick={() => startEdit('notes')}
                className="flex-1 text-sm text-text-secondary cursor-pointer hover:text-accent-blue">
                {ticket.notes || 'Click to add notes...'}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <label className="text-xs text-text-muted w-16 pt-1">Assignee:</label>
            {editing === 'assignee' ? (
              <input value={editValue} onChange={(e) => setEditValue(e.target.value)}
                onBlur={saveEdit} onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                className="flex-1 text-sm bg-dark-bg px-2 py-1 rounded" autoFocus />
            ) : (
              <span onClick={() => startEdit('assignee')}
                className="flex-1 text-sm text-text-secondary cursor-pointer hover:text-accent-blue">
                {ticket.assignee || 'Unassigned'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted w-16">Critical:</label>
            <button
              onClick={() => onUpdate({ ...ticket, critical: !ticket.critical })}
              className={`text-xs px-2 py-0.5 rounded ${ticket.critical ? 'bg-red-500/20 text-red-400' : 'bg-dark-bg text-text-muted'}`}
            >
              {ticket.critical ? 'Yes' : 'No'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TicketSection({ title, icon: Icon, storageKey, currentWeek, critical, stackable }) {
  const fullKey = `de_${storageKey}`;
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

  const weekItems = (items[currentWeek] || []).filter(t =>
    critical === undefined ? true : t.critical === critical
  );

  const updateItems = useCallback((newWeekItems) => {
    const otherItems = (items[currentWeek] || []).filter(t =>
      critical === undefined ? false : t.critical !== critical
    );
    const updated = { ...items, [currentWeek]: [...otherItems, ...newWeekItems] };
    setItems(updated);
    save(fullKey, updated);
  }, [items, currentWeek, fullKey, critical]);

  const addItem = () => {
    const allItems = items[currentWeek] || [];
    const newItem = {
      id: uuidv4(), title: '', ticketId: '', status: 'open',
      notes: '', assignee: '', critical: critical || false,
      createdAt: new Date().toISOString()
    };
    const updated = { ...items, [currentWeek]: [...allItems, newItem] };
    setItems(updated);
    save(fullKey, updated);
  };

  const updateItem = (updatedItem) => {
    const allItems = items[currentWeek] || [];
    const updated = { ...items, [currentWeek]: allItems.map(i => i.id === updatedItem.id ? updatedItem : i) };
    setItems(updated);
    save(fullKey, updated);
  };

  const deleteItem = (id) => {
    const allItems = items[currentWeek] || [];
    const updated = { ...items, [currentWeek]: allItems.filter(i => i.id !== id) };
    setItems(updated);
    save(fullKey, updated);
  };

  return (
    <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-dark-hover transition-colors"
        onClick={() => setCollapsed(!collapsed)}>
        <div className="flex items-center gap-2">
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          <Icon size={16} className={critical ? 'text-red-400' : 'text-accent-cyan'} />
          <h3 className="text-sm font-semibold">{title}</h3>
          <span className={`badge ${critical ? 'badge-red' : 'badge-blue'}`}>{weekItems.length}</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); addItem(); }}
          className="flex items-center gap-1 px-2 py-1 text-xs text-accent-cyan hover:bg-accent-cyan/10 rounded transition-colors">
          <Plus size={12} /> Add
        </button>
      </div>
      {!collapsed && (
        <div className="px-4 pb-3 space-y-1.5">
          {weekItems.length === 0 ? (
            <p className="text-xs text-text-muted py-3 text-center">No tickets</p>
          ) : (
            weekItems.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} onUpdate={updateItem}
                onDelete={deleteItem} stackable={stackable} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function DataEngineeringTab() {
  const [weekOffset, setWeekOffset] = useState(0);
  const weeks = getPreviousWeeks(20);
  const currentWeek = weeks[weekOffset] || weeks[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset(Math.min(weekOffset + 1, weeks.length - 1))}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-dark-card rounded transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div className="text-center">
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

      <TicketSection title="Critical Tickets" icon={AlertTriangle} storageKey="tickets"
        currentWeek={currentWeek} critical={true} stackable={true} />

      <TicketSection title="Functional Team Tickets" icon={Layers} storageKey="tickets"
        currentWeek={currentWeek} critical={false} stackable={true} />
    </div>
  );
}
