# Regen Icons source snapshot

- Upstream: https://github.com/kazdenc/regen-icons
- Source commit: `64c0e165c3ce6d5c9d7329acf5762306f86d6b1d`
- License: MIT; see LICENSE.
- Contents: the unmodified SVG assets used by AXORA, copied from the existing local Regen checkout.

The generator and asset checks read this tracked snapshot so a fresh clone does not require the separate local `regen-icons` Git repository. To integrate another icon, copy its actual upstream SVG into the matching variant directory, update the generator mapping, and run both icon scripts. Preserve the upstream license.
