#!/usr/bin/env node
/**
 * Workaround: pnpm a veces no extrae la carpeta android de react-native-gesture-handler.
 * Este script la restaura descargando desde unpkg si falta.
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const rootDir = path.resolve(__dirname, "../..");
const pkgDir = path.join(rootDir, "node_modules", "react-native-gesture-handler");
const androidDir = path.join(pkgDir, "android");

if (fs.existsSync(androidDir)) {
  process.exit(0);
}

const pkgPath = path.join(pkgDir, "package.json");
if (!fs.existsSync(pkgPath)) {
  process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const version = pkg.version;

console.log("[expo] Restaurando android/ de react-native-gesture-handler@%s...", version);

const tmpDir = path.join(rootDir, "node_modules", ".rngesture-tmp");
fs.mkdirSync(tmpDir, { recursive: true });
const tgzPath = path.join(tmpDir, `rngesture-${version}.tgz`);

const url = `https://registry.npmjs.org/react-native-gesture-handler/-/react-native-gesture-handler-${version}.tgz`;

https.get(url, (res) => {
  if (res.statusCode !== 200) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    process.exit(0);
    return;
  }
  const f = fs.createWriteStream(tgzPath);
  res.pipe(f);
  f.on("finish", () => {
    f.close(() => {
      try {
        const tar = require("tar");
        tar.extract({ file: tgzPath, cwd: tmpDir });
        const extracted = path.join(tmpDir, "package", "android");
        if (fs.existsSync(extracted)) {
          fs.renameSync(extracted, androidDir);
          console.log("[expo] android/ restaurado correctamente.");
        }
      } catch {}
      fs.rmSync(tmpDir, { recursive: true, force: true });
      process.exit(0);
    });
  });
}).on("error", () => process.exit(0));