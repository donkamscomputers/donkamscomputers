// scripts/generate-placeholders.mjs
//
// Generates SVG placeholders for every image path the site references.
// Run with:  node scripts/generate-placeholders.mjs
//
// These are deliberately obvious placeholders — flat color + label —
// so it's clear they need to be replaced with real product photography.

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', 'public');

const BG = '#E2E2E5';
const INK = '#000010';
const MUTED = '#6B6B75';

/**
 * @param {string} path  - path relative to public/
 * @param {number} w
 * @param {number} h
 * @param {string} label
 */
function makePlaceholder(path, w, h, label) {
  const full = resolve(ROOT, path);
  if (existsSync(full)) {
    console.log(`· skip  ${path}`);
    return;
  }

  mkdirSync(dirname(full), { recursive: true });

  const fontSize = Math.round(Math.min(w, h) * 0.08);
  const subFontSize = Math.round(fontSize * 0.55);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${BG}"/>
  <text x="50%" y="47%" text-anchor="middle"
        font-family="Inter, -apple-system, sans-serif"
        font-size="${fontSize}" font-weight="600" fill="${INK}"
        letter-spacing="-0.02em">${label}</text>
  <text x="50%" y="56%" text-anchor="middle"
        font-family="Inter, -apple-system, sans-serif"
        font-size="${subFontSize}" font-weight="400" fill="${MUTED}"
        letter-spacing="0.02em">${w} × ${h}</text>
</svg>`;

  writeFileSync(full, svg);
  console.log(`✓ write ${path}`);
}

// ---------- HERO ----------
makePlaceholder('images/hero-composition.svg', 1200, 960, 'Hero');
makePlaceholder('images/hero-composition.jpg', 1200, 960, 'Hero');

// ---------- STARLINK FEATURE ----------
makePlaceholder('images/starlink-feature.svg', 1400, 900, 'Starlink');
makePlaceholder('images/starlink-feature.jpg', 1400, 900, 'Starlink');

// ---------- CATEGORIES ----------
makePlaceholder('images/categories/smartphones.svg', 600, 750, 'Smartphones');
makePlaceholder('images/categories/smartphones.jpg', 600, 750, 'Smartphones');
makePlaceholder('images/categories/laptops.svg', 600, 750, 'Laptops');
makePlaceholder('images/categories/laptops.jpg', 600, 750, 'Laptops');
makePlaceholder('images/categories/accessories.svg', 600, 750, 'Accessories');
makePlaceholder('images/categories/accessories.jpg', 600, 750, 'Accessories');
makePlaceholder('images/categories/connectivity.svg', 600, 750, 'Connectivity');
makePlaceholder('images/categories/connectivity.jpg', 600, 750, 'Connectivity');

// ---------- PRODUCTS ----------
const products = [
  ['iphone', 'iPhone'],
  ['macbook', 'MacBook'],
  ['samsung-galaxy', 'Galaxy'],
  ['starlink', 'Starlink'],
  ['hp-laptop', 'HP Laptop'],
  ['oraimo-earbuds', 'Earbuds'],
  ['oraimo-powerbank', 'Power Bank'],
  ['router', 'Router'],
  ['placeholder', 'Product'],
];

for (const [slug, label] of products) {
  makePlaceholder(`images/products/${slug}.svg`, 400, 400, label);
  makePlaceholder(`images/products/${slug}.jpg`, 400, 400, label);
}

// ---------- BRAND LOGOS ----------
const brands = [
  ['apple', 'Apple'],
  ['samsung', 'Samsung'],
  ['hp', 'HP'],
  ['oraimo', 'Oraimo'],
  ['starlink', 'Starlink'],
];

for (const [slug, label] of brands) {
  const full = resolve(ROOT, `images/brands/${slug}.svg`);
  if (existsSync(full)) {
    console.log(`· skip  images/brands/${slug}.svg`);
    continue;
  }
  mkdirSync(dirname(full), { recursive: true });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60">
  <text x="50%" y="55%" text-anchor="middle"
        font-family="Inter, -apple-system, sans-serif"
        font-size="22" font-weight="700" fill="${INK}"
        letter-spacing="-0.02em">${label}</text>
</svg>`;
  writeFileSync(full, svg);
  console.log(`✓ write images/brands/${slug}.svg`);
}

// ---------- DEFAULT OG ----------
makePlaceholder('images/og-default.svg', 1200, 630, 'Donkams');
makePlaceholder('images/og-default.jpg', 1200, 630, 'Donkams');

console.log('\nDone. Now run `npm run dev` and the site should render fully.');