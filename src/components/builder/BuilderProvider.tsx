"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  PALETTES,
  TYPES,
  defaultBuilderConfig,
  parseBuilderConfig,
  type BuilderConfig,
  type BusinessType,
  type StyleId,
} from "@/lib/builder/config";

const STORAGE_KEY = "axora-builder-v1";
const LOGO_KEY = "axora-builder-logo-v1";

export type BuilderLogo = { url: string; name: string; file: File } | null;

type Ctx = {
  config: BuilderConfig;
  /** False until sessionStorage has been read, so pages can avoid a flash of defaults. */
  ready: boolean;
  setType: (t: BusinessType) => void;
  setStyle: (s: StyleId) => void;
  setPalette: (id: (typeof PALETTES)[number]["id"]) => void;
  setColor: (k: keyof BuilderConfig["colors"], hex: string) => void;
  /** Back to the default palette, leaving everything else as it is. */
  resetColors: () => void;
  setText: (k: "name" | "headline" | "desc" | "cta", v: string) => void;
  reset: () => void;
  /** Marks the current settings as chosen, even if nothing was changed. */
  commit: () => void;
  /** Stays in this browser until the order is submitted, when it becomes a normal attachment. */
  logo: BuilderLogo;
  setLogo: (file: File | null) => void;
};

const BuilderContext = createContext<Ctx | null>(null);

function clearStoredLogo() {
  try {
    sessionStorage.removeItem(LOGO_KEY);
  } catch {
    /* storage unavailable */
  }
}

/**
 * One typed builder state for the whole site. It survives client-side route
 * changes (context) and reloads within the tab (sessionStorage), so the
 * order form receives exactly what the preview showed.
 */
export function BuilderProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<BuilderConfig>(() => defaultBuilderConfig());
  const [ready, setReady] = useState(false);
  const [logo, setLogoState] = useState<BuilderLogo>(null);
  const logoRef = useRef<BuilderLogo>(null);

  const showLogo = useCallback((file: File | null) => {
    if (logoRef.current) URL.revokeObjectURL(logoRef.current.url);
    const next = file ? { url: URL.createObjectURL(file), name: file.name, file } : null;
    logoRef.current = next;
    setLogoState(next);
    return next;
  }, []);

  useEffect(() => {
    try {
      const saved = parseBuilderConfig(JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null"));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage once after mount
      if (saved) setConfig(saved);
      const storedLogo = JSON.parse(sessionStorage.getItem(LOGO_KEY) ?? "null") as { name: string; type: string; data: string } | null;
      if (storedLogo) {
        fetch(storedLogo.data)
          .then((res) => res.blob())
          .then((blob) => {
            if (!logoRef.current) showLogo(new File([blob], storedLogo.name, { type: storedLogo.type }));
          })
          .catch(clearStoredLogo);
      }
    } catch {
      /* storage unavailable — defaults are fine */
    }
    setReady(true);
  }, [showLogo]);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      /* ignore */
    }
  }, [config, ready]);

  useEffect(() => () => {
    if (logoRef.current) URL.revokeObjectURL(logoRef.current.url);
  }, []);

  const touch = useCallback((fn: (c: BuilderConfig) => BuilderConfig) => setConfig((c) => ({ ...fn(c), touched: true })), []);

  const value = useMemo<Ctx>(
    () => ({
      config,
      ready,
      logo,
      setType: (type) =>
        touch((c) => {
          const d = TYPES[type];
          return {
            ...c,
            type,
            name: c.edited.name ? c.name : d.name,
            headline: c.edited.headline ? c.headline : d.headline,
            desc: c.edited.desc ? c.desc : d.desc,
            cta: c.edited.cta ? c.cta : d.cta,
          };
        }),
      setStyle: (style) => touch((c) => ({ ...c, style })),
      setPalette: (id) =>
        touch((c) => {
          const p = PALETTES.find((x) => x.id === id)!;
          return { ...c, palette: id, colors: { primary: p.primary, secondary: p.secondary, bg: p.bg } };
        }),
      setColor: (k, hex) => touch((c) => ({ ...c, palette: "custom", colors: { ...c.colors, [k]: hex } })),
      resetColors: () =>
        touch((c) => {
          const p = PALETTES[0];
          return { ...c, palette: p.id, colors: { primary: p.primary, secondary: p.secondary, bg: p.bg } };
        }),
      setText: (k, v) => touch((c) => ({ ...c, [k]: v, edited: { ...c.edited, [k]: true } })),
      commit: () => setConfig((c) => (c.touched ? c : { ...c, touched: true })),
      reset: () => {
        setConfig(defaultBuilderConfig());
        showLogo(null);
        clearStoredLogo();
      },
      setLogo: (file) => {
        const shown = showLogo(file);
        touch((c) => c);
        clearStoredLogo();
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          // A newer choice may have replaced this file while it was being read.
          if (logoRef.current !== shown) return;
          try {
            sessionStorage.setItem(LOGO_KEY, JSON.stringify({ name: file.name, type: file.type, data: reader.result }));
          } catch {
            /* too big for storage: it still works until this tab reloads */
          }
        };
        reader.readAsDataURL(file);
      },
    }),
    [config, ready, logo, touch, showLogo],
  );

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}

export function useBuilder(): Ctx {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilder must be used inside <BuilderProvider>");
  return ctx;
}
