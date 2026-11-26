# AXORA cleanup report

Date: 2026-11-24. Maintenance only; previous uncommitted work was retained. No push or deployment performed.

## Measurement

Logical regular-file sizes; excludes all nested .git and node_modules directories, symlinks, and artifacts/cleanup evidence. Includes documentation, original reference artwork and generated output; caches are reported separately. Counts cover the same scope before and after. This is not disk allocation or a node_modules measurement. A separate active dev server can change .next between snapshots.

| Measure | Before | After |
| --- | ---: | ---: |
| Measured working tree, bytes | 2,148,474,773 | 963,052,054 |
| Maintained files, bytes | 170,675,580 | 149,511,326 |
| Generated output, bytes | 1,977,799,193 | 813,540,728 |
| Source files | 263 | 260 |
| Source bytes | 1,341,247 | 1,335,257 |
| Visual assets | 924 | 852 |
| Visual asset bytes | 167,111,129 | 145,942,191 |
| Dependencies | 17 | 17 |
| Dev dependencies | 15 | 15 |

Net measured working-tree reduction: **1,185,422,719 bytes** (55.18%). Source reduction: 5,990 bytes. Visual assets moved outside checkout: 21,168,799 bytes, 72 files. Package reduction: zero; no package was confirmed unnecessary. Archive storage remains on disk outside AXORA.

## Removed source and obsolete scripts

The TypeScript AST import graph includes static imports, literal dynamic imports, exports, require, @/ resolution, Next route/layout/API/metadata conventions, tests and operational script imports. No nonliteral dynamic imports were found. No reachable source module remains in the audit's unreachable list.

| Removed path | Bytes | Evidence / reason |
| --- | ---: | --- |
| src/components/glass/LiquidGlass.tsx | 716 | Unreachable module; no static, dynamic, framework or tooling references. |
| src/components/glass/LiquidGlassOptics.tsx | 937 | Unreachable module; no static, dynamic, framework or tooling references. |
| src/components/glass/LiquidGlassOverlays.tsx | 1645 | Unreachable module; no static, dynamic, framework or tooling references. |
| artifacts/redesign-foreground.cjs | 2241 | Completed one-off source rewrite; not a test, package command, import or runtime input. |
| artifacts/refine-navigation.cjs | 3653 | Completed one-off source rewrite; not a test, package command, import or runtime input. |
| artifacts/compact-dock.cjs | 994 | Completed one-off source rewrite; not a test, package command, import or runtime input. |
| artifacts/calendar/replace-date-inputs.cjs | 1360 | Completed one-off source rewrite; not a test, package command, import or runtime input. |

Removed AxoraAnimatedLogo, its unused entrance animation and private unused studio tokens. Kept AxoraLogo, AxoraMonogram, AxoraWordmark and canonical vector paths. No active hooks, API handlers, server actions, auth, database migrations or routing were removed.

## CSS and maintenance configuration

Removed rules owned solely by the three unused glass modules: ax-glass-overlay, ax-glass-dock, ax-glass-active-indicator, ax-liquid-glass, ax-glass-button and ax-glass-definitions. Removed ax-animated-brand / axBrandEnter, unused ax-wordmark text-logo rules and old ax-header-backbar selectors. Preserved active header/dock glass, focus indicators, reduced-transparency fallback, reduced-motion behavior, builder layout, cinematic imagery and the mobile cloud offset.

npm run typecheck now generates Next route types before tsc, following the installed Next 16.4.6 CLI guide. .gitignore covers all .next-* QA outputs. No lockfile dependency edits were needed for this cleanup.

## Dependencies and external integrations

All 17 runtime and 15 development packages retained after source/tooling review. React Three Fiber / Three.js are used by the live brand material scene; GSAP and motion remain active. Supabase, Nodemailer, Radix, Zod and existing utility packages remain required. pg supports operational database scripts; PGlite and Playwright support real tests. @types packages are compiler inputs; Prettier remains a maintenance tool. A missing text import is not proof these are unused.

