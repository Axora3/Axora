# UI source attribution

## shadcn/ui — Card composition

Adapted in src/components/ui/card.tsx. AXORA uses native div composition and its own design tokens; no registry or application scaffold was installed.
Source: https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/card.tsx
License: https://github.com/shadcn-ui/ui/blob/main/LICENSE.md
Retrieved 2026-11-06. MIT License. Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## shadcn/ui — component recipes

These follow the shadcn/ui recipes under the same MIT License as above, restyled with AXORA tokens:

- On Radix (`radix-ui`): select.tsx, dialog.tsx, dropdown-menu.tsx, tabs.tsx, tooltip.tsx.
- On native elements, so they stay Server Components: button.tsx, badge.tsx, input.tsx, table.tsx, skeleton.tsx, and the composition of sidebar.tsx.
- segmented.tsx follows the Tabs variant recipe on plain pressed buttons.

All are in src/components/ui/. The code is hand-adapted and `components.json` is in place for future additions; the shadcn CLI itself is not a dependency.
Source: https://github.com/shadcn-ui/ui/tree/main/apps/v4/registry/new-york-v4/ui

## Lucide

`lucide-react` is an npm dependency (ISC License), used by the design system primitives in src/components/ui/. The application's existing icons remain the Regen set; see docs/DESIGN_SYSTEM.md.
Source: https://github.com/lucide-icons/lucide

## Motion Primitives — AnimatedGroup and InView

InView is adapted in src/components/ui/motion-interactions.tsx: server HTML stays visible and only the entrance is kept. Source: https://github.com/ibelick/motion-primitives/blob/main/components/core/in-view.tsx

AnimatedGroup is adapted in src/components/ui/animated-group.tsx. Only child grouping and staggered entrance behavior were retained; server HTML stays visible and reduced motion disables translation.
Source: https://github.com/ibelick/motion-primitives/blob/main/components/core/animated-group.tsx
License: https://github.com/ibelick/motion-primitives/blob/main/LICENCE.md
Retrieved 2026-11-06. MIT License. Copyright (c) 2024 ibelick

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## shadcn/ui — DropdownMenu behaviour

src/components/ui/menu.tsx follows the shadcn/ui DropdownMenu interaction pattern under the same MIT License as above, on native elements without Radix.
Source: https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/dropdown-menu.tsx

## Motion Primitives — TextEffect

The word-by-word entrance in src/components/ui/text-reveal.tsx follows the idea of Motion Primitives TextEffect under the same MIT License as above. It is CSS only; no source was copied.
Source: https://github.com/ibelick/motion-primitives/blob/main/components/core/text-effect.tsx

## Motion Primitives — Spotlight

The pointer-following idea in src/components/ui/spotlight.tsx follows Motion Primitives Spotlight under the same MIT License as above. It was rebuilt with one delegated listener and CSS variables; no source was copied.
Source: https://github.com/ibelick/motion-primitives/blob/main/components/core/spotlight.tsx

## Runtime and other assets

Motion 14.9.1 is installed through npm with its packaged license. See node_modules/motion/LICENSE.md and package-lock.json for dependency versions. Regen source attribution and license remain in vendor/regen-icons. The hero gradient and grid, and the home bento grid, are original CSS. No Aceternity code or paid assets were copied.
