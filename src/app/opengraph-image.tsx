import { ImageResponse } from "next/og";

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
          background: "#173c2d",
          color: "#f5f4ee",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 62, height: 62, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", background: "#d9f279", color: "#173c2d", fontSize: 42, fontWeight: 800 }}>A</div>
          <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: 7 }}>AXORA</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 64, lineHeight: 1.1, fontWeight: 800 }}>Бэлэн загвар ба</div>
          <div style={{ fontSize: 64, lineHeight: 1.1, fontWeight: 800, color: "#d9f279" }}>захиалгат веб</div>
          <div style={{ marginTop: 12, fontSize: 27, color: "#c4d2c8" }}>Санаагаа дараагийн түвшинд.</div>
        </div>
        <div style={{ width: 120, height: 7, borderRadius: 8, background: "#d9f279" }} />
      </div>
    ),
    size,
  );
}
