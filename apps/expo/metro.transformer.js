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
  return src.replace(RESERVED_PATTERN, (match) => `"${match}"`);
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

  if (isNodeModule && !shouldSkip && shouldTransform) {
    input = { ...input, src: fixReservedWords(input.src) };
  }
  return upstreamTransformer.transform(input);
};

module.exports.getCacheKey = upstreamTransformer.getCacheKey;
