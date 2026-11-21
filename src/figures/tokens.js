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
  Model text, token by token, as plxviz draws it: each token's background
  shaded by a value (a probe score, an attribution, a steering effect), the
  spaces kept as gaps, line breaks shown as a return arrow, and lines that
  wrap between tokens, never inside one.
*/

import * as d3 from 'd3';
import { diverging, sequential, textOn } from './colors';
import { colorbar } from './chart';
import { hover } from './interact';
import { resolve, escapeHTML } from './util';

/*
  token(" the\n") gives a token's visible form, for labels and lists:
  spaces as middle dots, tabs as arrows and line breaks as return arrows.
*/
export function token(text) {
  return String(text).replace(/\r\n/g, '\n').replace(/ /g, '\u00b7').replace(/\t/g, '\u2192').replace(/\n/g, '\u21b5');
}

function pairs(items) {
  return items.map(item => {
    if (Array.isArray(item)) return { token: String(item[0]), value: item[1] == null ? null : +item[1] };
    if (item && typeof item === 'object') return Object.assign({}, item, { token: String(item.token), value: item.value == null ? null : +item.value });
    return { token: String(item), value: null };
  });
}

function rowsOf(items) {
  if (Array.isArray(items)) return [{ label: null, tokens: pairs(items) }];
  return Object.keys(items).map(label => ({ label, tokens: pairs(items[label]) }));
}

function scaleFor(rows, opts) {
  if (typeof opts.scale === 'function') return opts.scale;
  const values = [];
  rows.forEach(r => r.tokens.forEach(t => { if (t.value != null && isFinite(t.value)) values.push(t.value); }));
  const name = opts.scale || 'diverging';
  if (name === 'diverging') {
    const center = opts.center == null ? 0 : opts.center;
    let domain = opts.domain;
    if (!domain) {
      const span = d3.max(values, v => Math.abs(v - center)) || 1;
      domain = [center - span, center + span];
    }
    return diverging(domain, { center, low: opts.low, high: opts.high });
  }
  let domain = opts.domain;
  if (!domain) {
    const [lo, hi] = values.length ? d3.extent(values) : [0, 1];
    domain = [lo, hi > lo ? hi : lo + 1];
  }
  return sequential(name, domain);
}

/*
  tokens(target, items, options) appends shaded text to target. items:
  [[token, value], ...] or [{token, value}, ...], with tokens as the
  tokenizer gives them (" the" keeps its space; a value of null leaves a
  token unshaded), or {row label: items} for several rows, such as layers.

  options: scale ("diverging", the default, coral below `center` and blue
  above it; or a sequential scale: "gold", "blue", "coral", "sage", "green";
  or your own function), domain [low, high] (by default the values' range),
  center (0), low and high (the diverging colours), label (written by the
  colour bar), colorbar (false to leave it out), format (the values'
  number format, ".2f"), title(d) (the tooltip, as HTML), focusable (true to
  let the keyboard reach each token and its tooltip).

  Returns {node, tokens, scale, update(values)}: tokens is a d3 selection of
  the token spans; update recolours them from new values, in the same order,
  on the same scale.
*/
export function tokens(target, items, options) {
  const opts = options || {};
  const rows = rowsOf(items);
  let scale = scaleFor(rows, opts);
  const fmt = d3.format(opts.format || '.2f');
  const title = opts.title || (d => '<b class="plx-token-text">' + escapeHTML(token(d.token)) + '</b> ' +
    (d.value == null ? '' : '<span class="plx-token-value">' + fmt(d.value) + '</span>'));

  const root = d3.select(resolve(target)).append('div').attr('class', 'plx-tokens');
  if (opts.colorbar !== false) {
    colorbar(root.append('div').attr('class', 'plx-tokens__key'), scale, { label: opts.label, format: opts.format || '.2~f' });
  }

  const all = [];
  for (const row of rows) {
    const line = root.append('div').attr('class', 'plx-tokens__row');
    if (row.label != null) line.append('div').attr('class', 'plx-tokens__label').text(row.label);
    const text = line.append('div').attr('class', 'plx-tokens__text').node();
    for (const d of row.tokens) {
      const pieces = d.token.replace(/\r\n/g, '\n').replace(/\t/g, '    ').split('\n');
      const blank = pieces.every(p => !p.trim());
      if (blank) {
        if (pieces.length === 1) {
          // Spaces only: a box as wide as they are, so their value shows.
          if (d.value == null) {
            text.appendChild(document.createTextNode(d.token));
          } else {
            const span = box(text, d, '\u00a0'.repeat(Math.max(d.token.length, 1)), opts.focusable);
            span.classList.add('plx-token--space');
            all.push(span);
          }
        } else {
          if (d.value != null) {
            const span = box(text, d, '\u21b5', opts.focusable);
            span.classList.add('plx-token--break');
            all.push(span);
          }
          for (let k = 1; k < pieces.length; k++) text.appendChild(document.createElement('br'));
          if (pieces[pieces.length - 1]) text.appendChild(document.createTextNode(pieces[pieces.length - 1]));
        }
        continue;
      }
      pieces.forEach((p, k) => {
        if (k) text.appendChild(document.createElement('br'));
        const core = p.replace(/^ +| +$/g, '');
        if (!core) return;
        const lead = p.length - p.replace(/^ +/, '').length;
        const trail = p.length - p.replace(/ +$/, '').length;
        if (lead) text.appendChild(document.createTextNode(' '.repeat(lead)));
        all.push(box(text, d, core, opts.focusable));
        if (trail) text.appendChild(document.createTextNode(' '.repeat(trail)));
      });
    }
  }

  const spans = d3.selectAll(all);
  const paint = () => spans
    .classed('plx-token--plain', d => d.value == null || !isFinite(d.value))
    .style('background-color', d => d.value == null || !isFinite(d.value) ? null : scale(d.value))
    .style('color', d => d.value == null || !isFinite(d.value) ? null : textOn(scale(d.value)));
  paint();
  hover(spans, d => title(d));

  return {
    node: root.node(),
    tokens: spans,
    scale,
    update(values) {
      let i = 0;
      const flat = [];
      rows.forEach(r => r.tokens.forEach(t => flat.push(t)));
      flat.forEach(t => { t.value = values[i] == null ? null : +values[i]; i += 1; });
      paint();
    },
    rescale(next) {
      scale = typeof next === 'function' ? next : scaleFor(rows, Object.assign({}, opts, next));
      paint();
      return scale;
    },
  };
}

function box(parent, d, text, focusable) {
  const span = document.createElement('span');
  span.className = 'plx-token';
  span.textContent = text;
  if (focusable) span.tabIndex = 0;
  span.__data__ = d;
  parent.appendChild(span);
  return span;
}
