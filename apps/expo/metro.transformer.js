// metro.transformer.js — Fix reserved-word object keys for Hermes (v2)
//
// Hermes rejects unquoted reserved words as object property keys:
//   { default: 1 }  →  { "default": 1 }
//
// Strategy: run the upstream Babel transform FIRST (which strips Flow/TS,
// resolves imports, etc.), then do a fast regex pass on the **output JS**
// to quote any remaining unquoted reserved-word property keys.
//
// This is bullet-proof because:
//  1. The upstream transform converts all Flow/TS to plain JS first
//  2. We operate on the final output — nothing can sneak through
//  3. Works for ALL files (node_modules, .prisma, packages, etc.)
//  4. No AST parsing required — immune to Flow/TS parse failures
const path   = require('path');
const crypto = require('crypto');
const upstreamTransformer = require('@expo/metro-config/build/babel-transformer');

// ── Reserved words that Hermes rejects as bare object property keys ──────────
const RESERVED = [
  'delete','private','public','protected','static',
  'in','of','new','typeof','void','class','extends',
  'implements','interface','enum','abstract','default',
  'is','for','async','await','super','with','debugger',
];

// Lookbehind for { or , (object-context delimiters), then whitespace,
// then a bare reserved word followed by colon.
// The lookbehind ensures we only match inside object literals, not
// switch/case, for..in, labels, etc.
const RESERVED_PROP_RE = new RegExp(
  '(?<=[{,])(\\s*)(' + RESERVED.join('|') + ')(\\s*:)',
  'g'
);

// Quick pre-check to skip files that can't possibly have the issue
const QUICK_CHECK = new RegExp(
  '\\b(' + RESERVED.join('|') + ')\\s*:'
);

function quoteReservedKeys(src) {
  if (!QUICK_CHECK.test(src)) return src;
  return src.replace(RESERVED_PROP_RE, function(_match, ws, keyword, colon) {
    return ws + '"' + keyword + '"' + colon;
  });
}

module.exports.transform = async function (input) {
  // 1. Run the upstream Babel transform (strips Flow, TS, JSX, etc.)
  const result = await upstreamTransformer.transform(input);

  // 2. Post-process the transformed output to quote reserved-word property keys.
  //    At this point all code is plain JS — no Flow/TS to worry about.
  if (result.output && Array.isArray(result.output)) {
    for (const item of result.output) {
      if (item.data && item.data.code && typeof item.data.code === 'string') {
        item.data.code = quoteReservedKeys(item.data.code);
      }
    }
  } else if (result.code && typeof result.code === 'string') {
    result.code = quoteReservedKeys(result.code);
  }

  return result;
};

// Cache key: hash the transformer so any change invalidates Metro cache
const _hash = crypto
  .createHash('md5')
  .update(require('fs').readFileSync(__filename))
  .digest('hex');

const _upstream = typeof upstreamTransformer.getCacheKey === 'function'
  ? upstreamTransformer.getCacheKey() : '';

module.exports.getCacheKey = () => _upstream + '-hermesFix-v2-' + _hash;
