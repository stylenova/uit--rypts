const KEY = 'crypts.saved.v1';

export function loadSaved() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function saveSaved(ids) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function isSaved(ids, id) {
  return Array.isArray(ids) && ids.includes(id);
}

export function toggleSaved(ids, id) {
  if (!Array.isArray(ids)) return [id];
  return ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];
}
