# AXORA Optical Material Guidelines

Primary runtime: `@samasante/liquid-glass@0.1.1` (MIT), locked in package-lock.json. Upstream: https://github.com/samasante/liquid-glass. This adapter uses its **GlassMaterial** path, not a DOM screenshot or media canvas renderer.

## API and composition

```tsx
<div className="ax-optical-host relative rounded-3xl">
  <AxoraGlass preset="panel" />
  {/* Real semantic controls stay here, outside the decorative material. */}
</div>
```

`AxoraGlass({preset?, className?, style?})` is decorative (`aria-hidden`, pointer-events:none). It does not wrap or clone content, own routes, or intercept focus/clicks. Host must establish position and a uniform border radius. Do not override its filter or draw a second material on the same host. Native selects retain their real select element; sorting uses a separate decorative host.

Presets are centralized in `src/components/glass/glass-presets.ts`:

| Preset | Use | Map | Frost | Strength |
| --- | --- | --- | --- | --- |
| navigation | Header, mobile/Admin dock, Builder toolbar | 256 | 4 | .035 |
| panel | Menu, dialog, bottom sheet, notification | 256 | 7 | .025 |
| control | Selected CTA, theme and customer copy controls, sort | 128 | 3 | .035 |
| lens | One moving selection indicator per group | 128 | 2 | .055 |

`GlassActiveIndicator({selection, selector?})` measures the real selected element, observes resize and ARIA/Radix selection changes, and animates one lens. Reduced motion settles immediately. It disposes its observers/listener. Width changes may regenerate maps during a short transition; there is no permanent map animation loop. Upstream map generator is disposed on unmount.

## Rendering modes

| Mode | Conditions | Rendering |
| --- | --- | --- |
| pending | Server/first hydration | Stable CSS material, no browser API during SSR |
| live-backdrop | Blink + SVG displacement + ResizeObserver + URL/blur parsing | Real SDF map, RGB feDisplacementMap, live backdrop URL |
| frost-fallback | Blur-capable WebKit/Firefox | CSS frost and edge, explicitly **not full refraction** |
| static-fallback | Forced colors/reduced transparency/missing APIs | Opaque accessible surface, no optical filter |

CSS.supports alone cannot verify Safari URL backdrop rendering. Capability checks include upstream's Blink restriction. Reduced motion disables selection motion; a static optical surface can remain. Theme tokens distinguish light Admin from cinematic public/dark surfaces. Never apply filters to foreground text or focus outlines.

## Upstream dispatch trap

Material mode requires a non-null child (the adapter supplies an empty hidden span), `live={false}`, and no `filterResolution`, `src`, `draw`, `lenses`, or overlay. Even filterResolution=1 selects a different rendering path. Do not remove the empty child as “unused.” Regression must verify data-liquid-glass=material, generated displacement maps, a URL filter, **and changed rendered pixels**.

Write prefixed backdrop-filter **before** the standard property. Current CSS optimizer can otherwise retain only the prefix, which Chrome ignores. Host reset must compute to `none`; a parent CSS blur creates a backdrop boundary and can hide the actual outside refraction.

## Scope rules

Use small foreground controls, navigation and transient panels. Do not add optical shells to whole home sections, Process, product cards, form sections, or Builder preview. Preserve the original hands/dots, cloud footer, SVG mark and existing R3F brand rendering. No html2canvas, DOM copies, per-frame screenshots, external image capture, or extra hero WebGL loop. Do not import Paper liquid-logo code without addressing its separate license. Existing custom metal logo/shader is preserved.

## Verification

`node scripts/audit-real-glass.mjs` checks actual pages, external diagnostic backdrop pixel ablation, menu placement, dock geometry/selection alignment and fallbacks. `AXORA_GLASS_URL` selects a running production app. Diagnostic grid is injected only into a temporary browser session. `verify-real-glass.mjs before|after` captures five routes at two sizes. `measure-real-glass.mjs before|after` records a short local frame sample; it is not a device benchmark or a memory-leak proof. Existing business/browser suites must still pass. See AXORA_REAL_GLASS_REPORT_MN.md for actual results and limitations.
