#!/usr/bin/env node
// Copyright 2026 Parallax
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/*
  Builds the figures toolkit, src/figures/, into dist/figures.v<major>.js with
  esbuild (d3 and hyparquet need a newer parser than the template's Rollup).
  The licences of the bundled packages go at the end of the file.

    node bin/build-figures.js            build once
    node bin/build-figures.js --watch    rebuild on changes
*/

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const entry = path.join(root, 'src', 'figures', 'index.js');
const version = fs.readFileSync(entry, 'utf8').match(/export const version = '([\d.]+)'/)[1];
const outfile = path.join(root, 'dist', 'figures.v' + version.split('.')[0] + '.js');

/*
  d3 v7 accepts old versions of some of its modules ("d3-color": "1 - 3"), so
  npm may hand it the old copies the template depends on, and the bundle
  would hold two of each. Resolve every d3-* module from the d3 package
  itself, where npm puts the versions d3 asks for.
*/
const d3Dir = path.join(root, 'node_modules', 'd3');
const oneD3 = {
  name: 'one-d3',
  setup(build) {
    build.onResolve({ filter: /^d3-[a-z-]+$/ }, args => {
      if (args.pluginData && args.pluginData.fromD3) return undefined;
      return build.resolve(args.path, { kind: args.kind, resolveDir: d3Dir, pluginData: { fromD3: true } });
    });
  },
};

const options = {
  entryPoints: [entry],
  plugins: [oneD3],
  bundle: true,
  format: 'iife',
  globalName: 'plx',
  platform: 'browser',
  target: ['es2020'],
  loader: { '.css': 'text' },
  legalComments: 'none',
  logLevel: 'warning',
};

/* The packages bundled from node_modules, with their licence texts. */
function bundledLicences(metafile) {
  const packages = new Map();
  for (const input of Object.keys(metafile.inputs)) {
    const match = input.match(/^(.*node_modules\/((?:@[^/]+\/)?[^/]+))\//);
    if (!match || packages.has(match[2])) continue;
    const dir = path.join(root, match[1]);
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    const file = fs.readdirSync(dir).find(f => /^licen[cs]e(\.(md|txt))?$/i.test(f));
    const text = file ? fs.readFileSync(path.join(dir, file), 'utf8').trim() : '';
    packages.set(match[2], { name: pkg.name, version: pkg.version, license: pkg.license, text });
  }
  return Array.from(packages.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function comments(packages) {
  const byText = new Map();
  for (const p of packages) {
    const key = p.text || p.license;
    if (!byText.has(key)) byText.set(key, []);
    byText.get(key).push(p);
  }
  const safe = s => s.replace(/\*\//g, '* /');
  const list = packages.map(p => p.name + ' ' + p.version + ' (' + p.license + ')').join(', ');
  const banner = '/*! Parallax figures toolkit v' + version + ' | Apache-2.0 | ' +
    'https://github.com/parallx-ai/blog-template\n' +
    ' * Bundles ' + list + '.\n * Their licences are at the end of this file. */';
  const sections = Array.from(byText.entries()).map(([text, group]) =>
    '---- ' + group.map(p => p.name + ' ' + p.version).join(', ') + '\n\n' + safe(text));
  const footer = '/*! Licences of the bundled packages\n\n' + sections.join('\n\n') + '\n*/\n' +
    'if (typeof module === "object" && module.exports) module.exports = plx;';
  return { banner, footer };
}

async function main() {
  const scan = await esbuild.build(Object.assign({}, options, { write: false, metafile: true }));
  const { banner, footer } = comments(bundledLicences(scan.metafile));
  const config = Object.assign({}, options, {
    outfile,
    minify: true,
    sourcemap: true,
    banner: { js: banner },
    footer: { js: footer },
  });
  if (process.argv.includes('--watch')) {
    const context = await esbuild.context(config);
    await context.watch();
    console.log('Watching src/figures/ for ' + path.relative(root, outfile) + '.');
  } else {
    await esbuild.build(config);
    const size = fs.statSync(outfile).size;
    console.log('Built ' + path.relative(root, outfile) + ' (' + Math.round(size / 1024) + ' KB).');
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
