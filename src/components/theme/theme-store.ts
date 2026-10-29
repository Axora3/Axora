"use client";

import { THEME_COLOR, THEME_KEY, type ThemePref, type ThemeResolved } from "./theme-script";

/*
 * Tiny external store for the theme preference. The inline script in <head>
 * has already applied the theme before hydration; this module keeps it in
 * sync afterwards (user choice, OS changes in "system", other tabs).
 */

const listeners = new Set<() => void>();
const MQ = "(prefers-color-scheme: dark)";

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function resolve(pref: ThemePref): ThemeResolved {
  if (pref !== "system") return pref;
  return window.matchMedia(MQ).matches ? "dark" : "light";
}

function apply(pref: ThemePref) {
  const r = resolve(pref);
  const el = document.documentElement;
  el.setAttribute("data-theme", r);
  el.setAttribute("data-theme-pref", pref);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[r]);
}

let current: ThemePref | null = null;
let wired = false;

function wire() {
  if (wired) return;
  wired = true;
  current = readPref();
  // Re-apply once on the client: also corrects <meta name="theme-color">,
  // which may be streamed after the inline script ran.
  apply(current);
  // OS changes only matter while the preference is "system".
  window.matchMedia(MQ).addEventListener("change", () => {
    if (current === "system") {
      apply("system");
      listeners.forEach((l) => l());
    }
  });
  // Another tab changed the preference.
  window.addEventListener("storage", (e) => {
    if (e.key !== THEME_KEY) return;
    current = readPref();
    apply(current);
    listeners.forEach((l) => l());
  });
}

export function subscribeTheme(cb: () => void) {
  wire();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getThemePref(): ThemePref {
  wire();
  return current ?? "system";
}

export function getResolvedTheme(): ThemeResolved {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function setThemePref(pref: ThemePref) {
  wire();
  current = pref;
  try {
    if (pref === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, pref);
  } catch {
    /* storage blocked: the choice still applies to this page view */
  }
  apply(pref);
  listeners.forEach((l) => l());
}