Retained the active Liquid Metal scene, shader-gradient wrapper and actual CSS glass surfaces. No cloned React Three Fiber, Liquid Glass JS, Shader Gradient or Paper Design demo repository was found inside this checkout. The regen-icons source toolkit, canonical drawing workflow, vendor icons, nested repository metadata and licenses are retained; dynamically generated icon references prevent safe filename-based pruning.

## Regenerable cache cleanup

| Removed generated directory | Bytes at removal |
| --- | ---: |
| .next-ecosystem-qa | 257,556,908 |
| .next-hands-build-qa | 163,387,132 |
| .next-hands-qa | 743,431,538 |

Removed total: 1,164,375,578 bytes. These outputs were created for QA and no longer had running servers. Resolved paths were checked to remain inside the checkout before native PowerShell removal. The separate active development server's .next directory was preserved. Empty glass/source-render/template-render directories were removed where present. node_modules was retained. Cache removal totals and baseline-to-final generated delta differ because verification regenerated QA output before its removal.

## Archive and recovery

Archive: C:/Users/tulhu/OneDrive/Desktop/websites/Axora-zuragnuud, outside the Git checkout. archive-manifest.json and README.md are present. Each image was copied without overwriting existing archive files, verified using SHA-256, recorded, then removed from its original path. A second verification confirmed all 72 originals are absent and all archived hashes match. No image was permanently deleted. Restore the manifest's archivedPath to originalRelativeProjectPath under AXORA and check sha256 before replacing anything.

All entries below are superseded QA screenshots from public pages or the static synthetic /dev/admin-preview fixture. No Markdown reference, runtime asset use or screenshot-input dependency was found. Historical script references were reviewed and are output destinations only. No private database export or credential was archived. The manifest contains each full SHA-256 and reference checks.

