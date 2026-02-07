'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus, Trash2, ChevronDown, ChevronRight, CheckCircle2,
  Circle, Clock, AlertCircle, AlertTriangle, Layers, ExternalLink,
  ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { load, save } from '../../lib/storage';
import { getWeekLabel, getPreviousWeeks, rolloverItems } from '../../lib/weekUtils';

const STATUSES = ['open', 'in-progress', 'blocked', 'done'];
const STATUS_LABELS = { 'open': 'Open', 'in-progress': 'In Progress', 'blocked': 'Blocked', 'done': 'Done' };
const STATUS_COLORS = { 'open': 'text-text-secondary', 'in-progress': 'text-accent-green', 'blocked': 'text-red-400', 'done': 'text-green-400' };
const STATUS_BG = { 'open': 'badge-gray', 'in-progress': 'badge-green', 'blocked': 'badge-red', 'done': 'badge-mint' };

function TicketCard({ ticket, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-dark-card border border-dark-border rounded-lg overflow-hidden group
                    ${ticket.critical ? 'border-l-2 border-l-red-500' : ''}`}>
      <div className="flex items-center gap-2 px-3 py-2">
        <select value={ticket.status}
          onChange={(e) => onUpdate({ ...ticket, status: e.target.value })}
          className={`text-xs px-1 py-0.5 rounded border-none bg-transparent cursor-pointer ${STATUS_COLORS[ticket.status]}`}>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>

        <input value={ticket.title} onChange={(e) => onUpdate({ ...ticket, title: e.target.value })}
          placeholder="Ticket title..."
          className="flex-1 text-sm bg-transparent border-none px-1 py-0 font-medium text-text-primary" />

        <input value={ticket.ticketId} onChange={(e) => onUpdate({ ...ticket, ticketId: e.target.value })}
          placeholder="ID"
          className="w-20 text-xs bg-transparent border-none px-1 py-0 font-mono text-text-muted" />

        <span className={`badge ${STATUS_BG[ticket.status]} text-[9px] shrink-0`}>{ticket.status}</span>

        {ticket.sourceTab && (
          <span className="badge badge-purple text-[9px] shrink-0" title={`Linked from ${ticket.sourceTab}`}>
            <ExternalLink size={8} className="mr-0.5" />linked
          </span>
        )}

        <button onClick={() => setExpanded(!expanded)} className="text-text-muted hover:text-text-primary">
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        <button onClick={() => onDelete(ticket.id)}
          className="shrink-0 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
          <Trash2 size={12} />
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-2.5 pt-1 border-t border-dark-border space-y-2">
          <div className="flex gap-2 items-start">
            <label className="text-[10px] text-text-muted w-14 pt-1 uppercase">Notes</label>
            <textarea value={ticket.notes} onChange={(e) => onUpdate({ ...ticket, notes: e.target.value })}
              placeholder="Add notes..."
              className="flex-1 text-xs bg-dark-bg border border-dark-border rounded px-2 py-1 resize-none min-h-[40px]" />
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-[10px] text-text-muted w-14 uppercase">Assignee</label>
            <input value={ticket.assignee} onChange={(e) => onUpdate({ ...ticket, assignee: e.target.value })}
              placeholder="Unassigned"
              className="flex-1 text-xs bg-transparent border-none px-1 py-0 text-text-secondary" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-text-muted w-14 uppercase">Critical</label>
            <button onClick={() => onUpdate({ ...ticket, critical: !ticket.critical })}
              className={`text-xs px-2 py-0.5 rounded ${ticket.critical ? 'bg-red-500/20 text-red-400' : 'bg-dark-bg text-text-muted'}`}>
              {ticket.critical ? 'Yes' : 'No'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TicketSection({ title, icon: Icon, storageKey, currentWeek, critical, iconColor }) {
  const fullKey = `de_${storageKey}`;
  const [items, setItems] = useState({});
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let loaded = load(fullKey, {});
    const weeks = getPreviousWeeks(2);
    if (weeks.length > 1) loaded = rolloverItems(loaded, weeks[0], weeks[1]);
    setItems(loaded);
  }, [fullKey]);

  const weekItems = (items[currentWeek] || []).filter(t =>
    critical === undefined ? true : t.critical === critical
  );

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
      <div className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-dark-hover transition-colors"
        onClick={() => setCollapsed(!collapsed)}>
        <div className="flex items-center gap-2">
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          <Icon size={14} className={iconColor} />
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          <span className={`badge ${critical ? 'badge-red' : 'badge-green'}`}>{weekItems.length}</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); addItem(); }}
          className="flex items-center gap-1 px-2 py-1 text-xs text-accent-green hover:bg-accent-green/10 rounded transition-colors">
          <Plus size={12} /> Add
        </button>
      </div>
      {!collapsed && (
        <div className="px-4 pb-3 space-y-1">
          {weekItems.length === 0 ? (
            <p className="text-xs text-text-muted py-3 text-center">No tickets</p>
          ) : (
            weekItems.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} onUpdate={updateItem} onDelete={deleteItem} />
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

      <TicketSection title="Critical Tickets" icon={AlertTriangle} storageKey="tickets"
        currentWeek={currentWeek} critical={true} iconColor="text-red-400" />

      <TicketSection title="Functional Team Tickets" icon={Layers} storageKey="tickets"
        currentWeek={currentWeek} critical={false} iconColor="text-accent-mint" />
    </div>
  );
}
