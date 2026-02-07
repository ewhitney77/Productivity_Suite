export function getWeekKey(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export function getWeekLabel(weekKey) {
  const start = new Date(weekKey + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 4);
  const opts = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`;
}

export function getPreviousWeeks(count = 8) {
  const weeks = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    weeks.push(getWeekKey(d));
  }
  return [...new Set(weeks)];
}

export function rolloverItems(items, currentWeek, previousWeek) {
  if (!items || !items[previousWeek]) return items;
  const prev = items[previousWeek] || [];
  const curr = items[currentWeek] || [];
  const openFromPrev = prev.filter(item => item.status !== 'done' && item.status !== 'closed');
  const existingIds = new Set(curr.map(i => i.id));
  const toRollover = openFromPrev.filter(i => !existingIds.has(i.id));
  return {
    ...items,
    [currentWeek]: [...curr, ...toRollover.map(i => ({ ...i, rolledOver: true }))],
  };
}
