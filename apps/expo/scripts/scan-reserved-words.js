/**
 * Scan all packages/ and key node_modules files for reserved-word ObjectProperty keys
 * that would need to be quoted for Hermes compatibility.
 *
 * Run from monorepo root: node apps/expo/scripts/scan-reserved-words.js
 */
const fs = require('fs');
const path = require('path');

const MONOREPO_ROOT = path.join(__dirname, '..', '..', '..');
const babelParser   = require(path.join(MONOREPO_ROOT, 'node_modules/@babel/parser'));
const babelTraverse = require(path.join(MONOREPO_ROOT, 'node_modules/@babel/traverse')).default;

const RESERVED_SET = new Set([
  'delete','private','public','protected','static','in','of','new','typeof','void',
  'class','extends','implements','interface','enum','abstract','default','is','for',
  'async','await','super','with','debugger'
]);

function walk(dir, exts) {
  let results = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.turbo' && entry.name !== 'dist') {
        results = results.concat(walk(full, exts));
      } else if (entry.isFile() && exts.includes(path.extname(entry.name))) {
        results.push(full);
      }
    }
  } catch(e) {}
  return results;
}

function findReservedWords(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const ext = path.extname(filePath).toLowerCase();
  const plugins = [];
  if (ext === '.ts' || ext === '.tsx') plugins.push('typescript');
  if (ext === '.tsx' || ext === '.jsx') plugins.push('jsx');

  let ast;
  try {
    ast = babelParser.parse(src, { sourceType: 'module', plugins, errorRecovery: true });
  } catch(e) { return null; }

  const replacements = [];
  try {
    babelTraverse(ast, {
      ObjectProperty(np) {
        const { key, computed } = np.node;
        if (!computed && key.type === 'Identifier' && typeof key.start === 'number' && RESERVED_SET.has(key.name)) {
          // Verify position actually contains the identifier (sanity check)
          const actual = src.slice(key.start, key.end);
          replacements.push({ start: key.start, end: key.end, name: key.name, posOK: actual === key.name });
        }
      }
    });
  } catch(e) { return null; }

  return replacements;
}

function applyReplacements(src, replacements) {
  const sorted = [...replacements].sort((a, b) => b.start - a.start);
  const seen = new Set();
  let result = src;
  let bad = 0;
  for (const { start, end, name } of sorted) {
    const key = start + ':' + end;
    if (seen.has(key)) continue;
    seen.add(key);
    const actual = result.slice(start, end);
    if (actual !== name) { bad++; continue; }
    result = result.slice(0, start) + JSON.stringify(name) + result.slice(end);
  }
  return { result, bad };
}

// --- Scan packages/ ---
console.log('\n=== Scanning packages/ ===');
const packagesDir = path.join(MONOREPO_ROOT, 'packages');
const pkgFiles = walk(packagesDir, ['.ts', '.tsx', '.js']);
console.log('Files found:', pkgFiles.length);

for (const f of pkgFiles) {
  const replacements = findReservedWords(f);
  if (replacements && replacements.length > 0) {
    const rel = f.replace(MONOREPO_ROOT, '').replace(/\\/g, '/');
    const names = [...new Set(replacements.map(r => r.name))];
    console.log('FOUND:', rel, '->', replacements.length, 'occurrences:', names.join(', '));
    for (const r of replacements.slice(0, 3)) {
      const src = fs.readFileSync(f, 'utf8');
      const ctx = src.slice(Math.max(0, r.start - 20), r.end + 20);
      console.log('  pos', r.start + ':' + r.end, JSON.stringify(ctx));
    }
    // Validate transformation
    const src = fs.readFileSync(f, 'utf8');
    const { result, bad } = applyReplacements(src, replacements);
    try {
      const ext = path.extname(f).toLowerCase();
      const plugins = [];
      if (ext === '.ts' || ext === '.tsx') plugins.push('typescript');
      babelParser.parse(result, { sourceType: 'module', plugins, errorRecovery: false });
      console.log('  transform: OK (bad positions:', bad, ')');
    } catch(e) {
      console.log('  transform: PARSE ERROR -', e.message, 'at pos', e.pos);
      const ctx = result.slice(Math.max(0, (e.pos||0) - 50), (e.pos||0) + 50);
      console.log('  error context:', JSON.stringify(ctx));
    }
  }
}

// --- Scan key node_modules ---
console.log('\n=== Scanning key node_modules ===');
const nodeModulesFiles = [
  'node_modules/zod/lib/types.js',
  'node_modules/dayjs-with-plugins/dist/dayjs-with-plugins.js',
  'node_modules/@babel/types/lib/index.js',
  'node_modules/@tanstack/react-query/build/legacy/index.js',
  'node_modules/@tanstack/query-core/build/legacy/index.js',
];
for (const rel of nodeModulesFiles) {
  const f = path.join(MONOREPO_ROOT, rel);
  if (!fs.existsSync(f)) { console.log('MISSING:', rel); continue; }
  const replacements = findReservedWords(f);
  if (!replacements) { console.log('PARSE FAILED:', rel); continue; }
  if (replacements.length === 0) { console.log('unchanged:', rel); continue; }
  const src = fs.readFileSync(f, 'utf8');
  const { result, bad } = applyReplacements(src, replacements);
  let parseErr = null;
  try {
    babelParser.parse(result, { sourceType: 'module', plugins: [], errorRecovery: false });
  } catch(e) {
    parseErr = e.message + ' at pos ' + e.pos;
  }
  const names = [...new Set(replacements.map(r => r.name))];
  console.log(rel, ':', replacements.length, 'replacements, bad:', bad, 'parseErr:', parseErr, 'keys:', names.join(','));
}
