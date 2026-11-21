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
  Interaction: one shared tooltip, hover and nearest-point readouts, state
  shared between figures, and controls bound to that state: a slider, a set
  of buttons, and a number readers drag.
*/

import * as d3 from 'd3';
import { resolve, nextFrame } from './util';

/* ---- Tooltip ---- */

let tip = null;

function tipElement() {
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'plx-tooltip';
    tip.setAttribute('role', 'tooltip');
    tip.hidden = true;
    document.body.appendChild(tip);
  }
  return tip;
}

function place(at) {
  const el = tipElement();
  let x;
  let y;
  if (at && typeof at.clientX === 'number') {
    x = at.clientX;
    y = at.clientY;
  } else if (Array.isArray(at)) {
    [x, y] = at;
  } else if (at && at.getBoundingClientRect) {
    const r = at.getBoundingClientRect();
    x = r.left + r.width / 2;
    y = r.bottom;
  } else {
    return;
  }
  const gap = 14;
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  let left = x + gap;
  let top = y + gap;
  if (left + w > window.innerWidth - 8) left = Math.max(8, x - gap - w);
  if (top + h > window.innerHeight - 8) top = Math.max(8, y - gap - h);
  el.style.left = left + 'px';
  el.style.top = top + 'px';
}

/*
  tooltip.show(html, at) shows HTML (a string or a node) next to the pointer
  event, the [x, y] point in the viewport, or the element `at`;
  tooltip.move(at) follows the pointer; tooltip.hide() hides it.
*/
export const tooltip = {
  show(content, at) {
    const el = tipElement();
    if (content && content.nodeType) {
      el.textContent = '';
      el.appendChild(content);
    } else {
      el.innerHTML = content == null ? '' : String(content);
    }
    el.hidden = false;
    place(at);
  },
  move(at) {
    if (tip && !tip.hidden) place(at);
  },
  hide() {
    if (tip) tip.hidden = true;
  },
};

/*
  hover(selection, html, {on, off}) shows html(d, i) in the tooltip while the
  pointer is over an element of the selection, or while it has focus, and
  calls on(d, event) and off(d, event) around it.
*/
export function hover(selection, html, options) {
  const opts = options || {};
  const content = typeof html === 'function' ? html : () => html;
  const show = function(event, d) {
    const nodes = selection.nodes();
    tooltip.show(content.call(this, d, nodes.indexOf(this)), event.type === 'focus' ? this : event);
    if (opts.on) opts.on.call(this, d, event);
  };
  const hide = function(event, d) {
    tooltip.hide();
    if (opts.off) opts.off.call(this, d, event);
  };
  return selection
    .on('pointerenter.plx', show)
    .on('pointermove.plx', event => tooltip.move(event))
    .on('pointerleave.plx', hide)
    .on('focus.plx', show)
    .on('blur.plx', hide);
}

/*
  nearest(c, points, {x, y, radius, html, on, off}) follows the pointer over
  a chart and finds the closest point (x and y give its position in pixels,
  through the chart's scales by default). It shows html(d) in the tooltip,
  marks the point and calls on(d, event); off() when the pointer leaves or is
  more than `radius` (40) pixels from any point. Returns the overlay.
*/
export function nearest(c, points, options) {
  const opts = options || {};
  const px = opts.x || (d => c.x(d[0]));
  const py = opts.y || (d => c.y(d[1]));
  const radius = opts.radius == null ? 40 : opts.radius;
  const delaunay = d3.Delaunay.from(points, px, py);
  const marker = c.g.append('circle').attr('class', 'plx-nearest-marker').attr('r', 4.5).style('display', 'none');
  let current = null;

  const leave = event => {
    if (current === null) return;
    marker.style('display', 'none');
    tooltip.hide();
    const d = current;
    current = null;
    if (opts.off) opts.off(d, event);
  };

  const overlay = c.g.append('rect')
    .attr('class', 'plx-overlay')
    .attr('width', c.width)
    .attr('height', c.height)
    .on('pointermove.plx', event => {
      const [mx, my] = d3.pointer(event, c.g.node());
      const i = delaunay.find(mx, my);
      const d = points[i];
      if (d === undefined || Math.hypot(px(d) - mx, py(d) - my) > radius) return leave(event);
      marker.style('display', null).attr('cx', px(d)).attr('cy', py(d));
      if (opts.markerColor) marker.attr('stroke', typeof opts.markerColor === 'function' ? opts.markerColor(d) : opts.markerColor);
      if (opts.html) tooltip.show(opts.html(d), event);
      if (d !== current) {
        current = d;
        if (opts.on) opts.on(d, event);
      }
    })
    .on('pointerleave.plx', leave);
  return overlay;
}

