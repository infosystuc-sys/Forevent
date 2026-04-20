#!/usr/bin/env node
/**
 * Post-install patch: quote ALL reserved-word object-property keys
 * in node_modules that Hermes (React Native) rejects.
 *
 * Uses @babel/parser + @babel/traverse for precise AST-based detection.
 * Only touches ObjectProperty/ObjectMethod keys — never switch/case,
 * labels, strings, or comments.
 *
 * ~2200 files affected across node_modules.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

let babelParser, babelTraverse;
try {
  babelParser   = require(path.join(ROOT, 'node_modules/@babel/parser'));
  babelTraverse = require(path.join(ROOT, 'node_modules/@babel/traverse')).default;
} catch (e) {
  console.warn('[fix-hermes] @babel/parser or @babel/traverse not found, skipping.');
  process.exit(0);
}

const RESERVED = new Set([
  'delete','private','public','protected','static',
  'in','of','new','typeof','void','class','extends',
  'implements','interface','enum','abstract','default',
  'is','for','async','await','super','with','debugger',
]);

// Quick pre-check regex — match reserved words followed by ":" (property) or "(" (method)
const QUICK_RE = /\b(async|default|in|delete|private|public|for|of|new|class|typeof|void|is|await|super|static|enum|extends|implements|interface|abstract|with|debugger|protected)\s*[:(]/;

let fixedFiles = 0;
let scannedFiles = 0;
let skippedQuick = 0;
let lastLog = Date.now();

function fixFile(filePath) {
  scannedFiles++;
  if (Date.now() - lastLog > 5000) {
    process.stdout.write('[fix-hermes] scanned=' + scannedFiles + ' fixed=' + fixedFiles + '\n');
    lastLog = Date.now();
  }
  let src;
  try { src = fs.readFileSync(filePath, 'utf8'); } catch(e) { return; }

  // Quick pre-check
  if (!QUICK_RE.test(src)) { skippedQuick++; return; }

  let ast;
  try {
    ast = babelParser.parse(src, {
      sourceType: 'unambiguous',
      plugins: [],
      errorRecovery: true,
    });
  } catch(e) { return; }

  const replacements = [];
  try {
    babelTraverse(ast, {
      ObjectProperty(np) {
        const node = np.node;
        const { key, computed } = node;
        // Skip shorthand properties: { async } means { async: async }
        // Quoting would produce { "async" } which is invalid
        if (node.shorthand) return;
        if (!computed && key.type === 'Identifier' &&
            typeof key.start === 'number' && RESERVED.has(key.name)) {
          replacements.push({ start: key.start, end: key.end, name: key.name });
        }
      },
      ObjectMethod(np) {
        const { key, computed } = np.node;
        if (!computed && key.type === 'Identifier' &&
            typeof key.start === 'number' && RESERVED.has(key.name)) {
          replacements.push({ start: key.start, end: key.end, name: key.name });
        }
      },
    });
  } catch(e) { return; }

  if (replacements.length === 0) return;

  // Sort end-to-start so positions don't shift
  replacements.sort((a, b) => b.start - a.start);

  const seen = new Set();
  let result = src;
  let applied = 0;

  for (const { start, end, name } of replacements) {
    const key = start + ':' + end;
    if (seen.has(key)) continue;
    seen.add(key);

    // Safety: verify position matches expected identifier
    const actual = result.slice(start, end);
    if (actual !== name) continue;

    result = result.slice(0, start) + '"' + name + '"' + result.slice(end);
    applied++;
  }

  if (applied > 0 && result !== src) {
    fs.writeFileSync(filePath, result, 'utf8');
    fixedFiles++;
  }
}

function scanDir(dir, depth) {
  if (depth > 6) return;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch(e) { return; }

  for (const e of entries) {
    // Skip nested node_modules, caches, test dirs
    if (e.name === 'node_modules' || e.name === '.cache' ||
        e.name === '__tests__' || e.name === 'test' ||
        e.name === '__mocks__') continue;

    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      scanDir(full, depth + 1);
    } else if (e.name.endsWith('.js') || e.name.endsWith('.mjs') || e.name.endsWith('.cjs')) {
      // Skip files > 500KB (huge bundles are slow to parse)
      try {
        const stat = fs.statSync(full);
        if (stat.size > 500000) continue;
      } catch(e) { continue; }
      fixFile(full);
    }
  }
}

console.log('[fix-hermes] Scanning node_modules for unquoted reserved-word object keys...');
const startTime = Date.now();

const nmDir = path.join(ROOT, 'node_modules');

// Scan .prisma/client explicitly — hidden dirs are skipped by the main loop
const prismaDir = path.join(nmDir, '.prisma', 'client');
try {
  if (fs.existsSync(prismaDir)) {
    scanDir(prismaDir, 0);
  }
} catch(e) {}

try {
  for (const pkg of fs.readdirSync(nmDir)) {
    if (pkg.startsWith('.')) continue;
    const pkgPath = path.join(nmDir, pkg);
    try {
      const stat = fs.statSync(pkgPath);
      if (!stat.isDirectory()) continue;
    } catch(e) { continue; }

    if (pkg.startsWith('@')) {
      // Scoped package — scan each sub-package
      try {
        for (const sub of fs.readdirSync(pkgPath)) {
          scanDir(path.join(pkgPath, sub), 0);
        }
      } catch(e) {}
    } else {
      scanDir(pkgPath, 0);
    }
  }
} catch(e) {
  console.warn('[fix-hermes] Could not read node_modules:', e.message);
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log('[fix-hermes] Done in ' + elapsed + 's. Fixed ' + fixedFiles + ' files (' + scannedFiles + ' scanned, ' + skippedQuick + ' skipped by pre-check).');
