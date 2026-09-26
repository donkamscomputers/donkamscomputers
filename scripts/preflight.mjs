// scripts/preflight.mjs
//
// Runs a quick sanity check before deploy.
//
// Usage:
//   node scripts/preflight.mjs

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

let warnings = 0;
let errors = 0;

function ok(msg) {
  console.log(`[OK] ${msg}`);
}

function warn(msg) {
  console.log(`[WARN] ${msg}`);
  warnings++;
}

function fail(msg) {
  console.log(`[FAIL] ${msg}`);
  errors++;
}

function rel(file) {
  return relative(ROOT, file).replaceAll('\\', '/');
}

// --------------------------------------------------
// 1. Required files
// --------------------------------------------------

const requiredFiles = [
  'package.json',
  'astro.config.mjs',
  'public/robots.txt',
  'public/favicon.svg',
  'src/layouts/BaseLayout.astro',
  'src/components/Header.astro',
  'src/components/Footer.astro',
  'src/data/products.json',
  'src/data/brands.json',
];

console.log('\n--- File presence ---');

for (const file of requiredFiles) {
  if (existsSync(resolve(ROOT, file))) {
    ok(file);
  } else {
    fail(`missing: ${file}`);
  }
}

// --------------------------------------------------
// 2. Source file discovery
// --------------------------------------------------

function walk(dir) {
  if (!existsSync(dir)) return [];

  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else {
      files.push(full);
    }
  }

  return files;
}

const sourceExtensions =
  /\.(astro|ts|tsx|js|jsx|json|css|md|mdx)$/i;

const srcFiles = walk(resolve(ROOT, 'src')).filter((file) =>
  sourceExtensions.test(file)
);

const publicFiles = walk(resolve(ROOT, 'public'));

const scanFiles = [...srcFiles, ...publicFiles];

// --------------------------------------------------
// 3. Donkams contact information
// --------------------------------------------------

console.log('\n--- Donkams contact information ---');

const DONKAMS_PHONE = '0806 739 7482';
const DONKAMS_EMAIL = 'donkamscomputers@gmail.com';

const allSourceText = scanFiles
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n');

const phoneFound =
  allSourceText.includes('08067397482') ||
  allSourceText.includes('0806 739 7482') ||
  allSourceText.includes('+234 806 739 7482');

if (phoneFound) {
  ok(`phone found: ${DONKAMS_PHONE}`);
} else {
  warn(`phone not found: ${DONKAMS_PHONE}`);
}

if (allSourceText.includes(DONKAMS_EMAIL)) {
  ok(`email found: ${DONKAMS_EMAIL}`);
} else {
  warn(`email not found: ${DONKAMS_EMAIL}`);
}

// --------------------------------------------------
// 4. Product data sanity
// --------------------------------------------------

console.log('\n--- Product data ---');

try {
  const productsPath = resolve(ROOT, 'src/data/products.json');
  const brandsPath = resolve(ROOT, 'src/data/brands.json');

  const products = JSON.parse(
    readFileSync(productsPath, 'utf8')
  );

  const brands = JSON.parse(
    readFileSync(brandsPath, 'utf8')
  );

  if (!Array.isArray(products)) {
    fail('products.json must contain an array');
    throw new Error('Invalid products.json structure');
  }

  if (!Array.isArray(brands)) {
    fail('brands.json must contain an array');
    throw new Error('Invalid brands.json structure');
  }

  const brandSlugs = new Set(
    brands
      .filter(
        (brand) =>
          brand &&
          typeof brand.slug === 'string' &&
          brand.slug.trim() !== ''
      )
      .map((brand) => brand.slug)
  );

  const productSlugs = new Set();
  const categorySet = new Set();

  for (const product of products) {
    if (!product || typeof product !== 'object') {
      fail('invalid product entry');
      continue;
    }

    const slug = product.slug;

    if (!slug) {
      fail(
        `product missing slug: ${JSON.stringify(product).slice(0, 100)}`
      );
      continue;
    }

    if (productSlugs.has(slug)) {
      fail(`duplicate product slug: ${slug}`);
    }

    productSlugs.add(slug);

    if (!product.brand) {
      warn(`product "${slug}" has no brand`);
    } else if (!brandSlugs.has(product.brand)) {
      fail(
        `product "${slug}" references unknown brand "${product.brand}"`
      );
    }

    if (!product.category) {
      warn(`product "${slug}" has no category`);
    } else {
      categorySet.add(product.category);
    }

    if (!product.name) {
      warn(`product "${slug}" has no name`);
    }

    if (!product.description) {
      warn(`product "${slug}" has no description`);
    }
  }

  ok(
    `${products.length} products, ${brands.length} brands, ${categorySet.size} categories`
  );

  if (products.length < 5) {
    warn(
      'fewer than 5 products - homepage product grid may look sparse'
    );
  }
} catch (error) {
  fail(`could not parse data files: ${error.message}`);
}