/* ---- State shared between figures ---- */

/*
  state({layer: 16}) holds values that several figures read. s.get() returns
  them all, s.get('layer') one of them; s.set({layer: 20}) changes them; and
  s.on(fn) calls fn(values) now and after every change (changes made together
  are reported once). s.on returns a function that stops the calls.
*/
export function state(initial) {
  const values = Object.assign({}, initial);
  const listeners = new Set();
  let queued = false;

  const flush = () => {
    queued = false;
    for (const fn of Array.from(listeners)) fn(values);
  };

  return {
    get(name) {
      return name == null ? values : values[name];
    },
    set(changes) {
      let changed = false;
      for (const k of Object.keys(changes || {})) {
        if (!Object.is(values[k], changes[k])) {
          values[k] = changes[k];
          changed = true;
        }
      }
      if (changed && !queued) {
        queued = true;
        nextFrame(flush);
      }
      return this;
    },
    on(fn, options) {
      listeners.add(fn);
      if (!options || options.now !== false) fn(values);
      return () => listeners.delete(fn);
    },
  };
}

/* ---- Controls ---- */

const asFormat = f => typeof f === 'string' ? d3.format(f) : (f || (v => v));

/*
  slider(target, {state, key, min, max, step, label, format}) appends a
  labelled range input bound to state[key]. Returns {node, remove()}.
*/
export function slider(target, options) {
  const opts = options || {};
  const s = opts.state;
  const name = opts.key;
  const fmt = asFormat(opts.format);
  const wrap = d3.select(resolve(target)).append('label').attr('class', 'plx-control plx-slider');
  if (opts.label) wrap.append('span').attr('class', 'plx-control__label').text(opts.label);
  const input = wrap.append('input')
    .attr('type', 'range')
    .attr('min', opts.min == null ? 0 : opts.min)
    .attr('max', opts.max == null ? 1 : opts.max)
    .attr('step', opts.step == null ? 1 : opts.step);
  const out = wrap.append('output').attr('class', 'plx-control__value');
  input.on('input', () => s.set({ [name]: +input.property('value') }));
  const off = s.on(values => {
    input.property('value', values[name]);
    out.text(fmt(values[name]));
    const min = +input.attr('min');
    const max = +input.attr('max');
    input.style('--plx-fill', ((values[name] - min) / (max - min || 1) * 100) + '%');
  });
  return { node: wrap.node(), remove() { off(); wrap.remove(); } };
}

/*
  toggle(target, {state, key, options, label}) appends a row of buttons, one
  per option ({value, label} or a plain value), bound to state[key]. Returns
  {node, remove()}.
*/
export function toggle(target, options) {
  const opts = options || {};
  const s = opts.state;
  const name = opts.key;
  const items = (opts.options || []).map(o => (o !== null && typeof o === 'object') ? o : { value: o, label: String(o) });
  const wrap = d3.select(resolve(target)).append('div').attr('class', 'plx-control plx-toggle')
    .attr('role', 'group');
  if (opts.label) {
    const id = 'plx-toggle-' + Math.random().toString(36).slice(2, 8);
    wrap.append('span').attr('class', 'plx-control__label').attr('id', id).text(opts.label);
    wrap.attr('aria-labelledby', id);
  }
  const buttons = wrap.append('span').attr('class', 'plx-toggle__buttons').selectAll('button').data(items).enter()
    .append('button').attr('type', 'button').text(d => d.label)
    .on('click', (event, d) => s.set({ [name]: d.value }));
  const off = s.on(values => buttons.attr('aria-pressed', d => String(Object.is(d.value, values[name]))));
  return { node: wrap.node(), remove() { off(); wrap.remove(); } };
}

