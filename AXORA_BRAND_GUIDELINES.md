# AXORA brand guidelines

## Identity

The selected identity is **Aperture**: two ascending structural rails and an offset crossbar. The opening between them suggests an A without enclosing it in a badge. The right rail projects forward. The canonical monogram occupies a 64 × 60 viewBox; its visible geometry spans x=4–60 and y=6–54. Do not change its proportions.

The wordmark is custom SVG path geometry, including an open geometric A, intersecting X, rounded O, and stepped R. It does not depend on a font. The horizontal lockup is the primary signature. All artwork lives in `public/brand`; regenerate it with `node scripts/generate-axora-brand.mjs` after changing canonical paths in `src/components/brand/AxoraLogo.tsx`.

## Concept evaluation

See `public/brand/logo-concepts.svg`.

| Concept | Silhouette | Balance | Small sizes | Relevance | Monochrome |
| --- | --- | --- | --- | --- | --- |
| Aperture, selected | Distinct offset crossbar | Deliberate asymmetry | Clear separated rails | Architecture and forward movement | Strong |
| Summit | Familiar triangular A | Symmetric | Clear | Stable, less distinctive | Strong |
| Nexus | A with central diamond | Symmetric | Opening becomes dense | Connectivity, more ornamental | Strong |

These are original concepts produced for this project; no trademark clearance is claimed.

## Placement

Allow clear space equal to one quarter of the monogram width on every side. Minimum monogram size: 20 CSS px. Minimum horizontal lockup: 120 CSS px. Below that size use the monogram alone. Favicons have a dedicated dark container for contrast. Never place a second decorative tile behind the navigation mark.

Use the light version on dark surfaces, dark version on light surfaces, and monochrome version when color is unavailable. Use the static SVG in navigation, admin, forms, and correspondence. The liquid material is an expressive secondary treatment; the silhouette remains canonical.

## Palette and typography

| Role | Value |
| --- | --- |
| Obsidian | `#050505` |
| Deep navy | `#0F172A` |
| Interactive blue | `#2563EB` |
| Liquid silver | `#C0C7D0` |
| Soft white | `#F5F5F7` |
| Muted gray | `#858B95` |

Use the existing semantic `--ax-*` tokens for functional states. The `--studio-*` tokens define foreground brand spacing, radii, materials and motion. Blue marks an action or selection. Silver supplies the secondary brand voice. Do not apply brand gray indiscriminately to small text; retain the brighter existing text tokens on cinematic surfaces.

Manrope is the interface family; Lora remains available for editorial accents. Both retain Latin, Cyrillic, and Cyrillic Extended subsets for Ө and Ү. Builder preview fonts remain isolated in their existing use. Use fluid headings and readable 16px body copy. Custom SVG wordmarks are never replaced by typed text in public brand lockups.

## Material and motion

Glass belongs on navigation and elevated controls. It uses a thin specular edge, restrained transparency, and a dark tint for contrast. The public header progressively adds a small SVG backdrop displacement where supported. CSS blur/tint is the cross-browser fallback; no page screenshots or private-field capture are used. Avoid glass on every content block.

The studio material uses an original GLSL silver reflection pattern over extruded canonical A geometry. A slow navy shader field shares that canvas. It is a stylized studio-metal treatment, not physically traced chrome. One localized scene accompanies the existing hands renderer. Never replace, recolor, crop, or reposition the existing hands or background artwork.

New scene rendering mounts only on desktop, in view, with a visible document and no reduced-motion preference. DPR is capped at 1.5. Mobile, unsupported WebGL, errors and reduced motion keep the static SVG. The entrance logo uses one short opacity/translation transition; it never delays access. No loading theatre, scroll hijacking, or perpetual motion in admin.

## Consistency

Keep navigation compact, keyboard focus visible, touch targets at least 44px, and primary actions clear. Preserve natural Mongolian interface language. Never invent customer counts, testimonials, portfolio claims, prices or operational data. New effects must leave semantic content and working links available when enhancement fails.
