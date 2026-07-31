#!/usr/bin/env node
/**
 * Post-install patch: agrega `@unknown default:` al switch sobre
 * `Calendar.Identifier` en expo-localization.
 *
 * A partir del SDK de iOS 26, Apple sumó nuevos identificadores de calendario
 * (.bangla, .gujarati, .kannada, .malayalam, .marathi, .odia, .tamil), y la
 * versión de expo-localization que usa este proyecto (Expo SDK 50) tiene un
 * switch no exhaustivo que rompe la compilación con Xcode 26+.
 *
 * Este parche es idempotente: si ya encuentra `@unknown default`, no hace nada.
 */
const fs = require('fs');
const path = require('path');

const TARGET = path.resolve(
  __dirname,
  '../node_modules/expo-localization/ios/LocalizationModule.swift',
);

if (!fs.existsSync(TARGET)) {
  console.warn('[fix-expo-localization] LocalizationModule.swift no encontrado, se salta (¿no hay build de iOS?).');
  process.exit(0);
}

let src = fs.readFileSync(TARGET, 'utf8');

if (src.includes('@unknown default:')) {
  console.log('[fix-expo-localization] Ya parcheado, nada que hacer.');
  process.exit(0);
}

const NEEDLE = `    case .iso8601:\n      return "iso8601"\n    }\n  }`;
const REPLACEMENT = `    case .iso8601:\n      return "iso8601"\n    @unknown default:\n      return "gregory"\n    }\n  }`;

if (!src.includes(NEEDLE)) {
  console.warn('[fix-expo-localization] No se encontró el patrón esperado — el paquete puede haber cambiado. Revisar manualmente.');
  process.exit(0);
}

src = src.replace(NEEDLE, REPLACEMENT);
fs.writeFileSync(TARGET, src);
console.log('[fix-expo-localization] Parche aplicado a LocalizationModule.swift.');