/*
  dragNumber(target, {state, key, min, max, step, format, pixels, label})
  turns an element, usually an empty <span> in a sentence, into a number the
  reader drags left or right (one step every `pixels`, 6, pixels) or changes
  with the arrow keys (Page Up and Page Down for ten steps, Home and End for
  the ends), bound to state[key]. It is announced as a slider; `label` names
  it for screen readers. Returns {node, remove()}.
*/
export function dragNumber(target, options) {
  const opts = options || {};
  const s = opts.state;
  const name = opts.key;
  const min = opts.min == null ? -Infinity : opts.min;
  const max = opts.max == null ? Infinity : opts.max;
  const step = opts.step || 1;
  const pixels = opts.pixels || 6;
  const decimals = (String(step).split('.')[1] || '').length;
  const fmt = asFormat(opts.format);
  const el = resolve(target);
  const root = el.ownerDocument.documentElement;
  const clamp = v => Math.min(max, Math.max(min, +(Math.round(v / step) * step).toFixed(decimals)));

  el.classList.add('plx-drag-number');
  el.setAttribute('role', 'slider');
  el.setAttribute('tabindex', '0');
  el.setAttribute('title', 'Drag, or use the arrow keys');
  if (opts.label) el.setAttribute('aria-label', opts.label);
  if (isFinite(min)) el.setAttribute('aria-valuemin', String(min));
  if (isFinite(max)) el.setAttribute('aria-valuemax', String(max));

  let start = null;
  // The browser focuses the number itself, as a pointer focus, so no focus ring
  // shows after a drag; the styles keep the drag from selecting text.
  const down = event => {
    if (event.button !== 0) return;
    if (el.setPointerCapture) el.setPointerCapture(event.pointerId);
    start = { x: event.clientX, value: s.get(name) };
    el.classList.add('is-dragging');
    root.classList.add('plx-dragging');
  };
  const move = event => {
    if (!start) return;
    s.set({ [name]: clamp(start.value + Math.round((event.clientX - start.x) / pixels) * step) });
  };
  const up = () => {
    if (!start) return;
    start = null;
    el.classList.remove('is-dragging');
    root.classList.remove('plx-dragging');
  };
  const key = event => {
    const v = s.get(name);
    const keys = {
      ArrowRight: v + step, ArrowUp: v + step, ArrowLeft: v - step, ArrowDown: v - step,
      PageUp: v + 10 * step, PageDown: v - 10 * step,
      Home: isFinite(min) ? min : null, End: isFinite(max) ? max : null,
    };
    if (keys[event.key] == null) return;
    event.preventDefault();
    s.set({ [name]: clamp(keys[event.key]) });
  };

  const listeners = [['pointerdown', down], ['pointermove', move], ['pointerup', up], ['pointercancel', up],
    ['lostpointercapture', up], ['keydown', key]];
  for (const [type, fn] of listeners) el.addEventListener(type, fn);
  const off = s.on(values => {
    el.textContent = fmt(values[name]);
    el.setAttribute('aria-valuenow', String(values[name]));
    el.setAttribute('aria-valuetext', el.textContent);
  });
  return {
    node: el,
    remove() {
      off();
      up();
      for (const [type, fn] of listeners) el.removeEventListener(type, fn);
    },
  };
}
