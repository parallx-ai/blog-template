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
  Colours, after plxviz: the same named colours, roles, ordered ramp and
  heatmap scales, read from palette.json (copied from plxviz by
  bin/sync-palette.js). The scale and ramp formulas are ports of plxviz's
  theme.py; the tests check them against the reference values plxviz writes
  into the palette.
*/

import palette from './palette.json';

export { palette };

const P = palette;
const SPECIAL = ['none', 'transparent', 'white', 'black', 'currentColor', 'currentcolor', 'inherit'];

const key = name => String(name).trim().toLowerCase().replace(/[_\s]+/g, '-');

/* Python's round(): halves go to the even neighbour. */
function roundHalfEven(x) {
  const r = Math.round(x);
  return Math.abs(x % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r;
}

const hex2 = v => roundHalfEven(v).toString(16).toUpperCase().padStart(2, '0');

/*
  A palette name ("gold", "light-blue"), a role ("control", "intervention",
  "second"...), or any CSS colour, which passes through unchanged.
*/
export function color(c, fallback) {
  if (c == null || c === '') c = fallback == null ? 'blue' : fallback;
  c = String(c);
  if (/^(#|rgba?\(|hsla?\(|oklch\(|var\()/i.test(c) || SPECIAL.indexOf(c) >= 0) return c;
  const k = key(c);
  if (P.colors[k]) return P.colors[k];
  const role = P.aliases[k] || k;
  if (P.roles[role]) return P.colors[P.roles[role]];
  throw new Error('Unknown colour "' + c + '": use a CSS colour or one of ' +
    Object.keys(P.colors).concat(Object.keys(P.roles)).join(', ') + '.');
}

/* [r, g, b] from 0 to 255. */
export function rgb(c) {
  let h = color(c);
  if (h === 'white') h = '#FFFFFF';
  if (h === 'black') h = '#000000';
  if (h.charAt(0) !== '#') throw new Error('rgb() needs a hex colour or a palette name, not "' + h + '".');
  h = h.slice(1);
  if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}

/* Mix two colours channel by channel: t = 0 gives a, t = 1 gives b. */
export function mix(a, b, t) {
  const pa = rgb(a);
  const pb = rgb(b);
  return '#' + pa.map((v, i) => hex2(v + (pb[i] - v) * t)).join('');
}

/* A pale version of a colour, for fills under text. */
export function tint(c) {
  const k = key(c);
  return P.tints[k] || mix(color(c), P.surfaces.background, 0.72);
}

const lin = v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);

/* WCAG relative luminance and contrast ratio. */
export function luminance(c) {
  const [r, g, b] = rgb(c).map(v => lin(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b == null ? '#FFFFFF' : b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* Text for a fill: white or ink, whichever reads better (black if neither reaches 4.5:1). */
export function textOn(fill) {
  const ink = P.ink.ink;
  let main = contrast('#FFFFFF', fill) >= contrast(ink, fill) ? '#FFFFFF' : ink;
  if (contrast(main, fill) < 4.5) {
    main = contrast('#FFFFFF', fill) >= contrast('#000000', fill) ? '#FFFFFF' : '#000000';
  }
  return main;
}

/* The colour itself if text in it reaches `ratio` on bg, else the nearest darker shade that does. */
export function readable(c, bg, ratio) {
  const base = color(c);
  const on = bg || P.surfaces.background;
  const need = ratio || 4.5;
  for (let k = 0; k <= 20; k++) {
    const out = mix(base, P.ink.ink, k / 20);
    if (contrast(out, on) >= need) return out;
  }
  return P.ink.ink;
}

/* n colours from light to dark in the accent's hue, for ordered conditions. */
export function ramp(n) {
  const [lo, mid, hi] = P.ordered.map(name => color(name));
  if (n === 1) return [mid];
  const out = [];
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1);
    out.push(t <= 0.5 ? mix(lo, mid, t * 2) : mix(mid, hi, (t - 0.5) * 2));
  }
  return out;
}

/* OKLCH, as in plxviz. */
const OK_LMS = [[0.4122214708, 0.5363325363, 0.0514459929], [0.2119034982, 0.6806995451, 0.1073969566],
  [0.0883024619, 0.2817188376, 0.6299787005]];
const OK_LAB = [[0.2104542553, 0.7936177850, -0.0040720468], [1.9779984951, -2.4285922050, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.8086757660]];
const OK_INV = [[0.3963377774, 0.2158037573], [-0.1055613458, -0.0638541728], [-0.0894841775, -1.2914855480]];
const OK_RGB = [[4.0767416621, -3.3077115913, 0.2309699292], [-1.2684380046, 2.6097574011, -0.3413193965],
  [-0.0041960863, -0.7034186147, 1.7076147010]];
const dot = (row, v) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2];

/* [lightness 0 to 1, chroma, hue in degrees]. */
export function oklch(c) {
  const linear = rgb(c).map(v => lin(v / 255));
  const lms = OK_LMS.map(row => Math.pow(dot(row, linear), 1 / 3));
  const [L, a, b] = OK_LAB.map(row => dot(row, lms));
  const hue = Math.atan2(b, a) * 180 / Math.PI;
  return [L, Math.hypot(a, b), ((hue % 360) + 360) % 360];
}

/* The colour at an OKLCH lightness, chroma and hue, clipped to what a screen shows. */
export function fromOklch(L, C, H) {
  const a = C * Math.cos(H * Math.PI / 180);
  const b = C * Math.sin(H * Math.PI / 180);
  const lms = OK_INV.map(([p, q]) => Math.pow(L + p * a + q * b, 3));
  const linear = OK_RGB.map(row => dot(row, lms));
  const gamma = linear.map(v => v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - 0.055);
  return '#' + gamma.map(v => hex2(255 * Math.min(Math.max(v, 0), 1))).join('');
}

/* A scale's colour t of the way from its light end (0) to its deep end (1). */
export function tone(name, t) {
  const k = key(name) === 'orange' ? 'coral' : key(name);
  let light;
  let deep;
  let chroma;
  if (P.scale.hues[k]) {
    ({ light, deep, chroma } = P.scale.hues[k]);
  } else {
    const [, c, h] = oklch(color(name));
    light = h;
    deep = h;
    chroma = c;
  }
  const [l0, l1] = P.scale.lightness;
  return fromOklch(l0 + (l1 - l0) * t, chroma * Math.pow(t, 0.75), light + (deep - light) * t);
}

/*
  Heatmap scales, as functions of a value. sequential("gold", [lo, hi]) runs
  from a light tint at lo to the deep end at hi. diverging([lo, hi]) meets at
  a light neutral at `center` (0) and deepens toward `low` (coral) below it
  and `high` (blue) above it, as far on both sides.
*/
export function sequential(name, domain) {
  const scaleName = name || 'gold';
  const [lo, hi] = domain || [0, 1];
  const start = P.scale.start;
  const f = v => {
    const t = hi === lo ? 0 : Math.min(Math.max((v - lo) / (hi - lo), 0), 1);
    return tone(scaleName, start + (1 - start) * t);
  };
  f.domain = () => [lo, hi];
  f.middle = (lo + hi) / 2;
  f.kind = 'sequential';
  return f;
}

export function diverging(domain, options) {
  const opts = options || {};
  const center = opts.center == null ? 0 : opts.center;
  const low = opts.low || P.scale.diverging.low;
  const high = opts.high || P.scale.diverging.high;
  const [lo, hi] = domain || [-1, 1];
  const span = Math.max(Math.abs(hi - center), Math.abs(lo - center)) || 1;
  const f = v => tone(v >= center ? high : low, Math.min(Math.abs(v - center) / span, 1));
  f.domain = () => [center - span, center + span];
  f.middle = center;
  f.kind = 'diverging';
  return f;
}

/*
  Colour by role, as plxviz's viz.set_roles: roles({control: "Base",
  intervention: "Steered", ordered: ["1B", "8B", "70B"]}) returns a function
  from a label to its colour. Labels without a role take the muted greys in
  turn, so they recede.
*/
export function roles(spec) {
  const assigned = new Map();
  for (const role of Object.keys(spec || {})) {
    const labels = [].concat(spec[role]).map(String);
    if (role === 'ordered') {
      const colors = ramp(labels.length);
      labels.forEach((label, i) => assigned.set(label, colors[i]));
      continue;
    }
    const name = P.aliases[role] || role;
    if (!P.roles[name]) {
      throw new Error('Unknown role "' + role + '": use one of ' +
        Object.keys(P.roles).concat(Object.keys(P.aliases), ['ordered']).join(', ') + '.');
    }
    for (const label of labels) assigned.set(label, P.colors[P.roles[name]]);
  }
  return mutedAfter(assigned);
}

/* Colours for several series without roles: plxviz's series order, then muted. */
export function series(labels) {
  const assigned = new Map();
  [].concat(labels || []).map(String).forEach((label, i) => {
    if (i < P.series.length) assigned.set(label, P.colors[P.series[i]]);
  });
  return mutedAfter(assigned);
}

function mutedAfter(assigned) {
  const muted = new Map();
  const f = label => {
    const k = String(label);
    if (assigned.has(k)) return assigned.get(k);
    if (!muted.has(k)) muted.set(k, P.colors[P.muted[muted.size % P.muted.length]]);
    return muted.get(k);
  };
  f.labels = () => Array.from(assigned.keys());
  return f;
}

/* The palette as CSS custom properties: --plx-chart-gold, --plx-chart-control, --plx-chart-grid... */
export function chartProperties() {
  const props = new Map();
  for (const name of Object.keys(P.colors)) props.set(name, P.colors[name]);
  for (const name of Object.keys(P.ink)) props.set(name, P.ink[name]);
  for (const role of Object.keys(P.roles)) props.set(role, P.colors[P.roles[role]]);
  for (const name of Object.keys(P.tints)) props.set('tint-' + name, P.tints[name]);
  const lines = [];
  props.forEach((value, name) => lines.push('  --plx-chart-' + name + ': ' + value + ';'));
  return ':root {\n' + lines.join('\n') + '\n}\n';
}
