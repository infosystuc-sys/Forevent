const path = require('path');
const upstreamTransformer = require('@expo/metro-config/build/babel-transformer');

const RESERVED_WORDS = [
  'delete', 'private', 'public', 'protected', 'static',
  'in', 'of', 'new', 'typeof', 'void', 'class', 'extends',
  'implements', 'interface', 'enum', 'abstract', 'default',
  'is', 'for', 'async', 'await', 'super', 'with', 'debugger'
];

const RESERVED_PATTERN = new RegExp(
  `(?<!["\\'\\w])(${RESERVED_WORDS.join('|')})(?=\\s*:)`,
  'g'
);

function fixReservedWords(src) {
  return src.replace(RESERVED_PATTERN, (match, _group, offset) => {
    // Determine what follows "word:" on the same line.
    // Switch/block labels:  "default:"   → nothing after the colon → skip.
    // Object properties:    "default: x" → value after the colon  → quote.
    const rest = src.slice(offset + match.length);
    const afterColon = (rest.match(/^\s*:(.*)/) ?? [])[1] ?? '';
    const meaningful = afterColon.replace(/\/\/.*$/, '').trim();
    if (!meaningful) return match; // switch label – don't quote
    return `"${match}"`;
  });
}

const SAFE_TO_TRANSFORM = [
  /@prisma/,
  /@emotion/,
  /@tanstack/,
  /\/zod\//,
  /@babel\/types/,
];

const SKIP_PACKAGES = [
  /node_modules\/react\//,
  /node_modules\/react-dom\//,
  /node_modules\/react-native\//,
  /node_modules\/@react-native/,
  /node_modules\/expo\//,
  /node_modules\/@expo\//,
  /node_modules\/nativewind\//,
];

module.exports.transform = async function(input) {
  const isNodeModule = input.filename.includes('node_modules');
  const shouldSkip = SKIP_PACKAGES.some(re => re.test(input.filename));
  const shouldTransform = SAFE_TO_TRANSFORM.some(re => re.test(input.filename));

  // Los paquetes del monorepo (packages/) no están en node_modules,
  // por lo que el guard anterior no los cubría. El código de packages/api
  // puede contener palabras reservadas en queries de Prisma que Hermes
  // no acepta sin comillas cuando Metro lo bundlea como source local.
  const isMonorepoPackage =
    input.filename.includes(`${path.sep}packages${path.sep}`) ||
    input.filename.includes('/packages/');

  if ((isNodeModule && !shouldSkip && shouldTransform) || isMonorepoPackage) {
    input = { ...input, src: fixReservedWords(input.src) };
  }
  return upstreamTransformer.transform(input);
};

module.exports.getCacheKey = upstreamTransformer.getCacheKey;
