# AXORAADMIN Regen icon audit

This is the admin follow-up to `ICON_MIGRATION.md`. The original migration already routed most admin icons through Regen. This pass audited all 52 admin source modules (routes, layouts, actions, components, navigation, and status metadata) and their shared icon/dialog/toast/theme dependencies.

## Changes and counts

- **31 admin icon render sites replaced/refined**: 17 compatibility-component usages now call the shared `Icon` directly; two navigation render sites use typed Regen names; seven generic status/publication/action markers now convey their actual state; one breadcrumb separator, two warning marks, one dashboard status legend marker, and one product placeholder were replaced.
- The two navigation sites serve **12 navigation entries**; payments, notifications, and activity now use more specific icons. Routes, labels, badges, active-state logic, and grouping are unchanged.
- Added typed icons to all **nine order/request status definitions**. Existing labels, hints, colors, transitions, and data operations are unchanged.
- Standardized four admin theme-toggle/header usages to 20px; sidebar and mobile icons remain 20px. Table actions are 16px, filter/copy buttons 17–18px, the dashboard alert is 24px. Product placeholder retains its original 20×24 footprint.
- Added **seven outline assets**, bringing the shared sprite to **56 verified source SVGs**: `activity`, `bell`, `chevron-right`, `circle-check`, `circle-x`, `eye`, `eye-off`.
- Restored the numeric `+` in the overdue-hours message: it is textual arithmetic, not an add-action icon.
- No duplicate renderer, packages, API changes, database changes, or authentication changes. No dependencies removed.

## Old → Regen mapping

| Existing implementation/meaning | Regen asset |
| --- | --- |
| Dashboard / Dashboard alias | layout-grid |
| Website orders / Form alias | file-text |
| Template requests / Inbox alias | inbox |
| Products / Box alias | cube |
| Website projects / Globe alias | globe |
| Payments / generic file | credit-card |
| Support / Chat alias | message |
| Marketing and content / Pages alias | copy |
| Notifications / generic inbox | bell |
| Activity / generic clock | activity |
| Settings / Gear alias | settings |
| Close, Menu, ChevronDown | x, menu, chevron-down |
| Copy, Lock, More | copy, lock, dots |
| Filter, Search | filter, search |
| ArrowRight, Pencil, Plus | arrow-right, pencil, plus |
| Generic dot: new order/request | inbox |
| Generic dot: contacted | phone |
| Generic dot: in progress | clock |
| Generic dot: completed/fulfilled | circle-check |
| Generic dot: cancelled | circle-x |
| Generic dot: published/draft | eye / eye-off |
| Breadcrumb slash | chevron-right |
| Text warning `!` | circle-alert (info-circle for informational dashboard notices) |
| CSS product placeholder | table (Excel), photo (Canva), file-text (Notion/default document) |
| Dashboard status legend square | corresponding order-status icon |

No missing mappings. An unknown order status retains its existing text and uses `circle-alert`; unknown product categories use `file-text`. Existing brand initials, file-extension text, chart bars, swatches, switches, and prose transition arrows are content/data visualization, not replacement icons. Text-only actions, empty states, and section headings remain text-only to preserve the existing design.

## Modified admin files in this follow-up

- `src/components/admin/AdminShell.tsx`
- `src/components/admin/nav.ts`
- `src/components/admin/ui.tsx`
- `src/components/admin/FilterSheet.tsx`
- `src/components/admin/OrderStatusControl.tsx`
- `src/components/admin/RequestControls.tsx`
- `src/app/admin/(panel)/page.tsx`
- `src/app/admin/(panel)/orders/page.tsx`
- `src/app/admin/(panel)/template-requests/page.tsx`
- `src/app/admin/(panel)/template-requests/[id]/page.tsx`
- `src/app/admin/(panel)/templates/page.tsx`
- `src/app/admin/login/page.tsx`

Supporting files:

- `src/lib/admin/labels.ts`
- `src/components/theme/ThemeToggle.tsx` (optional size, public-site default unchanged)
- `scripts/generate-regen-icons.mjs`
- `scripts/check-regen-icons.mjs`
- `src/components/ui/icon-names.ts` (generated)
- `public/icons/regen.svg` (generated)
- `vendor/regen-icons/` (56 original source SVGs, license, README, and source provenance; makes generation reproducible on a fresh clone)
- `ADMIN_ICON_MIGRATION.md`, `ICON_MIGRATION.md`

