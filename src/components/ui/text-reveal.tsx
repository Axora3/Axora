/**
 * Word-by-word entrance. The idea follows Motion Primitives TextEffect (MIT,
 * ibelick), done in CSS so the headline is server-rendered and ships no JS.
 * Screen readers get the whole phrase; the split words are presentational.
 */
export function TextReveal({ text, start = 0, className = "" }: { text: string; start?: number; className?: string }) {
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split(/\s+/).filter(Boolean).map((word, index) => (
          <span key={`${word}-${index}`} className="ax-word" style={{ "--i": start + index } as React.CSSProperties}>
            {word}&nbsp;
          </span>
        ))}
      </span>
    </span>
  );
}
