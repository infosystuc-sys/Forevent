/**
 * metro.transformer.js — Custom Metro transformer para Hermes
 *
 * Problema: Hermes (el motor JS de React Native) no acepta palabras
 * reservadas de JavaScript como claves de objeto sin comillas:
 *   { default: 1, async: 2 }   ← Hermes falla
 *   { "default": 1, "async": 2 } ← OK
 *
 * Archivos afectados (node_modules):
 *   - zod/lib/types.js          → 4 ocurrencias de `async:`
 *   - dayjs/locale/*.js         → 1 ocurrencia de `default:` por archivo (144 archivos)
 *   - dayjs-with-plugins/...    → 142 ocurrencias de `default:`
 *   - @babel/types/lib/index.js → 1 ocurrencia de `is:`
 *
 * Solución: AST parsing con @babel/parser + @babel/traverse.
 *   - Visita SOLO ObjectProperty/ObjectMethod con key Identifier reservada.
 *   - Reemplazo quirúrgico por posición AST (nunca toca strings ni comentarios).
 *   - Guard de posición: verifica que el slice coincide con el nombre esperado
 *     antes de aplicar el reemplazo (protege contra posiciones erróneas de
 *     errorRecovery).
 */

const path   = require('path');
const crypto = require('crypto');
const upstreamTransformer = require('@expo/metro-config/build/babel-transformer');

// ─── Babel AST tools (root del monorepo) ──────────────────────────────────────
const MONOREPO_ROOT = path.join(__dirname, '..', '..');

let babelParser   = null;
let babelTraverse = null;

try {
    babelParser   = require(path.join(MONOREPO_ROOT, 'node_modules/@babel/parser'));
    babelTraverse = require(path.join(MONOREPO_ROOT, 'node_modules/@babel/traverse')).default;
} catch (e) {
    console.warn('[metro.transformer] @babel/parser o @babel/traverse no disponibles:', e.message);
}

// ─── Palabras reservadas que Hermes rechaza como keys sin comillas ─────────────
const RESERVED_SET = new Set([
    'delete', 'private', 'public', 'protected', 'static',
    'in', 'of', 'new', 'typeof', 'void', 'class', 'extends',
    'implements', 'interface', 'enum', 'abstract', 'default',
    'is', 'for', 'async', 'await', 'super', 'with', 'debugger',
]);

/**
 * Reemplaza claves de objeto reservadas usando posiciones exactas del AST.
 *
 * @param {string} src      - source JS original
 * @param {string} filename - ruta del archivo
 * @returns {string}        - source corregido
 */
function fixReservedWords(src, filename) {
    if (!babelParser || !babelTraverse) return src;

    // Solo archivos .js (todos los node_modules afectados son .js)
    const ext = path.extname(filename || '').toLowerCase();
    if (ext !== '.js' && ext !== '.mjs' && ext !== '.cjs') return src;

    let ast;
    try {
        ast = babelParser.parse(src, {
            sourceType: 'module',
            plugins: [],
            errorRecovery: true,
        });
    } catch (e) {
        return src;
    }

    const replacements = [];

    try {
        babelTraverse(ast, {
            ObjectProperty(nodePath) {
                const { key, computed } = nodePath.node;
                if (
                    !computed &&
                    key.type === 'Identifier' &&
                    typeof key.start === 'number' &&
                    RESERVED_SET.has(key.name)
                ) {
                    replacements.push({ start: key.start, end: key.end, name: key.name });
                }
            },
            ObjectMethod(nodePath) {
                const { key, computed } = nodePath.node;
                if (
                    !computed &&
                    key.type === 'Identifier' &&
                    typeof key.start === 'number' &&
                    RESERVED_SET.has(key.name)
                ) {
                    replacements.push({ start: key.start, end: key.end, name: key.name });
                }
            },
        });
    } catch (e) {
        return src;
    }

    if (replacements.length === 0) return src;

    // Ordenar de mayor a menor para que cada reemplazo no desplace los anteriores.
    replacements.sort((a, b) => b.start - a.start);

    const seen = new Set();
    let result = src;
    let applied = 0;
    let skipped = 0;

    for (const { start, end, name } of replacements) {
        const dedupeKey = `${start}:${end}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        // Guard: verificar que la posición AST apunta exactamente al identificador.
        // errorRecovery puede producir posiciones incorrectas; si el slice no
        // coincide, saltar en lugar de corromper el source.
        const actual = result.slice(start, end);
        if (actual !== name) {
            console.warn(
                `[transformer] SKIP bad AST pos ${start}:${end} ` +
                `expected ${JSON.stringify(name)} found ${JSON.stringify(actual.slice(0, 30))} ` +
                `ctx: ${JSON.stringify(result.slice(Math.max(0, start - 20), end + 20))}`
            );
            skipped++;
            continue;
        }

        result = result.slice(0, start) + JSON.stringify(name) + result.slice(end);
        applied++;
    }

    if (skipped > 0) {
        console.warn(`[transformer] ${filename}: applied ${applied}, SKIPPED ${skipped} bad positions`);
    }

    return result;
}

// ─── Paquetes de node_modules que SÍ deben transformarse ──────────────────────
// Solo los que tienen palabras reservadas como object property keys sin comillas.
// El filename ya está normalizado a forward-slash antes de testear estos regex.
const PACKAGES_TO_FIX = [
    /\/zod\//,            // zod/lib/types.js: 4× `async:`
    /\/dayjs\//,          // dayjs/locale/*.js: 1× `default:` cada uno (144 archivos)
    /dayjs-with-plugins/, // dist bundle: 142× `default:`
    /@babel\/types/,      // @babel/types/lib/index.js: 1× `is:`
    /@prisma/,            // precaución (puede tener reserved words)
    /@emotion/,           // precaución (puede tener reserved words)
];

// ─── Transform principal ───────────────────────────────────────────────────────
const _logged = new Set();

module.exports.transform = async function (input) {
    // Normalizar separadores a forward-slash (Windows usa backslash).
    const normFilename = input.filename.replace(/\\/g, '/');

    const isNodeModule = normFilename.includes('node_modules');
    const shouldFix    = isNodeModule && PACKAGES_TO_FIX.some((re) => re.test(normFilename));

    if (shouldFix) {
        const srcBefore = input.src;
        const srcAfter  = fixReservedWords(srcBefore, input.filename);

        if (srcBefore !== srcAfter) {
            if (!_logged.has(input.filename)) {
                _logged.add(input.filename);
                console.log(`[transformer] ✏️  MODIFIED ${input.filename}`);
            }
            input = { ...input, src: srcAfter };
        } else if (!_logged.has(input.filename)) {
            _logged.add(input.filename);
            console.log(`[transformer]    unchanged ${input.filename}`);
        }
    }

    return upstreamTransformer.transform(input);
};

// ─── Cache key ─────────────────────────────────────────────────────────────────
const TRANSFORMER_HASH = crypto
    .createHash('md5')
    .update(require('fs').readFileSync(__filename))
    .digest('hex');

const _upstreamCacheKey =
    typeof upstreamTransformer.getCacheKey === 'function'
        ? upstreamTransformer.getCacheKey()
        : '';

module.exports.getCacheKey = () =>
    `${_upstreamCacheKey}-fixReserved-${TRANSFORMER_HASH}`;
