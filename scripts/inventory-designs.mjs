import fs from 'node:fs/promises';
import sharp from 'sharp';

const root = 'design-references';
const rows = [];
for (const group of ['design-1', 'design-2']) {
  for (const name of (await fs.readdir(`${root}/${group}`)).filter(x => x.endsWith('.png')).sort()) {
    const path = `${root}/${group}/${name}`;
    const { width, height } = await sharp(path).metadata();
    rows.push({ id: rows.length + 1, group, name, path, width, height });
  }
}
await fs.writeFile(`${root}/inventory.json`, JSON.stringify(rows, null, 2) + '\n');
await fs.mkdir(`${root}/inspection`, { recursive: true });
for (let offset = 0; offset < rows.length; offset += 5) {
  const tiles = [];
  for (const [i, row] of rows.slice(offset, offset + 5).entries()) {
    const thumb = await sharp(row.path).resize({ width: 356, height: 1140, fit: 'inside' }).png().toBuffer();
    tiles.push({ input: thumb, left: i * 360, top: 55 });
    const label = `<svg width="360" height="50"><rect width="360" height="50" fill="white"/><text x="5" y="18" font-size="13">#${row.id} ${row.width}×${row.height}</text><text x="5" y="38" font-size="11">${row.name.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</text></svg>`;
    tiles.push({ input: Buffer.from(label), left: i * 360, top: 0 });
  }
  await sharp({ create: { width: 1800, height: 1200, channels: 3, background: '#cbd0cb' } }).composite(tiles).png().toFile(`${root}/inspection/sheet-${String(offset / 5 + 1).padStart(2, '0')}.png`);
}
console.log(`Inventoried ${rows.length} PNGs and generated ${Math.ceil(rows.length / 5)} contact sheets.`);
