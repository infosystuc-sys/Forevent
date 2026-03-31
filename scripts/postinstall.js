#!/usr/bin/env node
/**
 * Cross-platform postinstall (reemplaza `pnpm lint:ws || true && node patches/...`)
 * Funciona en Windows cmd, PowerShell, bash y CI.
 */
'use strict'

const { execSync } = require('child_process')
const path = require('path')

const ROOT = path.join(__dirname, '..')

// pnpm lint:ws es opcional — ignora fallas (equivalente a `|| true`)
try {
  execSync('pnpm dlx sherif@latest', { stdio: 'inherit', cwd: ROOT })
} catch (_) {
  // No bloquea la instalación
}

// Patch obligatorio: palabras reservadas de Hermes para React Native
execSync('node patches/fix-hermes-reserved-words.js', { stdio: 'inherit', cwd: ROOT })
