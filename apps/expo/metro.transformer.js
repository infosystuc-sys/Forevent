// metro.transformer.js — Fix reserved-word object keys/methods for Hermes
//
// Hermes rejects unquoted reserved words as:
//   - Object property keys:  { default: 1 }       -> { "default": 1 }
//   - Object method names:   { default() {} }      -> { "default"() {} }
//
// Uses @babel/parser AST for precise detection. Runs BEFORE babel-preset-expo.
// Targets: node_modules .js/.mjs/.cjs files AND .prisma/client files.
const path   = require('path');
const crypto = require('crypto');
const upstreamTransformer = require('@expo/metro-config/build/babel-transformer');

const MONOREPO_ROOT = path.join(__dirname, '..', '..');

let babelParser, babelTraverse;
try {
    babelParser   = require(path.join(MONOREPO_ROOT, 'node_modules/@babel/parser'));
    babelTraverse = require(path.join(MONOREPO_ROOT, 'node_modules/@babel/traverse')).default;
} catch (e) {
    console.warn('[transformer] babel not available:', e.message);
}

const RESERVED = new Set([
    'delete', 'private', 'public', 'protected', 'static',
    'in', 'of', 'new', 'typeof', 'void', 'class', 'extends',
    'implements', 'interface', 'enum', 'abstract', 'default',
    'is', 'for', 'async', 'await', 'super', 'with', 'debugger',
]);

// Pre-check: match reserved words followed by ":" (property) or "(" (method)
// This avoids parsing files that can't possibly have the issue.
const QUICK_CHECK = /\b(async|default|in|delete|private|public|for|of|new|class|typeof|void|is|await|super|static|enum|extends|implements|interface|abstract|with|debugger|protected)\s*[:(]/;

function fixReservedWords(src, filename) {
    if (!babelParser || !babelTraverse) return src;

    // Only process JS files (node_modules are always .js/.mjs/.cjs)
    const ext = path.extname(filename || '').toLowerCase();
    if (ext !== '.js' && ext !== '.mjs' && ext !== '.cjs') return src;

    // Quick pre-check: skip files without any potential match
    if (!QUICK_CHECK.test(src)) return src;

    let ast;
    try {
        // Parse as plain JS — do NOT use TypeScript plugin for node_modules .js files.
        // Using 'typescript' plugin on .js files misparses comparisons like `a<b, c>(d)`.
        // IMPORTANT: errorRecovery is OFF — files that fail to parse (Flow, etc.)
        // are skipped safely. The postinstall patch already handles them on disk.
        ast = babelParser.parse(src, {
            sourceType: 'unambiguous',
            plugins: [],
        });
    } catch (e) {
        return src;
    }

    const replacements = [];
    try {
        babelTraverse(ast, {
            // { default: value, private: value }
            ObjectProperty(np) {
                const node = np.node;
                const { key, computed } = node;
                // Skip shorthand { async } — quoting would produce invalid { "async" }
                if (node.shorthand) return;
                if (!computed && key.type === 'Identifier' &&
                    typeof key.start === 'number' && RESERVED.has(key.name)) {
                    replacements.push({ start: key.start, end: key.end, name: key.name });
                }
            },
            // { default() {}, delete() {} }
            ObjectMethod(np) {
                const { key, computed } = np.node;
                if (!computed && key.type === 'Identifier' &&
                    typeof key.start === 'number' && RESERVED.has(key.name)) {
                    replacements.push({ start: key.start, end: key.end, name: key.name });
                }
            },
        });
    } catch (e) {
        return src;
    }

    if (replacements.length === 0) return src;

    // Sort end-to-start so replacements don't shift positions
    replacements.sort((a, b) => b.start - a.start);

    const seen = new Set();
    let result = src;

    for (const { start, end, name } of replacements) {
        const id = start + ':' + end;
        if (seen.has(id)) continue;
        seen.add(id);

        // Safety: verify the source at this position matches the identifier
        const actual = result.slice(start, end);
        if (actual !== name) continue;

        // Context validation: the char after the identifier must be ":" or "("
        // (property key or method name). This prevents corrupting if/for/while conditions.
        const charAfter = result[end];
        if (charAfter !== ':' && charAfter !== '(') continue;

        result = result.slice(0, start) + '"' + name + '"' + result.slice(end);
    }

    return result;
}

// Track which files have been logged to avoid flooding the console
const _loggedFiles = new Set();

module.exports.transform = async function (input) {
    // Normalize path separators (Windows backslash → forward slash)
    const norm = input.filename.replace(/\\/g, '/');

    // Transform node_modules AND .prisma/client JS files
    // .prisma is a hidden dir inside node_modules that scanners often skip
    const isNodeModule = norm.includes('node_modules') || norm.includes('.prisma');
    const isJsFile = /\.(js|mjs|cjs)$/.test(norm);

    if (isNodeModule && isJsFile) {
        const before = input.src;
        const after  = fixReservedWords(before, input.filename);

        if (before !== after) {
            if (!_loggedFiles.has(norm)) {
                _loggedFiles.add(norm);
                console.log('[transformer] FIXED ' + path.basename(norm));
            }
            input = { ...input, src: after };
        }
    }

    return upstreamTransformer.transform(input);
};

// Cache key: hash the entire transformer file so any change invalidates cache
const _hash = crypto
    .createHash('md5')
    .update(require('fs').readFileSync(__filename))
    .digest('hex');

const _upstream = typeof upstreamTransformer.getCacheKey === 'function'
    ? upstreamTransformer.getCacheKey() : '';

module.exports.getCacheKey = () => _upstream + '-hermesFix-' + _hash;
