import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'dpm-dashboard-data'
const JIRA_BASE_URL = 'https://cyberark.atlassian.net/browse/'

const DEFAULT_TABS = [
  'Data Engineering Priorities',
  'CS & Product Open Items & Sync',
  'Finance Open Items & Sync',
  'Ethan x George 1x1',
  'High Priority Items In Flight',
  'Open Questions for Discovery',
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createTab(name) {
  return {
    id: crypto.randomUUID(),
    name,
    lastUpdated: new Date().toISOString(),
    meetingPrep: '',
    notes: '',
    items: [],
  }
}

function createItem() {
  return {
    id: crypto.randomUUID(),
    description: '',
    priority: 'Medium',
    jira: '',
    status: 'Open',
    createdAt: new Date().toISOString(),
  }
}

function formatTimestamp(iso) {
  if (!iso) return 'Never'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function renderJiraLinks(text) {
  if (!text) return null
  const jiraPattern = /([A-Z][A-Z0-9]+-\d+)/g
  const parts = text.split(jiraPattern)
  return parts.map((part, i) => {
    if (/^[A-Z][A-Z0-9]+-\d+$/.test(part)) {
      return (
        <a
          key={i}
          href={`${JIRA_BASE_URL}${part}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-600"
        >
          {part}
        </a>
      )
    }
    return <span key={i}>{part}</span>
  })
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return null
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// ─── Components ──────────────────────────────────────────────────────────────

function SearchResults({ results, tabs, onNavigate, onClose }) {
  if (results.length === 0) return <div className="p-4 text-sm text-gray-500">No results found.</div>

  return (
    <div className="max-h-80 overflow-y-auto">
      {results.map((r, i) => {
        const tab = tabs.find((t) => t.id === r.tabId)
        return (
          <button
            key={i}
            onClick={() => { onNavigate(r.tabId); onClose() }}
            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0"
          >
            <div className="text-xs text-gray-400 mb-0.5">{tab?.name} &middot; {r.section}</div>
            <div className="text-sm text-gray-700 line-clamp-2">{r.snippet}</div>
          </button>
        )
      })}
    </div>
  )
}

function OpenItemRow({ item, onChange, onDelete }) {
  const isDone = item.status === 'Done'

  return (
    <div className={`group flex items-start gap-3 p-3 rounded-lg border transition-colors ${isDone ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
      <div className="flex-1 min-w-0 space-y-2">
        <input
          type="text"
          value={item.description}
          onChange={(e) => onChange({ ...item, description: e.target.value })}
          placeholder="Describe the item..."
          className={`w-full text-sm bg-transparent border-0 outline-none placeholder-gray-400 ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={item.priority}
            onChange={(e) => onChange({ ...item, priority: e.target.value })}
            className={`text-xs font-medium px-2 py-0.5 rounded-full border cursor-pointer outline-none ${PRIORITY_COLORS[item.priority]}`}
          >
            {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={item.status}
            onChange={(e) => onChange({ ...item, status: e.target.value })}
            className={`text-xs font-medium px-2 py-0.5 rounded-full cursor-pointer outline-none ${STATUS_COLORS[item.status]}`}
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">JIRA:</span>
            <input
              type="text"
              value={item.jira}
              onChange={(e) => onChange({ ...item, jira: e.target.value.toUpperCase() })}
              placeholder="DATA-1234"
              className="text-xs w-24 bg-transparent border-0 border-b border-dashed border-gray-300 outline-none text-gray-600 placeholder-gray-300 focus:border-blue-400"
            />
            {item.jira && /^[A-Z][A-Z0-9]+-\d+$/.test(item.jira.trim()) && (
              <a
                href={`${JIRA_BASE_URL}${item.jira.trim()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
                title={`Open ${item.jira.trim()} in JIRA`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
        title="Delete item"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}

function TabContent({ tab, onUpdate }) {
  const [hideCompleted, setHideCompleted] = useState(false)

  const touch = useCallback((updates) => {
    onUpdate({ ...tab, ...updates, lastUpdated: new Date().toISOString() })
  }, [tab, onUpdate])

  const updateItem = useCallback((updatedItem) => {
    touch({ items: tab.items.map((it) => (it.id === updatedItem.id ? updatedItem : it)) })
  }, [tab, touch])

  const deleteItem = useCallback((id) => {
    touch({ items: tab.items.filter((it) => it.id !== id) })
  }, [tab, touch])

  const addItem = useCallback(() => {
    touch({ items: [...tab.items, createItem()] })
  }, [tab, touch])

  const visibleItems = hideCompleted ? tab.items.filter((it) => it.status !== 'Done') : tab.items
  const doneCount = tab.items.filter((it) => it.status === 'Done').length

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{tab.name}</h1>
          <p className="text-xs text-gray-400 mt-1">Last updated: {formatTimestamp(tab.lastUpdated)}</p>
        </div>
      </div>

      {/* Meeting Prep */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Meeting Prep / Highlights</h2>
        <textarea
          value={tab.meetingPrep}
          onChange={(e) => touch({ meetingPrep: e.target.value })}
          placeholder="Jot quick bullets to reference in meetings..."
          rows={4}
          className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 resize-y placeholder-gray-400"
        />
      </section>

      {/* Open Items */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Open Items</h2>
          <div className="flex items-center gap-3">
            {doneCount > 0 && (
              <button
                onClick={() => setHideCompleted(!hideCompleted)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                {hideCompleted ? `Show ${doneCount} completed` : `Hide ${doneCount} completed`}
              </button>
            )}
            <button
              onClick={addItem}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {visibleItems.length === 0 && (
            <div className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-lg">
              {hideCompleted ? 'All items are completed.' : 'No items yet. Click "Add Item" to get started.'}
            </div>
          )}
          {visibleItems.map((item) => (
            <OpenItemRow
              key={item.id}
              item={item}
              onChange={updateItem}
              onDelete={() => deleteItem(item.id)}
            />
          ))}
        </div>
      </section>

      {/* Notes / Context */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Notes / Context</h2>
        <textarea
          value={tab.notes}
          onChange={(e) => touch({ notes: e.target.value })}
          placeholder="Longer notes, context, background info..."
          rows={6}
          className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 resize-y placeholder-gray-400"
        />
        {tab.notes && (
          <div className="mt-2 text-sm text-gray-600 whitespace-pre-wrap break-words">
            {renderJiraLinks(tab.notes)}
          </div>
        )}
      </section>
    </div>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [tabs, setTabs] = useState(() => {
    const saved = loadData()
    if (saved?.tabs?.length) return saved.tabs
    return DEFAULT_TABS.map(createTab)
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
  const searchRef = useRef(null)
  const fileInputRef = useRef(null)

  // Persist
  useEffect(() => {
    saveData({ tabs, activeTabId })
  }, [tabs, activeTabId])

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        setTimeout(() => searchRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setSearchQuery('')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── Tab management ──

  const addTab = () => {
    const t = createTab('New Tab')
    setTabs((prev) => [...prev, t])
    setActiveTabId(t.id)
    setEditingTabId(t.id)
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

  // ── Drag reorder ──

  const handleDragStart = (idx) => setDragIdx(idx)

  const handleDragOver = (e, idx) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    setTabs((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIdx, 1)
      next.splice(idx, 0, moved)
      return next
    })
    setDragIdx(idx)
  }

  const handleDragEnd = () => setDragIdx(null)

  // ── Search ──

  const searchResults = searchQuery.trim().length < 2 ? [] : (() => {
    const q = searchQuery.toLowerCase()
    const results = []
    tabs.forEach((tab) => {
      if (tab.meetingPrep?.toLowerCase().includes(q)) {
        const line = tab.meetingPrep.split('\n').find((l) => l.toLowerCase().includes(q)) || tab.meetingPrep.slice(0, 100)
        results.push({ tabId: tab.id, section: 'Meeting Prep', snippet: line.trim() })
      }
      if (tab.notes?.toLowerCase().includes(q)) {
        const line = tab.notes.split('\n').find((l) => l.toLowerCase().includes(q)) || tab.notes.slice(0, 100)
        results.push({ tabId: tab.id, section: 'Notes', snippet: line.trim() })
      }
      tab.items?.forEach((item) => {
        const match = item.description?.toLowerCase().includes(q) || item.jira?.toLowerCase().includes(q)
        if (match) {
          results.push({ tabId: tab.id, section: 'Open Items', snippet: `${item.description}${item.jira ? ` [${item.jira}]` : ''}` })
        }
      })
    })
    return results
  })()

  // ── Import / Export ──

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ tabs, activeTabId, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dpm-dashboard-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (data.tabs?.length) {
          setTabs(data.tabs)
          setActiveTabId(data.activeTabId || data.tabs[0].id)
        }
      } catch {
        alert('Invalid JSON file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const activeTab = tabs.find((t) => t.id === activeTabId)

  return (
    <div className="flex h-screen bg-white text-gray-900 font-['Inter',system-ui,sans-serif]">
      {/* Sidebar */}
      <aside className={`flex flex-col border-r border-gray-200 bg-gray-50/80 transition-all duration-200 ${sidebarCollapsed ? 'w-12' : 'w-64'} shrink-0`}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          {!sidebarCollapsed && <span className="text-sm font-semibold text-gray-700 truncate">DPM Dashboard</span>}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarCollapsed
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              }
            </svg>
          </button>
        </div>

        {/* Tab list */}
        {!sidebarCollapsed && (
          <nav className="flex-1 overflow-y-auto py-2">
            {tabs.map((tab, idx) => (
              <div
                key={tab.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                onClick={() => setActiveTabId(tab.id)}
                className={`group flex items-center gap-2 px-3 py-2 mx-1 rounded-md cursor-pointer text-sm transition-colors ${
                  activeTabId === tab.id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <svg className="w-3.5 h-3.5 opacity-40 group-hover:opacity-70 shrink-0 cursor-grab" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                  <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                  <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
                </svg>
                {editingTabId === tab.id ? (
                  <input
                    autoFocus
                    defaultValue={tab.name}
                    onBlur={(e) => renameTab(tab.id, e.target.value || tab.name)}
                    onKeyDown={(e) => { if (e.key === 'Enter') renameTab(tab.id, e.target.value || tab.name) }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 text-sm bg-white border border-blue-300 rounded px-1 py-0.5 outline-none min-w-0"
                  />
                ) : (
                  <span
                    className="flex-1 truncate"
                    onDoubleClick={(e) => { e.stopPropagation(); setEditingTabId(tab.id) }}
                    title={tab.name}
                  >
                    {tab.name}
                  </span>
                )}
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteTab(tab.id) }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all"
                    title="Delete tab"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </nav>
        )}

        {/* Sidebar footer */}
        {!sidebarCollapsed && (
          <div className="border-t border-gray-200 p-2 space-y-1">
            <button onClick={addTab} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Tab
            </button>
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

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar with search */}
        <header className="flex items-center gap-3 px-6 py-3 border-b border-gray-200 bg-white">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true) }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search across all tabs... (Ctrl+K)"
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 placeholder-gray-400"
            />
            {searchOpen && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <SearchResults
                  results={searchResults}
                  tabs={tabs}
                  onNavigate={(id) => setActiveTabId(id)}
                  onClose={() => { setSearchOpen(false); setSearchQuery('') }}
                />
              </div>
            )}
          </div>
          <div className="text-xs text-gray-400">
            {tabs.length} tab{tabs.length !== 1 && 's'} &middot; {tabs.reduce((n, t) => n + (t.items?.length || 0), 0)} items
          </div>
        </header>

        {/* Tab content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab ? (
            <TabContent tab={activeTab} onUpdate={updateTab} />
          ) : (
            <div className="text-gray-400 text-center mt-20">Select a tab to get started.</div>
          )}
        </main>
      </div>

      {/* Click-away to close search */}
      {searchOpen && (
        <div className="fixed inset-0 z-40" onClick={() => { setSearchOpen(false); setSearchQuery('') }} />
      )}
    </div>
  )
}
