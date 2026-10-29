/**
 * Theme preference is a UI setting only: it lives in localStorage, needs no
 * account, and is shared by the public site and the admin (same origin).
 *
 * "system" follows the OS; an explicit "light"/"dark" ignores OS changes.
 */
export const THEME_KEY = "axora-theme";
export type ThemePref = "light" | "dark" | "system";
export type ThemeResolved = "light" | "dark";

export const THEME_COLOR: Record<ThemeResolved, string> = { light: "#F7F8F2", dark: "#0F1512" };

/**
 * Runs synchronously in <head> before first paint, so the page never flashes
 * the wrong theme. Keep it tiny and dependency-free.
 */
export const themeInitScript = `(function(){try{var p=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(p!=="light"&&p!=="dark")p="system";var d=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;e.setAttribute("data-theme",d?"dark":"light");e.setAttribute("data-theme-pref",p);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",d?${JSON.stringify(THEME_COLOR.dark)}:${JSON.stringify(THEME_COLOR.light)});}catch(e){}})()`;
