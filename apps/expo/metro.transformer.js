const path = require('path');

// Obtener el transformer que NativeWind configuró (o el de Expo por defecto)
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

const PROBLEMATIC_PACKAGES = [
  /@prisma/,
  /@emotion\/is-prop-valid/,
  /@tanstack\/query-devtools/,
  /node_modules\/zod\//,
];

module.exports.transform = async function(input) {
  if (PROBLEMATIC_PACKAGES.some(re => re.test(input.filename))) {
    input = { ...input, src: fixReservedWords(input.src) };
  }
  return upstreamTransformer.transform(input);
};

module.exports.getCacheKey = upstreamTransformer.getCacheKey;
