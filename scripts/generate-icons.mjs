import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const svg = readFileSync('src/app/icon.svg');

const render = (size) =>
  sharp(svg, { density: 300 })
    .resize(size, size, { fit: 'contain', background: '#00000000' })
    .png()
    .toBuffer();

const pngs = [];
for (const size of [16, 32, 48]) pngs.push({ size, buf: await render(size) });

function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length + images.length * 16;
  const entries = images.map(({ size, buf }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(buf.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += buf.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.buf)]);
}

writeFileSync('src/app/favicon.ico', buildIco(pngs));
writeFileSync('src/app/apple-icon.png', await render(180));
mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon-192.png', await render(192));
writeFileSync('public/icons/icon-512.png', await render(512));
console.log('Icons generated: favicon.ico, apple-icon.png, icon-192.png, icon-512.png');
