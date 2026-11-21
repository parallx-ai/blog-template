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
  A few conveniences on d3 selections, in the spirit of d3-jetpack:

    sel.append('div.note#first')   tag, classes and id in one string
    sel.at({strokeWidth: 2})       several attributes; camelCase becomes kebab-case
    sel.st({fontSize: 12})         several styles; numbers get px where CSS needs a unit
    sel.translate([x, y])          transform="translate(x,y)"; also a function of the datum
    sel.appendMany('circle', data) append one element per datum

  `at`, `st` and `translate` also work on transitions.
*/

const UNITLESS = new Set(['opacity', 'fill-opacity', 'stroke-opacity', 'stop-opacity', 'z-index', 'font-weight',
  'line-height', 'flex', 'flex-grow', 'flex-shrink', 'order', 'zoom', 'stroke-miterlimit']);

const kebab = name => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

function parseName(name) {
  if (typeof name !== 'string' || !/[.#]/.test(name)) return null;
  const parts = name.split(/([.#])/);
  const out = { tag: parts.shift() || 'div', classes: [], id: null };
  while (parts.length) {
    const sign = parts.shift();
    const value = parts.shift();
    if (!value) continue;
    if (sign === '.') out.classes.push(value);
    else out.id = value;
  }
  return out;
}

function decorate(selection, parsed) {
  if (parsed.classes.length) selection.attr('class', parsed.classes.join(' '));
  if (parsed.id) selection.attr('id', parsed.id);
  return selection;
}

function setMany(method, transform) {
  return function(name, value) {
    if (typeof name === 'object' && name !== null) {
      for (const k of Object.keys(name)) {
        const prop = kebab(k);
        this[method](prop, transform(prop, name[k]));
      }
      return this;
    }
    if (arguments.length < 2) return this[method](kebab(name));
    const prop = kebab(name);
    return this[method](prop, transform(prop, value));
  };
}

const asIs = (prop, value) => value;

function withUnit(prop, value) {
  const unit = v => typeof v === 'number' && !UNITLESS.has(prop) ? v + 'px' : v;
  return typeof value === 'function' ? function(...args) { return unit(value.apply(this, args)); } : unit(value);
}

function translate(xy, dim) {
  const fmt = p => typeof p === 'number'
    ? (dim === 1 ? 'translate(0,' + p + ')' : 'translate(' + p + ',0)')
    : 'translate(' + p[0] + ',' + p[1] + ')';
  return this.attr('transform', typeof xy === 'function'
    ? function(...args) { return fmt(xy.apply(this, args)); }
    : fmt(xy));
}

export function installJetpack(d3) {
  const proto = d3.selection.prototype;
  if (proto.__plxJetpack) return;
  proto.__plxJetpack = true;

  const append = proto.append;
  const insert = proto.insert;
  proto.append = function(name) {
    const parsed = parseName(name);
    return parsed ? decorate(append.call(this, parsed.tag), parsed) : append.apply(this, arguments);
  };
  proto.insert = function(name, before) {
    const parsed = parseName(name);
    return parsed ? decorate(insert.call(this, parsed.tag, before), parsed) : insert.apply(this, arguments);
  };
  proto.appendMany = function(name, data) {
    const parsed = parseName(name);
    const sel = this.selectAll(null).data(data).enter().append(parsed ? parsed.tag : name);
    return parsed ? decorate(sel, parsed) : sel;
  };

  for (const target of [proto, d3.transition.prototype]) {
    target.at = setMany('attr', asIs);
    target.st = setMany('style', withUnit);
    target.translate = translate;
  }
}
