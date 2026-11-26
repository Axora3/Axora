import fs from "node:fs/promises";
import sharp from "sharp";

// Canonical vector geometry is shared with the React brand components.
const source = await fs.readFile("src/components/brand/AxoraLogo.tsx", "utf8");
const mono = source.match(/MONOGRAM_PATH\s*=\s*"([^"]+)"/)[1];
const word = source.match(/WORDMARK_PATH\s*=\s*"([^"]+)"/)[1];
const dir = "public/brand";
await fs.mkdir(dir, { recursive: true });
const svg = (body, box = "0 0 400 80") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}">${body}</svg>`;
const lockup = (color) =>
  svg(
    `<g fill="${color}"><path transform="translate(4 10)" d="${mono}"/><path fill-rule="evenodd" transform="translate(98 15)" d="${word}"/></g>`,
  );
for (const [name, color] of [
  ["axora-logo", "#c0c7d0"],
  ["axora-logo-light", "#f5f5f7"],
  ["axora-logo-dark", "#050505"],
  ["axora-logo-monochrome", "#000000"],
])
  await fs.writeFile(`${dir}/${name}.svg`, lockup(color));
await fs.writeFile(
  `${dir}/axora-monogram.svg`,
  svg(`<path fill="#c0c7d0" d="${mono}"/>`, "0 0 64 60"),
);
await fs.writeFile(
  `${dir}/axora-wordmark.svg`,
  svg(`<path fill="#c0c7d0" fill-rule="evenodd" d="${word}"/>`, "0 0 278 50"),
);
const icon = svg(
  `<rect width="80" height="80" rx="16" fill="#050505"/><path transform="translate(8 10)" fill="#f5f5f7" d="${mono}"/>`,
  "0 0 80 80",
);
await fs.writeFile(`${dir}/favicon.svg`, icon);
for (const size of [16, 32, 48])
  await sharp(Buffer.from(icon))
    .resize(size, size)
    .png()
    .toFile(`${dir}/favicon-${size}x${size}.png`);
await sharp(Buffer.from(icon))
  .resize(180, 180)
  .png()
  .toFile(`${dir}/apple-touch-icon.png`);
const metal = svg(
  `<defs><linearGradient id="chrome" x1="0" y1="0" x2="1" y2=".8"><stop stop-color="#f5f5f7"/><stop offset=".24" stop-color="#858b95"/><stop offset=".43" stop-color="#f5f5f7"/><stop offset=".52" stop-color="#293342"/><stop offset=".76" stop-color="#c0c7d0"/><stop offset="1" stop-color="#f5f5f7"/></linearGradient></defs><path fill="url(#chrome)" d="${mono}"/>`,
  "0 0 64 60",
);
await fs.writeFile(`${dir}/axora-liquid-logo.svg`, metal);
await sharp(Buffer.from(metal))
  .resize(640, 600)
  .webp()
  .toFile(`${dir}/axora-liquid-logo.webp`);
const og = svg(
  `<rect width="1200" height="630" fill="#050505"/><path d="M72 480H1128" stroke="#30343c"/><g fill="#c0c7d0"><path transform="translate(78 150) scale(3.4)" d="${mono}"/><path transform="translate(380 210) scale(2.6)" fill-rule="evenodd" d="${word}"/></g><text x="80" y="548" fill="#858b95" font-family="sans-serif" font-size="24">Digital products / Websites / AXORA</text>`,
  "0 0 1200 630",
);
await sharp(Buffer.from(og)).png().toFile(`${dir}/og-image.png`);
const alternatives = [
  mono,
  "M5 54 27 6h10l22 48H46L32 22 18 54Zm20-9 7-13 7 13Z",
  "M6 54 26 6h12l20 48H45L32 22 19 54Zm18-13 8-10 8 10-8 10Z",
];
await fs.writeFile(
  `${dir}/logo-concepts.svg`,
  svg(
    `<rect width="720" height="220" fill="#050505"/>${alternatives.map((d, i) => `<path fill="#c0c7d0" transform="translate(${70 + i * 240} 40) scale(1.4)" d="${d}"/><text x="${60 + i * 240}" y="170" fill="#c0c7d0" font-family="sans-serif" font-size="16">${["Aperture", "Summit", "Nexus"][i]}</text>`).join("")}`,
    "0 0 720 220",
  ),
);
console.log("Generated AXORA vector, favicon, metal and social assets.");