| Original relative path | Archive relative path | Bytes | Check |
| --- | --- | ---: | --- |
| artifacts/foreground-after-desktop.png | unused-screenshots/artifacts/foreground-after-desktop.png | 3,273,466 | SHA-256 verified |
| artifacts/foreground-after-hero.png | unused-screenshots/artifacts/foreground-after-hero.png | 318,761 | SHA-256 verified |
| artifacts/foreground-after-showcase.png | unused-screenshots/artifacts/foreground-after-showcase.png | 816,718 | SHA-256 verified |
| artifacts/foreground-background-after.png | unused-screenshots/artifacts/foreground-background-after.png | 1,945,610 | SHA-256 verified |
| artifacts/foreground-background-before.png | unused-screenshots/artifacts/foreground-background-before.png | 1,945,594 | SHA-256 verified |
| artifacts/foreground-before-desktop.png | unused-screenshots/artifacts/foreground-before-desktop.png | 3,406,270 | SHA-256 verified |
| artifacts/foreground-before-hero.png | unused-screenshots/artifacts/foreground-before-hero.png | 352,359 | SHA-256 verified |
| artifacts/foreground-before-showcase.png | unused-screenshots/artifacts/foreground-before-showcase.png | 1,386,025 | SHA-256 verified |
| artifacts/foreground-final-hero-1440.png | unused-screenshots/artifacts/foreground-final-hero-1440.png | 375,907 | SHA-256 verified |
| artifacts/foreground-final-hero-390.png | unused-screenshots/artifacts/foreground-final-hero-390.png | 136,460 | SHA-256 verified |
| artifacts/foreground-final-page.png | unused-screenshots/artifacts/foreground-final-page.png | 2,407,853 | SHA-256 verified |
| artifacts/foreground-final-showcase-1440.png | unused-screenshots/artifacts/foreground-final-showcase-1440.png | 178,946 | SHA-256 verified |
| artifacts/foreground-final-showcase-390.png | unused-screenshots/artifacts/foreground-final-showcase-390.png | 144,716 | SHA-256 verified |
| artifacts/foreground-final-showcase.png | unused-screenshots/artifacts/foreground-final-showcase.png | 177,748 | SHA-256 verified |
| artifacts/foreground-hero-390.png | unused-screenshots/artifacts/foreground-hero-390.png | 144,372 | SHA-256 verified |
| artifacts/foreground-hero-768.png | unused-screenshots/artifacts/foreground-hero-768.png | 280,313 | SHA-256 verified |
| artifacts/foreground-showcase-390.png | unused-screenshots/artifacts/foreground-showcase-390.png | 391,624 | SHA-256 verified |
| artifacts/foreground-showcase-768.png | unused-screenshots/artifacts/foreground-showcase-768.png | 567,926 | SHA-256 verified |
| artifacts/mobile-debug.png | unused-screenshots/artifacts/mobile-debug.png | 59,412 | SHA-256 verified |
| artifacts/mobile-glass-1440-dark.png | unused-screenshots/artifacts/mobile-glass-1440-dark.png | 97,913 | SHA-256 verified |
| artifacts/mobile-glass-1440-light.png | unused-screenshots/artifacts/mobile-glass-1440-light.png | 96,706 | SHA-256 verified |
| artifacts/mobile-glass-320-dark.png | unused-screenshots/artifacts/mobile-glass-320-dark.png | 62,942 | SHA-256 verified |
| artifacts/mobile-glass-320-light.png | unused-screenshots/artifacts/mobile-glass-320-light.png | 59,412 | SHA-256 verified |
| artifacts/mobile-glass-375-dark.png | unused-screenshots/artifacts/mobile-glass-375-dark.png | 67,715 | SHA-256 verified |
| artifacts/mobile-glass-375-light.png | unused-screenshots/artifacts/mobile-glass-375-light.png | 64,306 | SHA-256 verified |
| artifacts/mobile-glass-390-dark.png | unused-screenshots/artifacts/mobile-glass-390-dark.png | 68,380 | SHA-256 verified |
| artifacts/mobile-glass-390-light.png | unused-screenshots/artifacts/mobile-glass-390-light.png | 64,847 | SHA-256 verified |
| artifacts/mobile-glass-430-dark.png | unused-screenshots/artifacts/mobile-glass-430-dark.png | 69,078 | SHA-256 verified |
| artifacts/mobile-glass-430-light.png | unused-screenshots/artifacts/mobile-glass-430-light.png | 66,190 | SHA-256 verified |
| artifacts/mobile-glass-768-dark.png | unused-screenshots/artifacts/mobile-glass-768-dark.png | 74,636 | SHA-256 verified |
| artifacts/mobile-glass-768-light.png | unused-screenshots/artifacts/mobile-glass-768-light.png | 71,725 | SHA-256 verified |
| artifacts/mobile-glass-active-dark.png | unused-screenshots/artifacts/mobile-glass-active-dark.png | 72,983 | SHA-256 verified |
| artifacts/nav-desktop-1024x400-dark.png | unused-screenshots/artifacts/nav-desktop-1024x400-dark.png | 44,163 | SHA-256 verified |
| artifacts/nav-desktop-1024x400-light.png | unused-screenshots/artifacts/nav-desktop-1024x400-light.png | 43,071 | SHA-256 verified |
| artifacts/nav-desktop-1024x600-dark.png | unused-screenshots/artifacts/nav-desktop-1024x600-dark.png | 60,840 | SHA-256 verified |
| artifacts/nav-desktop-1024x600-light.png | unused-screenshots/artifacts/nav-desktop-1024x600-light.png | 59,898 | SHA-256 verified |
| artifacts/nav-desktop-1440x900-dark.png | unused-screenshots/artifacts/nav-desktop-1440x900-dark.png | 96,756 | SHA-256 verified |
| artifacts/nav-desktop-1440x900-light.png | unused-screenshots/artifacts/nav-desktop-1440x900-light.png | 95,635 | SHA-256 verified |
| artifacts/nav-dock-320x640-dark.png | unused-screenshots/artifacts/nav-dock-320x640-dark.png | 44,334 | SHA-256 verified |
| artifacts/nav-dock-320x640-light.png | unused-screenshots/artifacts/nav-dock-320x640-light.png | 39,773 | SHA-256 verified |
| artifacts/nav-dock-360x640-dark.png | unused-screenshots/artifacts/nav-dock-360x640-dark.png | 46,461 | SHA-256 verified |
| artifacts/nav-dock-360x640-light.png | unused-screenshots/artifacts/nav-dock-360x640-light.png | 41,723 | SHA-256 verified |
| artifacts/nav-dock-375x812-dark.png | unused-screenshots/artifacts/nav-dock-375x812-dark.png | 61,762 | SHA-256 verified |
| artifacts/nav-dock-375x812-light.png | unused-screenshots/artifacts/nav-dock-375x812-light.png | 55,975 | SHA-256 verified |
| artifacts/nav-dock-390x400-dark.png | unused-screenshots/artifacts/nav-dock-390x400-dark.png | 38,101 | SHA-256 verified |
| artifacts/nav-dock-390x400-light.png | unused-screenshots/artifacts/nav-dock-390x400-light.png | 33,696 | SHA-256 verified |
| artifacts/nav-dock-390x844-dark.png | unused-screenshots/artifacts/nav-dock-390x844-dark.png | 61,352 | SHA-256 verified |
| artifacts/nav-dock-390x844-light.png | unused-screenshots/artifacts/nav-dock-390x844-light.png | 56,147 | SHA-256 verified |
| artifacts/nav-dock-430x932-dark.png | unused-screenshots/artifacts/nav-dock-430x932-dark.png | 70,364 | SHA-256 verified |
| artifacts/nav-dock-430x932-light.png | unused-screenshots/artifacts/nav-dock-430x932-light.png | 65,263 | SHA-256 verified |
| artifacts/nav-dock-640x320-dark.png | unused-screenshots/artifacts/nav-dock-640x320-dark.png | 37,189 | SHA-256 verified |
| artifacts/nav-dock-640x320-light.png | unused-screenshots/artifacts/nav-dock-640x320-light.png | 33,983 | SHA-256 verified |
| artifacts/nav-dock-768x700-dark.png | unused-screenshots/artifacts/nav-dock-768x700-dark.png | 56,783 | SHA-256 verified |
| artifacts/nav-dock-768x700-light.png | unused-screenshots/artifacts/nav-dock-768x700-light.png | 53,378 | SHA-256 verified |
| artifacts/nav-drawer-320x640-dark.png | unused-screenshots/artifacts/nav-drawer-320x640-dark.png | 32,088 | SHA-256 verified |
| artifacts/nav-drawer-320x640-light.png | unused-screenshots/artifacts/nav-drawer-320x640-light.png | 33,047 | SHA-256 verified |
| artifacts/nav-drawer-360x640-dark.png | unused-screenshots/artifacts/nav-drawer-360x640-dark.png | 34,299 | SHA-256 verified |
| artifacts/nav-drawer-360x640-light.png | unused-screenshots/artifacts/nav-drawer-360x640-light.png | 34,791 | SHA-256 verified |
| artifacts/nav-drawer-375x812-dark.png | unused-screenshots/artifacts/nav-drawer-375x812-dark.png | 42,929 | SHA-256 verified |
| artifacts/nav-drawer-375x812-light.png | unused-screenshots/artifacts/nav-drawer-375x812-light.png | 43,381 | SHA-256 verified |
| artifacts/nav-drawer-390x400-dark.png | unused-screenshots/artifacts/nav-drawer-390x400-dark.png | 24,655 | SHA-256 verified |
| artifacts/nav-drawer-390x400-light.png | unused-screenshots/artifacts/nav-drawer-390x400-light.png | 26,188 | SHA-256 verified |
| artifacts/nav-drawer-390x844-dark.png | unused-screenshots/artifacts/nav-drawer-390x844-dark.png | 45,072 | SHA-256 verified |
| artifacts/nav-drawer-390x844-light.png | unused-screenshots/artifacts/nav-drawer-390x844-light.png | 45,682 | SHA-256 verified |
| artifacts/nav-drawer-430x932-dark.png | unused-screenshots/artifacts/nav-drawer-430x932-dark.png | 54,944 | SHA-256 verified |
| artifacts/nav-drawer-430x932-light.png | unused-screenshots/artifacts/nav-drawer-430x932-light.png | 55,853 | SHA-256 verified |
| artifacts/nav-drawer-640x320-dark.png | unused-screenshots/artifacts/nav-drawer-640x320-dark.png | 28,556 | SHA-256 verified |
| artifacts/nav-drawer-640x320-light.png | unused-screenshots/artifacts/nav-drawer-640x320-light.png | 29,973 | SHA-256 verified |
| artifacts/nav-drawer-768x700-dark.png | unused-screenshots/artifacts/nav-drawer-768x700-dark.png | 52,241 | SHA-256 verified |
| artifacts/nav-drawer-768x700-light.png | unused-screenshots/artifacts/nav-drawer-768x700-light.png | 53,558 | SHA-256 verified |
| artifacts/nav-drawer-top-dark.png | unused-screenshots/artifacts/nav-drawer-top-dark.png | 44,929 | SHA-256 verified |
| artifacts/nav-search.png | unused-screenshots/artifacts/nav-search.png | 43,053 | SHA-256 verified |

