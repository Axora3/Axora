# Home layout fixes — 2026-11-01

Reference: existing home.html/home.pretty.html in this directory. The newly supplied Claude URL requires sign-in, so exact parity with its current version is not verified. Existing uncommitted design work was preserved.

- Matched hero layout and illustration breakpoints at 1024px. Tablet previews use a bounded grid; phone previews stack.
- Portaled the mobile navigation to document.body to escape the sticky header's backdrop-filter containing block. Verified full 844px dialog height at 390px width and open/close behavior.
- Organized footer links into two columns and responsive outer columns.
- Suppressed unknown category counts during loading/failure rather than displaying false zeros.
- Added arrow/Home/End keyboard navigation to the home content tabs; verified selected state after ArrowRight.

Browser checks: home document has no horizontal overflow at 360, 390, 768, 900, 1024, 1100, and 1440px. Mobile screenshot: mobile-menu-fixed.png. Viewport override reset after checks.

TypeScript and git diff whitespace checks passed. Production compilation and TypeScript passed, but prerendering /blog failed when src/lib/content/service.ts could not read Supabase site_content. Published template data also failed to load locally; populated catalog states were not verified. No backend credentials, policies, or stored content changed.
