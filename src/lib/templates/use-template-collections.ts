"use client";

import { useMemo, useSyncExternalStore } from "react";

const FAVORITES = "axora-template-favorites";
const COMPARE = "axora-template-comparison";
const EVENT = "axora-collections-change";
const memory = new Map<string, string>();
function read(key: string) {
  try { return localStorage.getItem(key) ?? memory.get(key) ?? "[]"; }
  catch { return memory.get(key) ?? "[]"; }
}
function ids(raw: string): string[] {
  try { const v: unknown = JSON.parse(raw); return Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string"))] : []; }
  catch { return []; }
}
function write(key: string, value: string[]) {
  const raw = JSON.stringify(value);
  memory.set(key, raw);
  try { localStorage.setItem(key, raw); } catch { /* Keep this tab usable when storage is disabled. */ }
  window.dispatchEvent(new Event(EVENT));
}
function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(EVENT, callback); window.removeEventListener("storage", callback); };
}
const empty = () => "[]";
const favoritesSnapshot = () => read(FAVORITES);
const compareSnapshot = () => read(COMPARE);
function toggle(key: string, id: string, limit = Infinity) {
  const current = ids(read(key));
  write(key, current.includes(id) ? current.filter(x => x !== id) : current.length < limit ? [...current, id] : current);
}

/** One store keeps cards, detail pages and other tabs in sync. */
export function useTemplateCollections() {
  const f = useSyncExternalStore(subscribe, favoritesSnapshot, empty);
  const c = useSyncExternalStore(subscribe, compareSnapshot, empty);
  const favorites = useMemo(() => ids(f), [f]);
  const comparison = useMemo(() => ids(c).slice(0, 3), [c]);
  return {
    favorites, comparison, ready: true,
    toggleFavorite: (id: string) => toggle(FAVORITES, id),
    toggleComparison: (id: string) => toggle(COMPARE, id, 3),
    clearFavorites: () => write(FAVORITES, []),
    clearComparison: () => write(COMPARE, []),
  };
}
