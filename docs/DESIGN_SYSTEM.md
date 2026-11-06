# AXORA design system

Tokens live in `src/app/globals.css`, components in `src/components/ui/`, and Motion presets in `src/lib/motion.ts`. To see everything in both themes, run `npm run dev` and open `/dev/design-system`. That page returns 404 in production.

## Rules

1. Use semantic tokens (`bg-surface`, `text-ink`, `bg-primary`), not raw hex. Hex is only for customer palettes and product mock-ups, and those sit inside an `.ax-light` boundary.
2. Use a Server Component unless the component needs state, effects or browser APIs. These are server-safe: Button, Card, Input, Field, NativeSelect, Table, Badge, Sidebar, Skeleton, EmptyState, LoadingState.
3. Use `m` from `motion/react`, never `motion.div`. `LazyMotion strict` throws on `motion.*`, which keeps the Motion bundle small.
4. Keep controls at least 44px tall, and inputs at 16px or larger so iOS does not zoom on focus.
5. Never show status by colour alone. Pair it with text or an icon.

## Colour

| Role | Token | Light | Dark |
|---|---|---|---|
| Primary (filled buttons) | `primary` | `#245C45` | `#2E7556` |
| Brand (text and links) | `brand` | `#245C45` | `#9BD3AE` |
| Accent / secondary | `lime` | `#D9F279` | `#D9F279` |
| Band (dark panels) | `band` | `#17251E` | `#1C2C24` |
| Page | `bg` | `#F7F8F2` | `#0F1512` |
| Card | `surface` | `#FFFFFF` | `#18211C` |
| Sheet, menu | `elevated` | `#FFFFFF` | `#1F2A24` |
| Text | `ink` | `#17251E` | `#E9EEE7` |
| Secondary text | `muted` | `#56645B` | `#A7B4AB` |
| Tertiary text | `faint` | `#68756D` | `#8D9B93` |

Status tokens come in sets: `success`, `info`, `warn`, `danger`, `neutral`, `done`, each with a `-bg`. The raw ramps `forest-50…950` and `citron-100…900` are for charts and marketing surfaces.

Lime always takes dark text (`on-lime`), in both themes.

## Theme

`<html data-theme>` is set by an inline script before first paint. The preference (`light`, `dark` or `system`) is stored in localStorage. Components need no `dark:` classes because the tokens change value. If you do need one, the `dark:` variant follows this toggle rather than the OS. `.ax-light` resets a subtree to light, which is how previews stay true to the customer's colours.

## Typography

Manrope carries the interface and Lora the italic accents. `layout.tsx` loads both with the `cyrillic-ext` subset, because that is where the Mongolian Ө and Ү live. Do not remove it.

| Class | Size | Use |
|---|---|---|
| `.ax-display` | 44–104 | Hero |
| `.ax-h1` | 34–60 | Page title |
| `.ax-h2` | 28–44 | Section |
| `.ax-h3` | 20–24 | Subsection |
| `.ax-h4` | 18 | Card group |
| `.ax-lead` | 17 | Intro text |
| `.ax-body`, `text-body` | 15 | Body text |
| `text-sm` | 14 | Controls |
| `.ax-caption`, `text-caption` | 13 | Hints, metadata |
| `text-xs` | 12 | Badges |
| `text-2xs` | 11 | Tab labels only |
| `.ax-eyebrow` | 12, uppercase | Section label |

## Scales

- **Spacing:** Tailwind's 4px grid, plus `gutter`, `admin-gutter` and `section` (`px-gutter`, `py-section`).
- **Radius:** `inner` 8, `control` 12, `popover` 14, `card` 20, `panel` 28, `full`.
- **Shadow:** `xs`, `card`, `raised`, `popover`. Each has a dark value.
- **Breakpoints:** `xs` 480, `sm` 640, `md` 768, `nav` 900, `lg` 1024, `desk` 1100, `xl` 1280.
- **Stacking:** `z-(--ax-z-sticky)`, `-nav`, `-drawer`, `-dropdown`, `-modal`, `-popover`, `-tooltip`, `-skip`.

## Components

| Need | Use |
|---|---|
| Action | `Button`. For a link that looks like a button, put `buttonStyles()` on a Next `Link`. |
| Container | `Card` with `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` |
| Text entry | `Input` and `Textarea` inside `Field` |
| Choice | `NativeSelect` by default. `Select` (Radix) only when options need rich content. |
| Short modal | `Dialog` |
| Long form, or unsaved-changes guard | `BottomSheet` |
| Row or overflow actions | `DropdownMenu`. The older `Menu` still works. |
| Panels | `Tabs` |
| Filter or view toggle | `Segmented` |
| Data | `Table` |
| Status label | `Badge` |
| Extra detail on hover or focus | `Tooltip`. Touch screens have no hover, so never put the only copy of something here. |
| Navigation rail | `Sidebar`, `SidebarGroup`, `SidebarLink` |
| Known layout is loading | `Skeleton`, `SkeletonText` |
| Unknown wait | `LoadingState`, `Spinner` |
| Nothing to show | `EmptyState`. A failed read is an error, not an empty state. |

## Motion

| Moment | Implementation |
|---|---|
| Page transition | `PageEnter`, through `app/template.tsx`. Opacity only, because a transform would break sticky headers. |
| Modal | `Dialog`, using Motion variants with AnimatePresence |
| Tabs and segmented pill | Motion spring |
| Entrance | `InView`, `AnimatedGroup`, `TextReveal` |
| Hover and press | CSS on `.ax-button` and `.ax-card`. `HoverLift` and `Pressable` for other surfaces. |
| Dropdown, select, tooltip | CSS through `.ax-popover`, driven by Radix `data-state`, so these need no extra JavaScript |

Reduced motion is handled in two places: `MotionConfig reducedMotion="user"` for Motion, and a `prefers-reduced-motion` rule in `globals.css` for CSS. New components inherit both.

Do not use `layoutId` or `layout`. They need Motion's `domMax` bundle, and only `domAnimation` is loaded. Measure the target instead, as `TabsList` does.

## Icons

There are two sets for now:

- **Regen** (`<Icon name="…" />`) is used across the existing application. The sprite comes from `vendor/regen-icons`, and `scripts/check-regen-icons.mjs` guards it.
- **Lucide** (`lucide-react`) is used inside the new `src/components/ui/` primitives.

Both use a 24px grid with a 2px round stroke, so they sit together well. Admin source must keep using Regen, because the check script rejects `lucide-react` imports under `src/app/admin` and `src/components/admin`.

## Adding a shadcn/ui component

`components.json` is configured, so `npx shadcn@latest add <name>` works. Afterwards:

1. Replace `bg-muted` with `bg-soft`, and `bg-accent` with `bg-soft-2`. In AXORA `muted` is a text colour and `accent` is lime, so these two do not map directly.
2. Replace `motion.*` with `m.*`, if the component uses Motion.
3. Check it at `/dev/design-system` in both themes, and add a line to `THIRD_PARTY_NOTICES.md`.

Review the diff before keeping the result, because the CLI can also edit `globals.css` and overwrite existing files in `src/components/ui/`.
