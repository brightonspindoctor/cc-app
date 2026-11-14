// Local-only persistence and date helpers.
const KEY = "cc-app-v1";

export function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: keep going in memory */
  }
}

// Allow ?date=YYYY-MM-DD for testing.
export function todayKey() {
  const q = new URLSearchParams(location.search).get("date");
  if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) return q;
  const d = new Date();
  return toKey(d);
}

export function toKey(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function fromKey(k) {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(k, n) {
  const d = fromKey(k);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function daysBetween(a, b) {
  return Math.round((fromKey(b) - fromKey(a)) / 86400000);
}

export function prettyDate(k) {
  return fromKey(k).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

// Streak = consecutive done days ending today, or ending yesterday if today isn't done yet.
export function streak(doneDays = [], today) {
  const set = new Set(doneDays);
  let k = set.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (set.has(k)) {
    n++;
    k = addDays(k, -1);
  }
  return n;
}

export function bestStreak(doneDays = []) {
  const sorted = [...new Set(doneDays)].sort();
  let best = 0, run = 0, prev = null;
  for (const k of sorted) {
    run = prev && daysBetween(prev, k) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  return best;
}
