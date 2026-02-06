import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'dpm-dashboard-v2'
const JIRA_BASE_URL = 'https://cyberark.atlassian.net/browse/'

const TAB_TYPES = {
  DATA_ENG: 'data-engineering',
  ONE_ON_ONE: 'one-on-one',
  STAKEHOLDER: 'stakeholder-sync',
  GENERAL_NOTES: 'general-notes',
  OPEN_QUESTIONS: 'open-questions',
}

const DEFAULT_TABS = [
  { name: 'Data Engineering Priorities', type: TAB_TYPES.DATA_ENG },
  { name: 'CS & Product Sync', type: TAB_TYPES.STAKEHOLDER },
  { name: 'Finance Sync', type: TAB_TYPES.STAKEHOLDER },
  { name: 'Ethan x George 1x1', type: TAB_TYPES.ONE_ON_ONE },
  { name: 'General Notes', type: TAB_TYPES.GENERAL_NOTES },
  { name: 'Open Questions for Discovery', type: TAB_TYPES.OPEN_QUESTIONS },
]

const PRIORITY_OPTIONS = ['High', 'Medium', 'Low']
const STATUS_OPTIONS = ['Open', 'In Progress', 'Blocked', 'Done']

const PRIORITY_COLORS = {
  High: 'bg-red-100 text-red-700 border-red-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Low: 'bg-green-100 text-green-700 border-green-200',
}

const STATUS_COLORS = {
  Open: 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-purple-100 text-purple-700',
  Blocked: 'bg-red-100 text-red-700',
  Done: 'bg-gray-100 text-gray-500',
}

const TAB_TYPE_LABELS = {
  [TAB_TYPES.DATA_ENG]: 'Data Engineering',
  [TAB_TYPES.ONE_ON_ONE]: '1:1 Meeting',
  [TAB_TYPES.STAKEHOLDER]: 'Stakeholder Sync',
  [TAB_TYPES.GENERAL_NOTES]: 'General Notes',
  [TAB_TYPES.OPEN_QUESTIONS]: 'Open Questions',
}

// ─── Week Helpers ────────────────────────────────────────────────────────────

function getMonday(d) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function weekKey(date) {
  const mon = getMonday(date || new Date())
  return mon.toISOString().slice(0, 10)
}