## Verification

- TypeScript: passed (`npx tsc --noEmit`).
- ESLint: no errors; three existing unused-variable warnings in the vendored Regen generator. Targeted lint of application source and icon scripts is clean.
- Production build: passed; all 50 generated pages completed.
- Existing admin tests: **9/9 passed** (`node scripts/test-admin.mjs`).
- Asset/accessibility audit: passed (`node scripts/check-regen-icons.mjs`). Checks all 56 source geometries, literal/configured references, the shared renderer, and all 52 admin modules for old icon imports and text icon substitutes.
- Diff whitespace check: passed.
- Browser: checked desktop sidebar at 1440px, tablet status dialog at 768px, mobile request actions and confirmation dialog at 390px. No horizontal overflow in those measured views. Checked mobile drawer, badges, dialog open/close, and navigation to the dashboard.
- Authentication remained enforced: dashboard navigation redirected to `/admin/login?reason=signin`. No signed-in admin session was available, so data-dependent pages and CRUD buttons were source-audited and compiled, not fully exercised against live records. No payment/order/publication mutations were performed.

## Audited admin modules

- `src/app/admin/(panel)/activity/page.tsx`
- `src/app/admin/(panel)/content/page.tsx`
- `src/app/admin/(panel)/error.tsx`
- `src/app/admin/(panel)/layout.tsx`
- `src/app/admin/(panel)/library/page.tsx`
- `src/app/admin/(panel)/loading.tsx`
- `src/app/admin/(panel)/marketing/page.tsx`
- `src/app/admin/(panel)/notifications/page.tsx`
- `src/app/admin/(panel)/notifications/[id]/page.tsx`
- `src/app/admin/(panel)/orders/page.tsx`
- `src/app/admin/(panel)/orders/[id]/page.tsx`
- `src/app/admin/(panel)/page.tsx`
- `src/app/admin/(panel)/payments/page.tsx`
- `src/app/admin/(panel)/projects/page.tsx`
- `src/app/admin/(panel)/projects/[id]/page.tsx`
- `src/app/admin/(panel)/settings/page.tsx`
- `src/app/admin/(panel)/support/page.tsx`
- `src/app/admin/(panel)/support/[id]/page.tsx`
- `src/app/admin/(panel)/template-requests/page.tsx`
- `src/app/admin/(panel)/template-requests/[id]/page.tsx`
- `src/app/admin/(panel)/templates/new/page.tsx`
- `src/app/admin/(panel)/templates/page.tsx`
- `src/app/admin/(panel)/templates/[id]/edit/page.tsx`
- `src/app/admin/actions.ts`
- `src/app/admin/content-actions.ts`
- `src/app/admin/login/page.tsx`
- `src/app/admin/notification-actions.ts`
- `src/app/admin/project-actions.ts`
- `src/app/admin/template-actions.ts`
- `src/components/admin/AdminShell.tsx`
- `src/components/admin/client.tsx`
- `src/components/admin/ContentEditor.tsx`
- `src/components/admin/DashboardInsights.tsx`
- `src/components/admin/FilterSheet.tsx`
- `src/components/admin/forms.tsx`
- `src/components/admin/LibraryEditor.tsx`
- `src/components/admin/LoginForm.tsx`
- `src/components/admin/nav.ts`
- `src/components/admin/NotesHistory.tsx`
- `src/components/admin/NotificationControls.tsx`
- `src/components/admin/OrderDesignPreview.tsx`
- `src/components/admin/OrderStatusControl.tsx`
- `src/components/admin/PageSkeleton.tsx`
- `src/components/admin/ProductControls.tsx`
- `src/components/admin/ProjectControls.tsx`
- `src/components/admin/RequestControls.tsx`
- `src/components/admin/SupportControls.tsx`
- `src/components/admin/TemplateEditor.tsx`
- `src/components/admin/ui.tsx`
- `src/components/admin/upload.ts`
- `src/components/admin/useUnsavedChanges.ts`
- `src/lib/admin/labels.ts`