## Protected assets and duplicates

All 24 public/src visual files in the baseline retain identical SHA-256 checksums. The existing protected-assets script also verifies 11 original files and unchanged hands composition. Original backgrounds, dotted texture, hands artwork/animation, cinematic images, current logo variants, favicon and Open Graph artwork were preserved. No active visual was recompressed, renamed or regenerated.

Exact binary duplicate groups are recorded in baseline.json / final.json. mobile-debug.png duplicates mobile-glass-320-light.png; both historical outputs were independently archived. Other duplicate paths remain because they belong to referenced design documentation, icon generation/source libraries or protected variants; no path consolidation was assumed safe.

## Verification results

| Check | Baseline | After cleanup |
| --- | --- | --- |
| ESLint | 0 errors, 4 existing warnings | 0 errors, same 4 warnings |
| TypeScript | passed | next typegen + tsc passed, including after cache removal |
| Ecosystem unit tests | 25 passed | 25 passed |
| Production build | passed | passed in existing fixture-backed browser suite |
| Ecosystem browser tests | not rerun as baseline | 9 passed, 1 worker |
| Local UI route/image checks | 8/8 passed | 8/8 passed |
| Protected checksums | captured | 24 visual files + existing protected composition checks unchanged |

Browser checks cover home, templates, builder and synthetic admin preview at 390x900 and 1440x900. Before/after images and machine-readable results are under artifacts/cleanup/before and after. No uncaught page errors, completed broken images or horizontal overflow occurred. Lazy images not loaded in the viewport are excluded from the broken-image assertion. The mobile footer was separately captured and reviewed.

