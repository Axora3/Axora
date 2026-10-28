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

type Logo = { url: string; name: string } | null;

type Ctx = {
  config: BuilderConfig;
  /** False until sessionStorage has been read, so pages can avoid a flash of defaults. */
  ready: boolean;
  setType: (t: BusinessType) => void;
  setStyle: (s: StyleId) => void;
  setPalette: (id: (typeof PALETTES)[number]["id"]) => void;
  setColor: (k: keyof BuilderConfig["colors"], hex: string) => void;
  setText: (k: "name" | "headline" | "desc" | "cta", v: string) => void;
  reset: () => void;
  /** Marks the current settings as chosen (e.g. “Энэ загвараар үнийн санал авах”). */
  commit: () => void;
  /** Local-only logo preview (object URL). Never uploaded. */
  logo: Logo;
  setLogo: (file: File | null) => void;
};

const BuilderContext = createContext<Ctx | null>(null);

/**
 * One typed builder state for the whole site. It survives client-side route
 * changes (context) and reloads within the tab (sessionStorage), so the
 * order form receives exactly what the preview showed.
 */
export function BuilderProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<BuilderConfig>(() => defaultBuilderConfig());
  const [ready, setReady] = useState(false);
  const [logo, setLogoState] = useState<Logo>(null);
  const logoRef = useRef<Logo>(null);

  useEffect(() => {
    try {
      const saved = parseBuilderConfig(JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null"));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage once after mount
      if (saved) setConfig(saved);
    } catch {
      /* storage unavailable — defaults are fine */
    }
    setReady(true);
  }, []);

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
      setText: (k, v) => touch((c) => ({ ...c, [k]: v, edited: { ...c.edited, [k]: true } })),
      commit: () => setConfig((c) => (c.touched ? c : { ...c, touched: true })),
      reset: () => {
        setConfig(defaultBuilderConfig());
        if (logoRef.current) URL.revokeObjectURL(logoRef.current.url);
        logoRef.current = null;
        setLogoState(null);
      },
      setLogo: (file) => {
        if (logoRef.current) URL.revokeObjectURL(logoRef.current.url);
        const next = file ? { url: URL.createObjectURL(file), name: file.name } : null;
        logoRef.current = next;
        setLogoState(next);
      },
    }),
    [config, ready, logo, touch],
  );

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}

export function useBuilder(): Ctx {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilder must be used inside <BuilderProvider>");
  return ctx;
}
