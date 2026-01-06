#!/usr/bin/env node
// Generate a charts manifest from public/charts
// Output: public/charts-manifest.json

const { readdirSync, statSync, writeFileSync } = require('fs');
const { join } = require('path');

function buildManifest(baseDir) {
  const manifest = {};

  let icaos = [];
  try {
    icaos = readdirSync(baseDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  } catch (e) {
    return manifest;
  }

  for (const icao of icaos) {
    const icaoDir = join(baseDir, icao);
    let types = [];
    try {
      types = readdirSync(icaoDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
    } catch (e) {
      continue;
    }

    const entries = [];
    for (const type of types) {
      const typeDir = join(icaoDir, type);
      let files = [];
      try {
        files = readdirSync(typeDir, { withFileTypes: true })
          .filter(f => f.isFile() && f.name.toLowerCase().endsWith('.pdf'))
          .map(f => {
            const full = join(typeDir, f.name);
            const stat = statSync(full);
            return {
              name: f.name,
              size: stat.size
            };
          });
      } catch (e) {
        files = [];
      }
      if (files.length) entries.push({ type, files });
    }
    if (entries.length) manifest[icao] = entries;
  }

  return manifest;
}

function main() {
  const publicDir = join(process.cwd(), 'public');
  const chartsDir = join(publicDir, 'charts');
  const outPath = join(publicDir, 'charts-manifest.json');

  const manifest = buildManifest(chartsDir);
  writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), manifest }, null, 2));
  console.log(`Wrote manifest with ${Object.keys(manifest).length} ICAOs to ${outPath}`);
}

if (require.main === module) {
  main();
}
