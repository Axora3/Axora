import { ImageResponse } from "next/og";
import { MONOGRAM_PATH, WORDMARK_PATH } from "@/components/brand/AxoraLogo";

export const alt = "AXORA — Бэлэн загвар ба захиалгат веб";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0f172a",
          color: "#f5f4ee",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="62" height="60" viewBox="0 0 64 60" fill="#c0c7d0"><path d={MONOGRAM_PATH} /></svg>
          <svg width="240" height="44" viewBox="0 0 278 50" fill="#f5f5f7"><path fillRule="evenodd" d={WORDMARK_PATH} /></svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 64, lineHeight: 1.1, fontWeight: 800 }}>Бэлэн загвар ба</div>
          <div style={{ fontSize: 64, lineHeight: 1.1, fontWeight: 800, color: "#93b4f5" }}>захиалгат веб</div>
          <div style={{ marginTop: 12, fontSize: 27, color: "#c4d2c8" }}>Санаагаа дараагийн түвшинд.</div>
        </div>
        <div style={{ width: 120, height: 7, borderRadius: 8, background: "#93b4f5" }} />
      </div>
    ),
    size,
  );
}