// --------------------------------------------------
// 5. Image references vs actual files
// --------------------------------------------------

console.log('\n--- Image references ---');

const imageRefs = new Set();

for (const file of srcFiles) {
  const content = readFileSync(file, 'utf8');

  const matches = content.matchAll(
    /["'`]((?:\/)?images\/[^"'`?#\s]+)["'`]/gi
  );

  for (const match of matches) {
    imageRefs.add(match[1]);
  }
}

let missingImages = 0;

for (const ref of imageRefs) {
  const cleanRef = ref.split('?')[0].split('#')[0];
  const relativePath = cleanRef.replace(/^\/+/, '');
  const fullPath = resolve(ROOT, 'public', relativePath);

  if (existsSync(fullPath)) {
    continue;
  }

  const svgFallback = fullPath.replace(
    /\.(jpg|jpeg|png|webp)$/i,
    '.svg'
  );

  if (existsSync(svgFallback)) {
    continue;
  }

  missingImages++;
  warn(`missing image: ${ref}`);
}

if (imageRefs.size === 0) {
  warn('no /images/ references detected in source files');
} else if (missingImages === 0) {
  ok(`all ${imageRefs.size} referenced images exist`);
} else {
  warn(
    `${missingImages} of ${imageRefs.size} referenced images are missing`
  );
}

// --------------------------------------------------
// 6. SEO files
// --------------------------------------------------

console.log('\n--- SEO files ---');

const robotsPath = resolve(ROOT, 'public/robots.txt');

if (existsSync(robotsPath)) {
  const robots = readFileSync(robotsPath, 'utf8');

  if (/User-agent:/i.test(robots)) {
    ok('robots.txt contains User-agent directive');
  } else {
    warn('robots.txt does not contain a User-agent directive');
  }

  if (/Disallow:/i.test(robots)) {
    ok('robots.txt contains Disallow directive');
  } else {
    warn('robots.txt does not contain Disallow directive');
  }

  if (/Sitemap:/i.test(robots)) {
    ok('robots.txt references a sitemap');
  } else {
    warn('robots.txt does not reference a sitemap');
  }
} else {
  fail('robots.txt is missing');
}

// --------------------------------------------------
// 7. Package configuration
// --------------------------------------------------

console.log('\n--- Package configuration ---');

try {
  const packagePath = resolve(ROOT, 'package.json');

  const pkg = JSON.parse(
    readFileSync(packagePath, 'utf8')
  );

  if (pkg.name) {
    ok(`package name: ${pkg.name}`);
  } else {
    warn('package.json has no package name');
  }

  if (pkg.scripts?.build) {
    ok('build script exists');
  } else {
    fail('package.json has no "build" script');
  }

  if (pkg.scripts?.dev) {
    ok('dev script exists');
  } else {
    warn('package.json has no "dev" script');
  }
} catch (error) {
  fail(`could not parse package.json: ${error.message}`);
}

// --------------------------------------------------
// 8. Astro configuration
// --------------------------------------------------

console.log('\n--- Astro configuration ---');

const astroConfigPath = resolve(ROOT, 'astro.config.mjs');

if (existsSync(astroConfigPath)) {
  const astroConfig = readFileSync(
    astroConfigPath,
    'utf8'
  );

  if (/defineConfig/.test(astroConfig)) {
    ok('astro.config.mjs uses defineConfig');
  } else {
    warn(
      'astro.config.mjs does not appear to use defineConfig'
    );
  }
}

// --------------------------------------------------
// 9. Debug code audit
// --------------------------------------------------

console.log('\n--- Debug code audit ---');

const debugPatterns = [
  {
    pattern: /console\.log\s*\(/g,
    label: 'console.log',
  },
  {
    pattern: /debugger\s*;/g,
    label: 'debugger statement',
  },
];

for (const { pattern, label } of debugPatterns) {
  const hits = [];

  for (const file of srcFiles) {
    const content = readFileSync(file, 'utf8');

    if (pattern.test(content)) {
      hits.push(rel(file));
    }

    pattern.lastIndex = 0;
  }

  if (hits.length === 0) {
    ok(`no ${label} found`);
  } else {
    warn(`${label} found in ${hits.length} file(s):`);
    hits.forEach((file) => console.log(`    ${file}`));
  }
}

// --------------------------------------------------
// Summary
// --------------------------------------------------

console.log('\n' + '-'.repeat(56));

if (errors > 0) {
  console.log(
    `[FAIL] ${errors} error(s), ${warnings} warning(s)`
  );
  process.exit(1);
}

if (warnings > 0) {
  console.log(
    `[WARN] ${warnings} warning(s) - review before deploy`
  );
  process.exit(0);
}

console.log('[OK] all checks passed');
