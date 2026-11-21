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
  Copies plxviz's palette (docs/palette.json, the output of `viz colors --json`)
  into src/figures/palette.json, so figures drawn in the browser use the same
  colours as plxviz.

    node bin/sync-palette.js ../plxviz
*/

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const checkout = process.argv[2];
if (!checkout) {
  console.error('Usage: node bin/sync-palette.js <path to a plxviz checkout>');
  process.exit(1);
}
const source = path.resolve(checkout, 'docs', 'palette.json');
const target = path.resolve(__dirname, '..', 'src', 'figures', 'palette.json');
const text = fs.readFileSync(source, 'utf8');
const palette = JSON.parse(text);
if (palette.source !== 'plxviz' || !palette.colors || !palette.reference) {
  console.error(source + ' does not look like plxviz\'s palette.');
  process.exit(1);
}
fs.writeFileSync(target, text.endsWith('\n') ? text : text + '\n');

let commit = '';
try {
  commit = execFileSync('git', ['-C', checkout, 'rev-parse', '--short', 'HEAD']).toString().trim();
} catch (e) {
  commit = 'unknown commit';
}
console.log('Copied the palette from plxviz ' + commit + ' to ' + path.relative(process.cwd(), target) + '.');
console.log('Rebuild (npm run build) and run the tests: they check the colour formulas against it.');
