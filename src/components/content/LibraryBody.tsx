import type { ReactNode } from "react";

type LineBlock = { kind: "paragraph" | "ordered" | "unordered" | "code" | "table" | "quote" | "advice" | "heading"; lines: string[] };

function cells(line: string) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function isTableDivider(line: string) {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

function blocksFor(text: string): LineBlock[] {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: LineBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }

    if (line.startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) code.push(lines[i++]);
      if (i < lines.length) i++;
      blocks.push({ kind: "code", lines: code });
      continue;
    }

    if (line.startsWith("|") && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
      const rows = [line];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(lines[i++].trim());
      blocks.push({ kind: "table", lines: rows });
      continue;
    }

    if (/^#{1,3}\s+/.test(line)) {
      blocks.push({ kind: "heading", lines: [line.replace(/^#{1,3}\s+/, "")] });
      i++;
      continue;
    }

    if (/^\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].trim().replace(/^\d+[.)]\s+/, ""));
      blocks.push({ kind: "ordered", lines: items });
      continue;
    }

    if (/^[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) items.push(lines[i++].trim().replace(/^[-*•]\s+/, ""));
      blocks.push({ kind: "unordered", lines: items });
      continue;
    }

    if (/^Зөвлөгөө\s*:/i.test(line)) {
      blocks.push({ kind: "advice", lines: [line.replace(/^Зөвлөгөө\s*:\s*/i, "")] });
      i++;
      continue;
    }

    if (line.startsWith("> ")) {
      blocks.push({ kind: "quote", lines: [line.slice(2)] });
      i++;
      continue;
    }

    const paragraph = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s+|\d+[.)]\s+|[-*•]\s+|Зөвлөгөө\s*:|> |```|\|)/i.test(lines[i].trim())) paragraph.push(lines[i++].trim());
    blocks.push({ kind: "paragraph", lines: paragraph });
  }

  return blocks;
}

function Table({ rows }: { rows: string[] }) {
  const [head, ...body] = rows.map(cells);
  return <div className="my-6 overflow-x-auto rounded-xl border border-line" tabIndex={0} aria-label="Агуулгын хүснэгт"><table className="w-full min-w-[520px] text-left text-sm"><thead className="bg-soft"><tr>{head.map((cell, i) => <th key={i} scope="col" className="px-4 py-3 font-extrabold">{cell}</th>)}</tr></thead><tbody>{body.map((row, ri) => <tr key={ri} className="border-t border-line">{head.map((_, ci) => <td key={ci} className="px-4 py-3 align-top leading-relaxed">{row[ci] ?? ""}</td>)}</tr>)}</tbody></table></div>;
}

export function LibraryBody({ text, className = "" }: { text: string; className?: string }) {
  const content: ReactNode[] = blocksFor(text).map((block, i) => {
    if (block.kind === "heading") return <h2 key={i} className="mt-8 text-xl font-extrabold leading-tight">{block.lines[0]}</h2>;
    if (block.kind === "ordered") return <ol key={i} className="my-5 list-decimal space-y-3 pl-6 marker:font-extrabold marker:text-brand">{block.lines.map((item, j) => <li key={j} className="pl-1 leading-relaxed">{item}</li>)}</ol>;
    if (block.kind === "unordered") return <ul key={i} className="my-5 list-disc space-y-3 pl-6 marker:text-brand">{block.lines.map((item, j) => <li key={j} className="pl-1 leading-relaxed">{item}</li>)}</ul>;
    if (block.kind === "code") return <pre key={i} className="my-6 overflow-x-auto rounded-xl bg-band p-4 text-sm leading-relaxed text-on-band"><code>{block.lines.join("\n")}</code></pre>;
    if (block.kind === "table") return <Table key={i} rows={block.lines}/>;
    if (block.kind === "quote") return <blockquote key={i} className="my-6 border-l-4 border-brand pl-4 text-lg font-semibold leading-relaxed">{block.lines[0]}</blockquote>;
    if (block.kind === "advice") return <aside key={i} className="my-6 rounded-xl border border-brand/20 bg-soft p-4 sm:p-5"><p className="mb-1 text-sm font-extrabold text-brand">Зөвлөгөө</p><p className="leading-relaxed">{block.lines[0]}</p></aside>;
    return <p key={i} className="leading-[1.8] text-muted">{block.lines.join(" ")}</p>;
  });

  return <div className={className}>{content.length ? content : <p className="text-muted">Агуулга нийтлэгдээгүй байна.</p>}</div>;
}