function formatWeekLabel(wk) {
  const mon = new Date(wk + 'T00:00:00')
  const fri = new Date(mon)
  fri.setDate(fri.getDate() + 4)
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(mon)} – ${fmt(fri)}`
}

function currentWeekKey() {
  return weekKey(new Date())
}

// ─── Data Factories ──────────────────────────────────────────────────────────

function createTab(name, type) {
  return {
    id: crypto.randomUUID(),
    name,
    type: type || TAB_TYPES.GENERAL_NOTES,
    lastUpdated: new Date().toISOString(),
    weeks: {},
  }
}

function emptyWeekData(type) {
  switch (type) {
    case TAB_TYPES.DATA_ENG:
      return { jiraItems: [], conversationTopics: '', actionItems: '' }
    case TAB_TYPES.ONE_ON_ONE:
      return { meetingPrep: '', openItems: '' }
    case TAB_TYPES.STAKEHOLDER:
      return { jiraItems: [], meetingNotes: '', actionItems: '' }
    case TAB_TYPES.GENERAL_NOTES:
      return { sections: [{ id: crypto.randomUUID(), title: 'Untitled Section', content: '' }] }
    case TAB_TYPES.OPEN_QUESTIONS:
      return { questions: '', resolved: '' }
    default:
      return { notes: '' }
  }
}

function getWeekData(tab, wk) {
  return tab.weeks?.[wk] || emptyWeekData(tab.type)
}

function createJiraItem() {
  return {
    id: crypto.randomUUID(),
    jira: '',
    priority: 'Medium',
    status: 'Open',
    delivery: '',
    context: '',
  }
}

// ─── Generic Helpers ─────────────────────────────────────────────────────────

function formatTimestamp(iso) {
  if (!iso) return 'Never'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function jiraLink(ticket) {
  const t = ticket?.trim()
  if (!t || !/^[A-Z][A-Z0-9]+-\d+$/.test(t)) return null
  return `${JIRA_BASE_URL}${t}`
}

// ─── Shared Components ───────────────────────────────────────────────────────

function WeekNav({ weeks, selectedWeek, onSelect }) {
  const current = currentWeekKey()
  const allWeeks = useMemo(() => {
    const set = new Set([current, ...Object.keys(weeks || {})])
    return [...set].sort().reverse()
  }, [weeks, current])

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedWeek}
        onChange={(e) => onSelect(e.target.value)}
        className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white outline-none focus:border-blue-300"
      >
        {allWeeks.map((wk) => (
          <option key={wk} value={wk}>
            {wk === current ? `This Week — ${formatWeekLabel(wk)}` : formatWeekLabel(wk)}
          </option>
        ))}
      </select>
      {selectedWeek !== current && (
        <button onClick={() => onSelect(current)} className="text-xs text-blue-600 hover:text-blue-800">
          Jump to current
        </button>
      )}
    </div>
  )
}

function JiraTicketLink({ ticket }) {
  const url = jiraLink(ticket)
  if (!url) return <span className="text-gray-400 text-xs">—</span>
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs font-mono underline decoration-blue-200 hover:decoration-blue-500">
      {ticket.trim()}
      <svg className="w-3 h-3 inline ml-0.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  )
}

function SectionHeader({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{children}</h3>
      {action}
    </div>
  )
}

// ─── Data Engineering Tab ────────────────────────────────────────────────────

function DataEngTab({ tab, onUpdate, selectedWeek }) {
  const data = getWeekData(tab, selectedWeek)

  const touch = useCallback((updates) => {
    onUpdate({
      ...tab,
      lastUpdated: new Date().toISOString(),
      weeks: { ...tab.weeks, [selectedWeek]: { ...data, ...updates } },
    })
  }, [tab, onUpdate, selectedWeek, data])

  const updateJiraItem = (updated) => {
    touch({ jiraItems: (data.jiraItems || []).map((it) => (it.id === updated.id ? updated : it)) })
  }

  const addJiraItem = () => {
    touch({ jiraItems: [...(data.jiraItems || []), createJiraItem()] })
  }

  const deleteJiraItem = (id) => {
    touch({ jiraItems: (data.jiraItems || []).filter((it) => it.id !== id) })
  }

  const items = data.jiraItems || []

  return (
    <div className="space-y-6">
      {/* JIRA Tickets Table */}
      <section>
        <SectionHeader action={
          <button onClick={addJiraItem} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Ticket
          </button>
        }>JIRA Tickets</SectionHeader>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-3 py-2 w-28">JIRA #</th>
                <th className="px-3 py-2 w-20">Priority</th>
                <th className="px-3 py-2 w-24">Status</th>
                <th className="px-3 py-2 w-28">Delivery</th>
                <th className="px-3 py-2">Business Context</th>
                <th className="px-3 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-4 text-center text-gray-400 text-xs">No tickets yet. Click "Add Ticket" to start.</td></tr>
              )}
              {items.map((item) => {
                const isDone = item.status === 'Done'
                return (
                  <tr key={item.id} className={`border-t border-gray-100 group ${isDone ? 'opacity-50' : ''}`}>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.jira}
                        onChange={(e) => updateJiraItem({ ...item, jira: e.target.value.toUpperCase() })}
                        placeholder="DATA-1234"
                        className="w-full text-xs font-mono bg-transparent outline-none placeholder-gray-300"
                      />
                      {item.jira && jiraLink(item.jira) && (
                        <a href={jiraLink(item.jira)} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 text-[10px]">
                          Open &rarr;
                        </a>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <select value={item.priority} onChange={(e) => updateJiraItem({ ...item, priority: e.target.value })}
                        className={`text-xs font-medium px-1.5 py-0.5 rounded-full border cursor-pointer outline-none ${PRIORITY_COLORS[item.priority]}`}>
                        {PRIORITY_OPTIONS.map((p) => <option key={p}>{p}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select value={item.status} onChange={(e) => updateJiraItem({ ...item, status: e.target.value })}
                        className={`text-xs font-medium px-1.5 py-0.5 rounded-full cursor-pointer outline-none ${STATUS_COLORS[item.status]}`}>
                        {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={item.delivery || ''} onChange={(e) => updateJiraItem({ ...item, delivery: e.target.value })}
                        placeholder="e.g. Feb 14" className="w-full text-xs bg-transparent outline-none placeholder-gray-300" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={item.context || ''} onChange={(e) => updateJiraItem({ ...item, context: e.target.value })}
                        placeholder="Why this matters..." className="w-full text-xs bg-transparent outline-none placeholder-gray-300" />
                    </td>
                    <td className="px-1 py-2">
                      <button onClick={() => deleteJiraItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Conversation Topics */}
      <section>
        <SectionHeader>Open Conversation Topics</SectionHeader>
        <textarea value={data.conversationTopics || ''} onChange={(e) => touch({ conversationTopics: e.target.value })}
          placeholder="Topics to bring up in next sync..." rows={4}
          className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 resize-y placeholder-gray-400" />
      </section>

      {/* Post-Meeting Action Items */}
      <section>
        <SectionHeader>Post-Meeting Action Items</SectionHeader>
        <textarea value={data.actionItems || ''} onChange={(e) => touch({ actionItems: e.target.value })}
          placeholder="Action items from last meeting..." rows={4}
          className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 resize-y placeholder-gray-400" />
      </section>
    </div>
  )
}

// ─── 1:1 Meeting Tab ─────────────────────────────────────────────────────────

function OneOnOneTab({ tab, onUpdate, selectedWeek }) {
  const data = getWeekData(tab, selectedWeek)

  const touch = useCallback((updates) => {
    onUpdate({
      ...tab,
      lastUpdated: new Date().toISOString(),
      weeks: { ...tab.weeks, [selectedWeek]: { ...data, ...updates } },
    })
  }, [tab, onUpdate, selectedWeek, data])

  return (
    <div className="space-y-6">
      <section>
        <SectionHeader>Meeting Prep Notes</SectionHeader>
        <textarea value={data.meetingPrep || ''} onChange={(e) => touch({ meetingPrep: e.target.value })}
          placeholder="What do you want to cover this week?&#10;- Topic 1&#10;- Topic 2&#10;- Follow up on..."
          rows={8}
          className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 resize-y placeholder-gray-400" />
      </section>

      <section>
        <SectionHeader>Open Items</SectionHeader>
        <textarea value={data.openItems || ''} onChange={(e) => touch({ openItems: e.target.value })}
          placeholder="Ongoing items, follow-ups, decisions needed..."
          rows={8}
          className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 resize-y placeholder-gray-400" />
      </section>
    </div>
  )
}

// ─── Stakeholder Sync Tab ────────────────────────────────────────────────────

function StakeholderTab({ tab, onUpdate, selectedWeek }) {
  const data = getWeekData(tab, selectedWeek)

  const touch = useCallback((updates) => {
    onUpdate({
      ...tab,
      lastUpdated: new Date().toISOString(),
      weeks: { ...tab.weeks, [selectedWeek]: { ...data, ...updates } },
    })
  }, [tab, onUpdate, selectedWeek, data])

  const items = data.jiraItems || []

  const updateJiraItem = (updated) => {
    touch({ jiraItems: items.map((it) => (it.id === updated.id ? updated : it)) })
  }
  const addJiraItem = () => touch({ jiraItems: [...items, createJiraItem()] })
  const deleteJiraItem = (id) => touch({ jiraItems: items.filter((it) => it.id !== id) })

  return (
    <div className="space-y-6">
      {/* Quick JIRA Section */}
      <section>
        <SectionHeader action={
          <button onClick={addJiraItem} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Ticket
          </button>
        }>JIRA Tickets</SectionHeader>
        <div className="space-y-1.5">
          {items.length === 0 && (
            <div className="text-xs text-gray-400 py-3 text-center border border-dashed border-gray-200 rounded-lg">No tickets. Click "Add Ticket" to start.</div>
          )}
          {items.map((item) => (
            <div key={item.id} className="group flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-gray-300 bg-white">
              <input type="text" value={item.jira} onChange={(e) => updateJiraItem({ ...item, jira: e.target.value.toUpperCase() })}
                placeholder="DATA-1234" className="w-24 text-xs font-mono bg-transparent outline-none placeholder-gray-300 shrink-0" />
              {item.jira && jiraLink(item.jira) && (
                <a href={jiraLink(item.jira)} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 shrink-0">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              <select value={item.priority} onChange={(e) => updateJiraItem({ ...item, priority: e.target.value })}
                className={`text-xs font-medium px-1.5 py-0.5 rounded-full border cursor-pointer outline-none shrink-0 ${PRIORITY_COLORS[item.priority]}`}>
                {PRIORITY_OPTIONS.map((p) => <option key={p}>{p}</option>)}
              </select>
              <select value={item.status} onChange={(e) => updateJiraItem({ ...item, status: e.target.value })}
                className={`text-xs font-medium px-1.5 py-0.5 rounded-full cursor-pointer outline-none shrink-0 ${STATUS_COLORS[item.status]}`}>
                {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
              <input type="text" value={item.context || ''} onChange={(e) => updateJiraItem({ ...item, context: e.target.value })}
                placeholder="Context..." className="flex-1 text-xs bg-transparent outline-none placeholder-gray-300 min-w-0" />
              <button onClick={() => deleteJiraItem(item.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Meeting Notes */}
      <section>
        <SectionHeader>Meeting Notes</SectionHeader>
        <textarea value={data.meetingNotes || ''} onChange={(e) => touch({ meetingNotes: e.target.value })}
          placeholder="Notes from sync..." rows={5}
          className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 resize-y placeholder-gray-400" />
      </section>

      {/* Action Items */}
      <section>
        <SectionHeader>Action Items</SectionHeader>
        <textarea value={data.actionItems || ''} onChange={(e) => touch({ actionItems: e.target.value })}
          placeholder="Post-meeting action items..." rows={4}
          className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 resize-y placeholder-gray-400" />
      </section>
    </div>
  )
}

// ─── General Notes Tab ───────────────────────────────────────────────────────

function GeneralNotesTab({ tab, onUpdate }) {
  // General Notes are NOT weekly — they're persistent project scoping notes
  const sections = tab.weeks?._sections || [{ id: crypto.randomUUID(), title: 'Untitled Section', content: '' }]

  const touch = useCallback((newSections) => {
    onUpdate({
      ...tab,
      lastUpdated: new Date().toISOString(),
      weeks: { ...tab.weeks, _sections: newSections },
    })
  }, [tab, onUpdate])

  const updateSection = (id, updates) => {
    touch(sections.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  const addSection = () => {
    touch([...sections, { id: crypto.randomUUID(), title: 'Untitled Section', content: '' }])
  }

  const deleteSection = (id) => {
    if (sections.length <= 1) return
    touch(sections.filter((s) => s.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">Persistent notes — not weekly. Add sections for different projects.</p>
        <button onClick={addSection} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Section
        </button>
      </div>
      {sections.map((section) => (
        <div key={section.id} className="border border-gray-200 rounded-lg p-4 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={section.title}
              onChange={(e) => updateSection(section.id, { title: e.target.value })}
              className="flex-1 text-base font-semibold text-gray-800 bg-transparent outline-none border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-400"
            />
            {sections.length > 1 && (
              <button onClick={() => deleteSection(section.id)} className="p-1 text-gray-400 hover:text-red-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
          <textarea
            value={section.content}
            onChange={(e) => updateSection(section.id, { content: e.target.value })}
            placeholder="Scoping notes, requirements, decisions, links..."
            rows={8}
            className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 resize-y placeholder-gray-400"
          />
        </div>
      ))}
    </div>
  )
}

// ─── Open Questions Tab ──────────────────────────────────────────────────────

function OpenQuestionsTab({ tab, onUpdate, selectedWeek }) {
  const data = getWeekData(tab, selectedWeek)

  const touch = useCallback((updates) => {
    onUpdate({
      ...tab,
      lastUpdated: new Date().toISOString(),
      weeks: { ...tab.weeks, [selectedWeek]: { ...data, ...updates } },
    })
  }, [tab, onUpdate, selectedWeek, data])

  return (
    <div className="space-y-6">
      <section>
        <SectionHeader>Open Questions</SectionHeader>
        <textarea value={data.questions || ''} onChange={(e) => touch({ questions: e.target.value })}
          placeholder="Questions that need answers, things to investigate...&#10;- Who owns X?&#10;- What's the status of Y?&#10;- Need to clarify Z with team"
          rows={10}
          className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 resize-y placeholder-gray-400" />
      </section>

      <section>
        <SectionHeader>Resolved / Answered</SectionHeader>
        <textarea value={data.resolved || ''} onChange={(e) => touch({ resolved: e.target.value })}
          placeholder="Questions that have been answered this week..."
          rows={5}
          className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 resize-y placeholder-gray-400" />
      </section>
    </div>
  )
}

// ─── Tab Content Router ──────────────────────────────────────────────────────

function TabContent({ tab, onUpdate }) {
  const [selectedWeek, setSelectedWeek] = useState(currentWeekKey)
  const isWeekly = tab.type !== TAB_TYPES.GENERAL_NOTES

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{tab.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{TAB_TYPE_LABELS[tab.type]}</span>
            <span className="text-xs text-gray-400">Updated {formatTimestamp(tab.lastUpdated)}</span>
          </div>
        </div>
        {isWeekly && <WeekNav weeks={tab.weeks} selectedWeek={selectedWeek} onSelect={setSelectedWeek} />}
      </div>

      {/* Type-specific content */}
      {tab.type === TAB_TYPES.DATA_ENG && <DataEngTab tab={tab} onUpdate={onUpdate} selectedWeek={selectedWeek} />}
      {tab.type === TAB_TYPES.ONE_ON_ONE && <OneOnOneTab tab={tab} onUpdate={onUpdate} selectedWeek={selectedWeek} />}
      {tab.type === TAB_TYPES.STAKEHOLDER && <StakeholderTab tab={tab} onUpdate={onUpdate} selectedWeek={selectedWeek} />}
      {tab.type === TAB_TYPES.GENERAL_NOTES && <GeneralNotesTab tab={tab} onUpdate={onUpdate} />}
      {tab.type === TAB_TYPES.OPEN_QUESTIONS && <OpenQuestionsTab tab={tab} onUpdate={onUpdate} selectedWeek={selectedWeek} />}
    </div>
  )
}

// ─── Search ──────────────────────────────────────────────────────────────────

function SearchResults({ results, tabs, onNavigate, onClose }) {
  if (results.length === 0) return <div className="p-4 text-sm text-gray-500">No results found.</div>
  return (
    <div className="max-h-80 overflow-y-auto">
      {results.map((r, i) => {
        const tab = tabs.find((t) => t.id === r.tabId)
        return (
          <button key={i} onClick={() => { onNavigate(r.tabId); onClose() }}
            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0">
            <div className="text-xs text-gray-400 mb-0.5">{tab?.name} &middot; {r.section} &middot; {r.week}</div>
            <div className="text-sm text-gray-700 line-clamp-2">{r.snippet}</div>
          </button>
        )
      })}
    </div>
  )
}

function searchAllTabs(tabs, query) {
  const q = query.toLowerCase()
  const results = []

  tabs.forEach((tab) => {
    // Search General Notes sections
    if (tab.type === TAB_TYPES.GENERAL_NOTES) {
      const sections = tab.weeks?._sections || []
      sections.forEach((sec) => {
        if (sec.title?.toLowerCase().includes(q) || sec.content?.toLowerCase().includes(q)) {
          results.push({ tabId: tab.id, section: sec.title, week: 'persistent', snippet: (sec.content || '').split('\n').find((l) => l.toLowerCase().includes(q))?.trim() || sec.title })
        }
      })
      return
    }

    // Search weekly data
    Object.entries(tab.weeks || {}).forEach(([wk, data]) => {
      if (wk.startsWith('_')) return
      const weekLabel = formatWeekLabel(wk)

      // Search text fields
      for (const [key, val] of Object.entries(data)) {
        if (typeof val === 'string' && val.toLowerCase().includes(q)) {
          const line = val.split('\n').find((l) => l.toLowerCase().includes(q))?.trim() || val.slice(0, 80)
          results.push({ tabId: tab.id, section: key.replace(/([A-Z])/g, ' $1').trim(), week: weekLabel, snippet: line })
        }
        if (Array.isArray(val)) {
          val.forEach((item) => {
            const match = [item.jira, item.context, item.description].filter(Boolean).join(' ').toLowerCase()
            if (match.includes(q)) {
              results.push({ tabId: tab.id, section: 'JIRA Items', week: weekLabel, snippet: `${item.jira || ''} — ${item.context || item.description || ''}`.trim() })
            }
          })
        }
      }
    })
  })

  return results
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [tabs, setTabs] = useState(() => {
    const saved = loadData()
    if (saved?.tabs?.length) return saved.tabs
    return DEFAULT_TABS.map((d) => createTab(d.name, d.type))
  })
  const [activeTabId, setActiveTabId] = useState(() => {
    const saved = loadData()
    return saved?.activeTabId || tabs[0]?.id
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [editingTabId, setEditingTabId] = useState(null)
  const [dragIdx, setDragIdx] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showNewTabMenu, setShowNewTabMenu] = useState(false)
  const searchRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => { saveData({ tabs, activeTabId }) }, [tabs, activeTabId])

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50) }
      if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery('') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const addTab = (type) => {
    const t = createTab('New Tab', type)
    setTabs((prev) => [...prev, t])
    setActiveTabId(t.id)
    setEditingTabId(t.id)
    setShowNewTabMenu(false)
  }

  const renameTab = (id, name) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, name, lastUpdated: new Date().toISOString() } : t)))
    setEditingTabId(null)
  }

  const deleteTab = (id) => {
    if (tabs.length <= 1) return
    const idx = tabs.findIndex((t) => t.id === id)
    const next = tabs[idx === 0 ? 1 : idx - 1]
    setTabs((prev) => prev.filter((t) => t.id !== id))
    if (activeTabId === id) setActiveTabId(next.id)
  }

  const updateTab = useCallback((updated) => {
    setTabs((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
  }, [])

  const handleDragStart = (idx) => setDragIdx(idx)
  const handleDragOver = (e, idx) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    setTabs((prev) => { const next = [...prev]; const [m] = next.splice(dragIdx, 1); next.splice(idx, 0, m); return next })
    setDragIdx(idx)
  }
  const handleDragEnd = () => setDragIdx(null)

  const searchResults = searchQuery.trim().length < 2 ? [] : searchAllTabs(tabs, searchQuery)

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ tabs, activeTabId, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `dpm-dashboard-${new Date().toISOString().slice(0, 10)}.json`
    a.click(); URL.revokeObjectURL(url)
  }

  const importData = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (data.tabs?.length) { setTabs(data.tabs); setActiveTabId(data.activeTabId || data.tabs[0].id) }
      } catch { alert('Invalid JSON file.') }
    }
    reader.readAsText(file); e.target.value = ''
  }

  const activeTab = tabs.find((t) => t.id === activeTabId)

  const TYPE_ICONS = {
    [TAB_TYPES.DATA_ENG]: '⚙',
    [TAB_TYPES.ONE_ON_ONE]: '👥',
    [TAB_TYPES.STAKEHOLDER]: '🤝',
    [TAB_TYPES.GENERAL_NOTES]: '📝',
    [TAB_TYPES.OPEN_QUESTIONS]: '❓',
  }

  return (
    <div className="flex h-screen bg-white text-gray-900 font-['Inter',system-ui,sans-serif]">
      {/* Sidebar */}
      <aside className={`flex flex-col border-r border-gray-200 bg-gray-50/80 transition-all duration-200 ${sidebarCollapsed ? 'w-12' : 'w-64'} shrink-0`}>
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          {!sidebarCollapsed && <span className="text-sm font-semibold text-gray-700 truncate">DPM Dashboard</span>}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarCollapsed
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />}
            </svg>
          </button>
        </div>

        {!sidebarCollapsed && (
          <nav className="flex-1 overflow-y-auto py-2">
            {tabs.map((tab, idx) => (
              <div key={tab.id} draggable onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)} onDragEnd={handleDragEnd}
                onClick={() => setActiveTabId(tab.id)}
                className={`group flex items-center gap-2 px-3 py-2 mx-1 rounded-md cursor-pointer text-sm transition-colors ${activeTabId === tab.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
                <span className="text-xs shrink-0 opacity-60 cursor-grab" title="Drag to reorder">{TYPE_ICONS[tab.type] || '📄'}</span>
                {editingTabId === tab.id ? (
                  <input autoFocus defaultValue={tab.name}
                    onBlur={(e) => renameTab(tab.id, e.target.value || tab.name)}
                    onKeyDown={(e) => { if (e.key === 'Enter') renameTab(tab.id, e.target.value || tab.name) }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 text-sm bg-white border border-blue-300 rounded px-1 py-0.5 outline-none min-w-0" />
                ) : (
                  <span className="flex-1 truncate" onDoubleClick={(e) => { e.stopPropagation(); setEditingTabId(tab.id) }} title={tab.name}>
                    {tab.name}
                  </span>
                )}
                {tabs.length > 1 && (
                  <button onClick={(e) => { e.stopPropagation(); deleteTab(tab.id) }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all" title="Delete tab">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </nav>
        )}

        {!sidebarCollapsed && (
          <div className="border-t border-gray-200 p-2 space-y-1">
            <div className="relative">
              <button onClick={() => setShowNewTabMenu(!showNewTabMenu)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Tab
              </button>
              {showNewTabMenu && (
                <div className="absolute bottom-full left-0 mb-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  {Object.entries(TAB_TYPE_LABELS).map(([type, label]) => (
                    <button key={type} onClick={() => addTab(type)}
                      className="w-full text-left px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                      <span className="text-xs">{TYPE_ICONS[type]}</span> {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={exportData} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export JSON
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import JSON
            </button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={importData} className="hidden" />
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 px-6 py-3 border-b border-gray-200 bg-white">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input ref={searchRef} type="text" value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true) }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search across all tabs... (Ctrl+K)"
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 placeholder-gray-400" />
            {searchOpen && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <SearchResults results={searchResults} tabs={tabs}
                  onNavigate={(id) => setActiveTabId(id)}
                  onClose={() => { setSearchOpen(false); setSearchQuery('') }} />
              </div>
            )}
          </div>
          <div className="text-xs text-gray-400">
            {tabs.length} tab{tabs.length !== 1 && 's'}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {activeTab ? (
            <TabContent key={activeTab.id} tab={activeTab} onUpdate={updateTab} />
          ) : (
            <div className="text-gray-400 text-center mt-20">Select a tab to get started.</div>
          )}
        </main>
      </div>

      {/* Click-away overlays */}
      {searchOpen && <div className="fixed inset-0 z-40" onClick={() => { setSearchOpen(false); setSearchQuery('') }} />}
      {showNewTabMenu && <div className="fixed inset-0 z-10" onClick={() => setShowNewTabMenu(false)} />}
    </div>
  )
}
