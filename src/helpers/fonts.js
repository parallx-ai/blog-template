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

// Self-hosted Inter, the text face of www.parallx.ai. The build copies the
// font files to dist/fonts/, next to template.v2.js, and the faces are
// declared relative to wherever the template script is served from, so no
// third-party font service is contacted. If the files are missing, text
// falls back to the system UI font.

const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const LATIN_EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';

export const FONT_DIRECTORY = 'fonts/';

const FACES = [
  { file: 'inter-latin-ext-wght-normal.woff2', style: 'normal', range: LATIN_EXT },
  { file: 'inter-latin-ext-wght-italic.woff2', style: 'italic', range: LATIN_EXT },
  { file: 'inter-latin-wght-normal.woff2', style: 'normal', range: LATIN, preload: true },
  { file: 'inter-latin-wght-italic.woff2', style: 'italic', range: LATIN },
];

// Must run while the template script is executing: document.currentScript is
// only set during that synchronous evaluation.
function findTemplateBase() {
  if (typeof document === 'undefined') return null;
  let script = document.currentScript;
  if (!script || !script.src) {
    script = document.querySelector('script[src*="template.v2.js"]');
  }
  if (!script || !script.src) return null;
  try {
    return new URL('.', script.src).href;
  } catch (_) {
    return null;
  }
}

const TEMPLATE_BASE = findTemplateBase();

export function fontFaceCSS(base) {
  return FACES.map(({ file, style, range }) => `@font-face {
  font-family: "Inter";
  font-style: ${style};
  font-weight: 100 900;
  font-display: swap;
  src: url("${base}${FONT_DIRECTORY}${file}") format("woff2");
  unicode-range: ${range};
}`).join('\n');
}

export function addFonts(dom = document, base = TEMPLATE_BASE) {
  if (!base || !dom.head || dom.getElementById('parallax-fonts')) return;
  for (const face of FACES.filter(face => face.preload)) {
    const preload = dom.createElement('link');
    preload.rel = 'preload';
    preload.as = 'font';
    preload.type = 'font/woff2';
    preload.crossOrigin = 'anonymous';
    preload.href = base + FONT_DIRECTORY + face.file;
    dom.head.appendChild(preload);
  }
  const style = dom.createElement('style');
  style.id = 'parallax-fonts';
  style.textContent = fontFaceCSS(base);
  dom.head.appendChild(style);
}
