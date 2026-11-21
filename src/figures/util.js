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

/* An element from a selector, a d3 selection or the element itself. */
export function resolve(target) {
  let el = target;
  if (typeof target === 'string') el = document.querySelector(target);
  else if (target && typeof target.node === 'function') el = target.node();
  if (!el) throw new Error('No element matches ' + (typeof target === 'string' ? '"' + target + '"' : String(target)) + '.');
  return el;
}

/* The next animation frame, or a short timeout where there is none (tests). */
export function nextFrame(fn) {
  if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(fn);
  return setTimeout(fn, 0);
}

export function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[ch]);
}
