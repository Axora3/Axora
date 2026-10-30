# AXORA design-to-code map

Updated: 2026-10-30

## Source of truth

Both user-supplied screenshot archives are now present under `design-references/` and accessible for inspection:

- `design-references/design-1/` — 76 PNGs, core storefront, web services/order flow, templates, checkout/payment prototypes, builder, and admin.
- `design-references/design-2/` — 39 PNGs, expanded marketplace, bundles, saved items, comparison, learning, blog, portfolio, pricing estimate, and Phase 5/6 admin.

The complete 115-image inventory, viewport sizes, route mapping, audit notes, and implementation checklist live in [REDESIGN_PROGRESS.md](REDESIGN_PROGRESS.md). Every image has been visually inspected from labeled contact sheets in `design-references/inspection/`. The older reference-access blocker is resolved; the remaining work is implementation and comparison.

## Project audit

| Area | Current implementation |
|---|---|
| Stack and routing | Next.js 16.4.3 App Router, React 19, TypeScript, Tailwind CSS 4, Supabase. Route pages live under `src/app`. |
| Design system | `src/app/globals.css` contains semantic light/dark tokens, responsive utilities, and shared primitives. Manrope and Lora are the primary typefaces; builder previews use scoped additional fonts. |
| Customer flows | Public catalog and detail, search/filter, favorites/comparison, custom website services, interactive builder, contact, and seven-step website order with 39 questions. |
| Admin flows | Protected Supabase login, dashboard, orders and request management, product editing, site content and library editing, settings, and read-only audit activity. |
| Backend | Supabase SSR sessions, RLS-backed data, server actions/API routes, uploads, admin authorization, audit log, and guarded storage delivery. Do not bypass these by substituting static success states. |

## Screen mapping summary

| Reference screen group | Route(s) | Implementation note |
|---|---|---|
| Home, services, template catalog/detail, builder, custom order | `/`, `/services`, `/templates`, `/templates/[slug]`, `/builder`, `/order` | Existing code; compare with the desktop/tablet/mobile references and preserve working submissions. |
| Favorites, comparison, bundles | `/favorites`, `/compare`, `/bundles`, `/bundles/[slug]` | Routes/components exist in the current tree. Favorites/comparison use local browser storage. Check that bundle content is data-backed. |
| Blog, learning, portfolio | `/blog`, `/blog/[slug]`, `/learn`, `/learn/[slug]`, `/portfolio`, `/portfolio/[slug]` | Public content routes exist; verify against the archive and the admin content source. |
| Website estimate | No matching route found | Reference exists; pricing rules and route behavior need to be implemented from approved data, not invented prices. |
| Checkout, QPay, purchases, invoices, notifications, customer tracking | No matching customer routes found | Screens include prototype/demo states. No live QPay provider or customer purchase/account backend was confirmed; no fake payment or delivery success. |
| Admin dashboard, templates, requests, website orders, content and library | `/admin/*` | Protected workflows exist. Compare layouts and mobile navigation; extend only where supported by real data and actions. |
| Admin projects, support, marketing, campaigns/coupons, versions | Some screen references have no matching domain route/model | Review each against the actual schema before adding management operations. |

## Implementation gates

1. Keep the 115-image inventory complete and update statuses in `REDESIGN_PROGRESS.md` as work is implemented.
2. Reuse the existing routes, components, Supabase schema, server actions, and authorization checks.
3. Treat screenshot-only prototype labels and demo records as visual references, not as permission to claim live provider behavior.
4. Compare each applicable page at reference viewports and record limitations where there is no corresponding data or backend integration.
