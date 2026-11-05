# Regen icon migration

Historical initial migration report. See [ADMIN_ICON_MIGRATION.md](ADMIN_ICON_MIGRATION.md) for the subsequent admin audit, semantic refinements, and the current 56-asset sprite.

Replaced 153 old icon definitions/occurrences: 43 custom icon definitions (84 direct JSX call sites plus dynamic navigation/configuration consumers), the shared logo mark, six standalone inline SVGs, 75 text-symbol occurrences, four payment status symbols, five warning/information occurrences, one builder error symbol, the favicon, nine product/category badges (six in Hero and three category mappings), and eight CSS status indicators.

Integrated 49 SVG assets (48 outline and filled heart) in one generated sprite. All original SVG geometry is preserved. No dependencies added or removed.

## Mapping

- ArrowRight → outline/arrow-right.svg
- ArrowLeft → outline/arrow-left.svg
- ChevronLeft → outline/chevron-left.svg
- ChevronDown → outline/chevron-down.svg
- Close → outline/x.svg
- Menu → outline/menu.svg
- MenuShort → outline/menu.svg
- Plus → outline/plus.svg
- Check → outline/check.svg
- Search → outline/search.svg
- SearchEmpty → outline/search.svg
- Info → outline/info-circle.svg
- Alert → outline/circle-alert.svg
- Upload → outline/upload.svg
- Download → outline/download.svg
- Refresh → outline/refresh.svg
- Desktop → outline/monitor.svg
- Tablet → outline/tablet.svg
- Phone → outline/smartphone.svg
- Home → outline/home.svg
- Grid → outline/layout-grid.svg
- Sliders → outline/adjustments.svg
- Form → outline/file-text.svg
- PhoneCall → outline/phone.svg
- Mail → outline/mail.svg
- Chat → outline/message.svg
- Clock → outline/clock.svg
- Pages → outline/copy.svg
- Gear → outline/settings.svg
- Image → outline/photo.svg
- Globe → outline/globe.svg
- File → outline/file-text.svg
- Sun → outline/sun.svg
- Moon → outline/moon.svg
- Dashboard → outline/layout-grid.svg
- Inbox → outline/inbox.svg
- Box → outline/cube.svg
- More → outline/dots.svg
- Pencil → outline/pencil.svg
- Filter → outline/filter.svg
- Copy → outline/copy.svg
- Lock → outline/lock.svg
- Monitor → outline/monitor.svg
- Logos/favicon → letter-a; favorites → heart / heart-filled; payment card → credit-card; compare → swap; external links → external-link.
- Text actions → arrow-left, arrow-right, x, check, plus, chevron-down.
- Product/category badges → table (Excel), file-text (Notion), photo (Canva), monitor (custom websites). Regen has no product-brand logos; semantic icons accompany the unchanged brand labels.
- Payment statuses → minus, clock, circle-alert, check.
- Status dots → circle-record; empty state → diamond; reorder controls → arrow-up / arrow-down.

Closest matches: MenuShort → menu, SearchEmpty → search, Form/File → file-text, Dashboard → layout-grid, Pages → copy, brand mark → letter-a. No missing asset or generic fallback.

## Modified source files

- src/components/home/Hero.tsx
- src/components/home/Categories.tsx
- src/components/site/EmptyState.tsx
- src/app/admin/(panel)/content/page.tsx
- src/app/admin/(panel)/layout.tsx
- src/app/admin/(panel)/marketing/page.tsx
- src/app/admin/(panel)/notifications/page.tsx
- src/app/admin/(panel)/orders/page.tsx
- src/app/admin/(panel)/orders/[id]/page.tsx
- src/app/admin/(panel)/page.tsx
- src/app/admin/(panel)/projects/[id]/page.tsx
- src/app/admin/(panel)/template-requests/page.tsx
- src/app/admin/(panel)/template-requests/[id]/page.tsx
- src/app/admin/(panel)/templates/page.tsx
- src/app/admin/login/page.tsx
- src/components/admin/AdminShell.tsx
- src/components/admin/client.tsx
- src/components/admin/ContentEditor.tsx
- src/components/admin/DashboardInsights.tsx
- src/components/admin/forms.tsx
- src/components/admin/LibraryEditor.tsx
- src/components/admin/OrderStatusControl.tsx
- src/components/admin/ProductControls.tsx
- src/components/admin/ProjectControls.tsx
- src/components/admin/RequestControls.tsx
- src/components/admin/TemplateEditor.tsx
- src/components/admin/ui.tsx
- src/components/builder/Builder.tsx
- src/components/content/LibraryBrowser.tsx
- src/components/content/LibraryPages.tsx
- src/components/home/HowItWorks.tsx
- src/components/icons.tsx
- src/components/order/OrderForm.tsx
- src/components/templates/Collections.tsx
- src/components/templates/TemplateCard.tsx
- src/components/templates/TemplateCollectionActions.tsx
- src/components/ui/Notice.tsx
- src/components/ui/Toast.tsx
- src/lib/admin/labels.ts
- src/app/icon.svg
- src/components/ui/icon.tsx (new)
- src/components/ui/icon-names.ts (generated)
- public/icons/regen.svg (generated)
- public/icons/REGEN-LICENSE.txt
- scripts/generate-regen-icons.mjs
- scripts/check-regen-icons.mjs

## Maintenance

Run `node scripts/generate-regen-icons.mjs` after changing the audited asset mapping. The tracked `vendor/regen-icons` snapshot contains the original SVGs copied from the local Regen repository, plus its license and provenance. The checked-in sprite works without runtime filesystem access or extra dependencies.

Decorative icons default to aria-hidden. Supply label, aria-label, or aria-labelledby for meaningful icons; size defaults to 20 and SVG attributes, CSS classes and color are supported. Existing explicit sizes and stroke widths are retained, except sidebar icons standardized to 20px. Tiny status markers retain their original footprint.

Prose arrows (status transitions and setup instructions), text initials, color swatches, and decorative illustrations are not icon implementations.

## Verification

- `npx tsc --noEmit`: passed.
- `npm run lint`: passed with three pre-existing unused-variable warnings in the vendored Regen generator. Targeted lint of all application source and both new scripts: clean.
- `npm run build`: passed, including all 50 generated pages. The first sandboxed attempt could not fetch Google Fonts; the network-enabled build succeeded without changing fonts or application configuration.
- `node scripts/check-regen-icons.mjs`: passed. Verifies all 49 symbol bodies against their actual source files, unique IDs, literal references, absence of standalone legacy SVG components, and decorative/meaningful rendering, labels, size, color and classes.
- `git diff --check`: passed.
- Browser: visually inspected homepage icons, mobile order page/menu (390px), tablet builder/preview (768px), desktop builder/device controls and admin preview/sidebar (1440px). No horizontal overflow in the measured views. Opened/closed the mobile menu and admin status dialog; switched the builder to mobile and verified its pressed state.
- Scope limits: source audit and production compilation cover all routes; not every route or data-dependent action was exercised in a browser. Supabase-backed content was unavailable in the sandboxed preview, and authenticated admin workflows were checked through the existing development preview rather than a signed-in session. No orders, payments, publications, or remote records were changed during verification.