All nine screenshot pairs have identical dimensions. Two admin pairs and mobile builder are pixel-identical; other differences are small rasterization/animation changes. Desktop home differs in 3.192% of exact pixels, but no row has more than 20 pixels with RGB-channel difference above 5; visual review found no changed layout or appearance. The comparison JSON records actual values rather than claiming exact equality.

Existing browser tests exercise brand navigation, mobile menu/dock, route transitions and header ownership, builder selection/preview/reset/dialog focus, contact/login validation, authenticated fixture admin sections, notification preferences, registration/intake, authorization boundaries and unavailable provisioning behavior. Tests use synthetic local services, not production writes. No real email test was run.

The restricted process environment initially prevented tsx startup (uv_os_get_passwd ENOMEM). The same unit command passed 25/25 when run with authorized execution outside that restriction; this was an environment failure before application tests initialized. Existing lint warnings remain in regen-icons generator scripts (3) and the byte-protected hands rig parameter (1).

## Preserved uncertainties and practical limits

All public assets and current brand variants remain, even without direct imports, because database/external consumers cannot be exhaustively enumerated. All design-references artwork, report-linked QA evidence, calendar/search fixture images, uncertain admin-verification captures, tests, documentation, legal notices, migrations and source toolkit are retained. Potentially private admin screenshots were not moved. The latest mobile-cloud-lowered.png evidence is retained.

Local checks do not establish production Supabase records, storage consumers, external deployments or real mail delivery. Those systems were not modified. No claim is made that every possible externally consumed path can be proven unused. Preserving uncertain files is intentional.

Audit evidence: artifacts/cleanup/baseline.json, final.json, removed-code.json, removed-caches.json, archive-plan.json, archive-verification.json, visual-comparison.json and before/after results. The repeatable read-only inventory script is scripts/audit-cleanup.mjs; use --final to avoid replacing the baseline.
