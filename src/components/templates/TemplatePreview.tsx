import type { PreviewStyle, TemplateCategory } from "@/lib/templates/types";

/**
 * Drawn product mock-ups from the design (Notion board, Canva posts,
 * Excel sheet). Used when a template has no uploaded preview images.
 * "lg" is the gallery size on the detail page.
 */
export function TemplatePreview({ category, s, size = "sm" }: { category: TemplateCategory; s: PreviewStyle; size?: "sm" | "lg" }) {
  const lg = size === "lg";
  const shadow = lg ? "0 20px 40px -24px rgba(23,37,30,.45)" : "0 16px 30px -20px rgba(23,37,30,.45)";

  if (category === "Notion") {
    const cell = lg ? "h-11 rounded-[7px] p-1.5 text-[11px]" : "h-[34px] rounded-md p-[5px] text-[9.5px]";
    const sq = lg ? "h-[13px] w-[13px]" : "h-[11px] w-[11px]";
    const bar = lg ? "h-[7px]" : "h-1.5";
    return (
      <div
        className={`flex w-full flex-col bg-white text-ink ${lg ? "max-w-[320px] gap-2.5 rounded-xl p-[18px]" : "max-w-[250px] gap-2 rounded-[10px] p-3.5"}`}
        style={{ boxShadow: shadow }}
      >
        <div className="flex items-center gap-2">
          <span className={`${lg ? "h-[22px] w-[22px] rounded-md" : "h-[18px] w-[18px] rounded-[5px]"}`} style={{ background: s.accent }} />
          <span className={`font-extrabold ${lg ? "text-[15px]" : "text-xs"}`}>{s.p1}</span>
        </div>
        <div className={`grid grid-cols-3 ${lg ? "gap-2" : "gap-1.5"}`}>
          {[s.c1, s.c2, s.c3].map((c, i) => (
            <span key={i} className={`border border-[#E3E8DF] bg-soft-2 font-bold text-muted ${cell}`}>
              {c}
            </span>
          ))}
        </div>
        {[70, 58, 46].slice(0, lg ? 3 : 2).map((w, i, a) => (
          <div key={w} className="flex items-center gap-2">
            <span
              className={`${sq} rounded-[3px]`}
              style={i < a.length - 1 ? { background: s.accent } : { border: "1.5px solid #9AA89F" }}
            />
            <span className={`${bar} rounded-[3px] bg-[#E3E8DF]`} style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    );
  }

  if (category === "Canva") {
    return (
      <div className={`grid w-full grid-cols-2 ${lg ? "max-w-[340px] gap-3.5" : "max-w-[260px] gap-2.5"}`}>
        <div
          className={`flex aspect-[4/5] flex-col justify-end text-white ${lg ? "rounded-xl p-4" : "rounded-[10px] p-3"}`}
          style={{ background: s.accent, boxShadow: shadow }}
        >
          <span className={`font-extrabold tracking-[0.08em] opacity-85 ${lg ? "text-[10px]" : "text-[9px]"}`}>{s.c1}</span>
          <span className={`serif leading-[1.05] ${lg ? "text-[26px]" : "text-xl"}`}>{s.p1}</span>
        </div>
        <div
          className={`flex aspect-[4/5] flex-col justify-between bg-white ${lg ? "translate-y-[18px] rounded-xl p-4" : "translate-y-3.5 rounded-[10px] p-3"}`}
          style={{ boxShadow: shadow }}
        >
          <span className={`aspect-[1.3] w-full ${lg ? "rounded-lg" : "rounded-md"}`} style={{ background: s.soft }} />
          <span className={`font-extrabold text-ink ${lg ? "text-[13px]" : "text-[11px]"}`}>{s.c2}</span>
        </div>
      </div>
    );
  }

  const pad = lg ? "px-2.5 py-[7px]" : "px-2 py-[5px]";
  const lines = [
    [80, 60, 70],
    [64, 74, 50],
  ];
  return (
    <div
      className={`w-full overflow-hidden bg-white text-ink ${lg ? "max-w-[340px] rounded-[10px] text-[11px]" : "max-w-[270px] rounded-lg text-[9.5px]"}`}
      style={{ boxShadow: shadow }}
    >
      <div className={`font-extrabold text-white ${lg ? "px-3 py-2" : "px-[9px] py-1.5"}`} style={{ background: s.accent }}>
        {s.p1}
      </div>
      <div className="grid grid-cols-[1.2fr_1fr_1fr]">
        {[s.c1, s.c2, s.c3].map((c, i) => (
          <span key={i} className={`bg-[#EEF3EC] font-extrabold ${pad}`}>
            {c}
          </span>
        ))}
        {lines.flatMap((row, r) =>
          row.map((w, i) => (
            <span key={`${r}-${i}`} className={`border-t border-[#E3E8DF] ${pad}`}>
              <span
                className={`mt-[3px] block rounded-[3px] ${lg ? "h-1.5" : "h-[5px]"}`}
                style={{ width: `${w}%`, background: i === 2 ? s.accent : "#D5DED1" }}
              />
            </span>
          )),
        )}
      </div>
      <div className={`flex items-end ${lg ? "h-16 gap-1.5 px-3 pt-2" : "h-11 gap-[5px] px-[9px] pt-1.5"}`}>
        {[50, 75, 62, 95, 70].map((h, i) => (
          <span key={i} className="flex-1 rounded-t-[2px]" style={{ height: `${h}%`, background: i === 3 ? s.accent : s.soft }} />
        ))}
      </div>
    </div>
  );
}
