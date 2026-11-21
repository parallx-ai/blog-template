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
  Figures on the page: drawing a figure when it comes into view and again
  when its width changes, scaling a fixed-size figure to its column, and
  colouring words of a caption to serve as its legend.
*/

import { resolve, nextFrame } from './util';
import { color as named, readable, textOn, palette } from './colors';

// Lazy work still waiting, run all at once if the page is printed first.
const waiting = new Set();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeprint', () => {
    for (const run of Array.from(waiting)) run();
  });
}

/*
  lazy(target, fn, {margin}) calls fn(element) once, when the element comes
  within `margin` ("300px") of the viewport, or when the page is printed.
*/
export function lazy(target, fn, options) {
  const el = resolve(target);
  const margin = (options && options.margin) || '300px';
  if (typeof IntersectionObserver === 'undefined') {
    fn(el);
    return;
  }
  let observer = null;
  const run = () => {
    waiting.delete(run);
    if (observer) observer.disconnect();
    fn(el);
  };
  observer = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) run();
  }, { rootMargin: margin });
  waiting.add(run);
  observer.observe(el);
}

/*
  figure(mount, draw, {lazy}) draws a figure into mount when it comes into
  view (or at once, with lazy: false), and again whenever the mount's width
  changes. draw(mount, context) can be async; the mount is emptied before
  each drawing. context.width is the mount's width, and context.watch(state,
  fn) subscribes to a shared state for as long as this drawing lasts. A
  function returned by draw runs before the next drawing. Errors are logged
  and shown in place of the figure. Returns {mount, redraw()}.
*/
export function figure(target, draw, options) {
  const opts = options || {};
  const mount = resolve(target);
  let width = -1;
  let cleanups = [];
  let started = false;
  let timer = 0;

  const cleanup = () => {
    for (const fn of cleanups.splice(0)) {
      try {
        fn();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const run = async () => {
    cleanup();
    width = mount.clientWidth;
    mount.textContent = '';
    mount.classList.add('plx-figure');
    const context = {
      width,
      watch(s, fn, watchOptions) {
        cleanups.push(s.on(fn, watchOptions));
      },
      onCleanup(fn) {
        cleanups.push(fn);
      },
    };
    try {
      const result = await draw(mount, context);
      if (typeof result === 'function') cleanups.push(result);
    } catch (error) {
      console.error(error);
      const note = document.createElement('p');
      note.className = 'plx-error';
      note.textContent = 'This figure could not be drawn: ' + (error && error.message ? error.message : error);
      mount.textContent = '';
      mount.appendChild(note);
    }
  };

  const start = () => {
    if (started) return;
    started = true;
    run();
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => {
        if (Math.abs(mount.clientWidth - width) < 1) return;
        clearTimeout(timer);
        timer = setTimeout(run, 120);
      }).observe(mount);
    }
  };

  if (opts.lazy === false) start();
  else lazy(mount, start, opts);

  return { mount, redraw: () => (started ? run() : start()) };
}

/*
  fit(target, {width}) scales a fixed-size figure down to its column: the
  element's first child is laid out `width` pixels wide (by default its own
  width) and shrunk to fit, never enlarged. Use it for figures designed at
  one size, such as dense grids of panels.
*/
export function fit(target, options) {
  const mount = resolve(target);
  const inner = mount.firstElementChild;
  if (!inner) return null;
  const design = (options && options.width) || inner.scrollWidth;
  inner.style.width = design + 'px';
  inner.style.transformOrigin = '0 0';
  mount.classList.add('plx-fit');

  const update = () => {
    const scale = Math.min(1, mount.clientWidth / design);
    inner.style.transform = scale < 1 ? 'scale(' + scale + ')' : '';
    mount.style.height = scale < 1 ? inner.offsetHeight * scale + 'px' : '';
  };
  update();
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => nextFrame(update)).observe(mount);
  return { update };
}

/*
  captionKey(figure, {probe: "gold", "shuffled labels": {bg: "control"}}) colours
  each word or phrase where it first appears in the figure's caption, so the
  caption names the colours of the chart. Coloured text is darkened where it
  would be hard to read on the page; for light colours such as the control's
  grey, pass {bg: "gray"} to set the phrase on a chip of that colour instead.
  Phrases not found are reported in the console.
*/
export function captionKey(target, keys, options) {
  const el = resolve(target);
  const caption = el.tagName === 'FIGCAPTION' ? el : el.querySelector('figcaption');
  if (!caption) return;
  const all = options && options.all;

  for (const phrase of Object.keys(keys)) {
    const value = keys[phrase];
    const style = typeof value === 'object' && value !== null ? value : { color: value };
    const pattern = new RegExp('(^|[^\\w-])(' + phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?![\\w-])', all ? 'gi' : 'i');
    const walker = document.createTreeWalker(caption, NodeFilter.SHOW_TEXT, {
      acceptNode: node => node.parentElement.closest('.fig-num, .plx-key') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    let found = false;
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (found && !all) break;
      const match = pattern.exec(node.nodeValue);
      if (!match) continue;
      found = true;
      const start = match.index + match[1].length;
      const word = node.splitText(start);
      word.splitText(match[2].length);
      const span = document.createElement('span');
      span.className = 'plx-key';
      if (style.bg) {
        const fill = named(style.bg);
        span.classList.add('plx-key--fill');
        span.style.backgroundColor = fill;
        span.style.color = style.color ? named(style.color) : textOn(fill);
      } else if (style.color) {
        // Text in the colour, darkened where needed to stay readable on the page.
        span.style.color = readable(style.color, palette.surfaces.card);
      }
      word.parentNode.replaceChild(span, word);
      span.appendChild(word);
      pattern.lastIndex = 0;
    }
    if (!found) console.warn('captionKey: "' + phrase + '" is not in the caption.');
  }
}
