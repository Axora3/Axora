# AXORA visual QA log

Updated: 2026-10-30

## Reference set

- `design-references/design-1/`: 76 PNG screenshots.
- `design-references/design-2/`: 39 PNG screenshots.
- All 115 files were included in the labeled contact sheets under `design-references/inspection/` and visually reviewed for page, theme, and viewport coverage. `REDESIGN_PROGRESS.md` contains the complete image-to-route/exception mapping.
- Dark screens are theme variants. The mobile screenshot files with 2× pixel widths (780px, 720px) correspond to 390px and 360px CSS viewports.

## Live preview

| Route | Viewport | Result |
|---|---:|---|
| `/` | 1280px browser width | Main hero composition and light cream/green/lime palette visually align with the reference. This was a spot check, not an exact 1440px comparison. The preview also rendered in dark mode before selecting light mode, confirming the theme control changes the palette. |
| `/templates` | 1280px browser width | Catalog header and page structure rendered. Supabase fetch failed, so the product list displayed the designed error state and product cards could not be compared. |
| `/favorites` | 1280px browser width | Route and shared header rendered; the page stayed on its loading fallback because the content request did not resolve in the local environment. |
| Protected admin pages | Not exercised with a live account | No admin login was attempted. `/dev/admin-preview` uses synthetic data and explicitly rejects writes; it is not evidence of data-backed admin visual parity. |

The local preview was stopped before `next build`. Browser testing was not run at the exact 1440, 1024, 768, 390, or 375 CSS widths. Full-page screenshots at reference dimensions and a comparison pass for all routes remain outstanding.

## Functional and data limits observed

- The configured Supabase requests failed from the local network environment. Dynamic product and content states, empty/error transitions, and browser-storage interactions with real catalog data could not be verified.
- No live QPay integration, customer checkout/account/history/delivery/notification/tracking routes, project/support backend, or approved estimator pricing rules were confirmed in the current code. The design-only prototype states must not be represented as live success.
- Several design references are payment simulations or Phase 5/6 documentation rather than production routes. Exceptions are enumerated in `REDESIGN_PROGRESS.md`.

## Checks

- `npx tsc --noEmit` — passed.
- `npm run lint` — passed.
- `git diff --check` — passed; Git emitted only LF-to-CRLF notices for existing modified source files.
- `npm run build` — failed before compilation because Next.js could not download Cormorant Garamond, Lora, Manrope, Onest, and Rubik from `fonts.googleapis.com`. No code compilation error was reported before the font download failures.
