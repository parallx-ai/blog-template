// Copyright 2018 The Distill Template Authors
// Modifications copyright 2026 Parallax: the contents are now the reading
// menu of parallx.ai, numbered, shown in the margin and folded into a
// floating button.
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
  <d-toc> marks where the contents start. On wide screens they sit in the
  left margin beside the opening of the article; once they have scrolled
  away, or when a wide figure leaves no room for them, they fold into a
  floating button that opens the same list as a panel. The markup is built
  by renderTOC (also used when prerendering); enhanceTOC adds the button.
*/

const ICON_OPEN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3v18M9 8h6v13"/><circle cx="9" cy="3" r="1.25"/><circle cx="15" cy="12" r="1.25"/><circle cx="15" cy="18" r="1.25"/></svg>';
const ICON_CLOSE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
const ICON_UP = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6"/></svg>';

function buildList(dom, sections) {
  const root = dom.createElement('ol');
  let chapter = null;
  for (const section of sections) {
    const item = dom.createElement('li');
    item.setAttribute('data-depth', section.level === 2 ? '1' : '2');
    const link = dom.createElement('a');
    link.setAttribute('href', '#' + section.id);
    const num = dom.createElement('span');
    num.className = 'plx-toc__num';
    num.textContent = section.number;
    const text = dom.createElement('span');
    text.className = 'plx-toc__text';
    text.textContent = section.title;
    link.appendChild(num);
    link.appendChild(text);
    item.appendChild(link);

    if (section.level === 2 || !chapter) {
      root.appendChild(item);
      if (section.level === 2) chapter = item;
    } else {
      let branch = chapter.lastElementChild;
      if (!branch || branch.tagName !== 'OL') {
        branch = dom.createElement('ol');
        chapter.appendChild(branch);
      }
      branch.appendChild(item);
    }
  }
  // A branch followed by another chapter rejoins the main track; the last
  // one ends in its own terminal, as on the website.
  for (const branch of Array.from(root.querySelectorAll('ol'))) {
    if (branch.parentElement && branch.parentElement.nextElementSibling) {
      branch.classList.add('plx-toc__branch--merges');
    }
  }
  return root;
}

export function renderTOC(dom, element, sections) {
  while (element.firstChild) element.removeChild(element.firstChild);
  element.setAttribute('prerendered', 'true');
  if (sections.length < 2) {
    element.setAttribute('hidden', '');
    return;
  }
  element.removeAttribute('hidden');
  const nav = dom.createElement('nav');
  nav.className = 'plx-toc';
  nav.setAttribute('aria-label', 'Contents');
  nav.appendChild(buildList(dom, sections));
  element.appendChild(nav);
}

function targetId(link) {
  const hash = (link.getAttribute('href') || '').replace(/^#/, '');
  try {
    return decodeURIComponent(hash);
  } catch (e) {
    return hash;
  }
}

let enhanced = false;

/* Browser only: the floating button, its panel and the current section. */
export function enhanceTOC(doc) {
  const toc = doc.querySelector('d-toc');
  const sidebar = toc ? toc.querySelector('.plx-toc') : null;
  if (enhanced || !toc || !sidebar || toc.hasAttribute('hidden')) return;
  enhanced = true;

  const win = doc.defaultView;
  const article = doc.querySelector('d-article');
  const header = doc.querySelector('distill-header');

  const panel = sidebar.cloneNode(true);
  panel.id = 'plx-toc-panel';
  panel.classList.add('plx-toc--panel');
  const actions = doc.createElement('div');
  actions.className = 'plx-toc__actions';
  actions.innerHTML = '<button type="button" class="plx-toc__top">' + ICON_UP + 'Back to top</button>';
  panel.appendChild(actions);

  const toggle = doc.createElement('button');
  toggle.type = 'button';
  toggle.className = 'plx-toc-toggle';
  toggle.title = 'Contents';
  toggle.setAttribute('aria-controls', panel.id);
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open contents');
  toggle.innerHTML =
    '<span class="plx-toc-toggle__open">' + ICON_OPEN + '</span>' +
    '<span class="plx-toc-toggle__close">' + ICON_CLOSE + '</span>';

  doc.body.appendChild(panel);
  doc.body.appendChild(toggle);

  const links = Array.from(doc.querySelectorAll('.plx-toc a[href^="#"]'));
  const headings = [];
  for (const link of links) {
    const heading = doc.getElementById(targetId(link));
    if (heading && headings.indexOf(heading) < 0) headings.push(heading);
  }

  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
  const setOpen = open => {
    panel.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close contents' : 'Open contents');
  };
  const headerBottom = () => header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
  const sidebarShown = () =>
    win.getComputedStyle(toc).display !== 'none' && !toc.classList.contains('is-folded');

  /* Fold the margin contents when a wide element would run into them. */
  const checkRoom = () => {
    toc.classList.remove('is-folded');
    if (win.getComputedStyle(toc).display === 'none') return;
    const box = sidebar.getBoundingClientRect();
    if (!box.height) return;
    for (let el = toc.nextElementSibling; el; el = el.nextElementSibling) {
      const r = el.getBoundingClientRect();
      if (r.top >= box.bottom) break;
      if (r.width && r.height && r.bottom > box.top && r.left < box.right - 1) {
        toc.classList.add('is-folded');
        break;
      }
    }
  };

  let frame = 0;
  const update = () => {
    frame = 0;
    const top = headerBottom();

    let current = headings[0];
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top <= top + 36) current = heading;
      else break;
    }
    for (const link of links) {
      if (current && targetId(link) === current.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }

    // The button appears once the margin contents (or, when they are not
    // shown, the start of the article) have scrolled under the header.
    const edge = sidebarShown()
      ? sidebar.getBoundingClientRect().bottom
      : (article ? article.getBoundingClientRect().top : 0);
    const folded = edge < top + 24;
    toggle.classList.toggle('is-visible', folded);
    if (!folded && isOpen()) setOpen(false);
  };
  const schedule = () => {
    if (!frame) frame = win.requestAnimationFrame(update);
  };
  const relayout = () => {
    checkRoom();
    schedule();
  };

  toggle.addEventListener('click', () => {
    const open = !isOpen();
    setOpen(open);
    if (open) {
      const link = panel.querySelector('a[aria-current]') || panel.querySelector('a');
      if (link) link.focus();
    }
  });

  const onNavigate = event => {
    const link = event.target.closest ? event.target.closest('a[href^="#"]') : null;
    if (!link) return;
    setOpen(false);
    const heading = doc.getElementById(targetId(link));
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  };
  sidebar.addEventListener('click', onNavigate);
  panel.addEventListener('click', onNavigate);

  panel.querySelector('.plx-toc__top').addEventListener('click', () => {
    const reduceMotion = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setOpen(false);
    win.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    const title = doc.querySelector('d-title h1');
    if (title) {
      title.tabIndex = -1;
      title.focus({ preventScroll: true });
    }
  });

  doc.addEventListener('click', event => {
    if (!isOpen()) return;
    if (!panel.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
  });
  doc.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !isOpen()) return;
    setOpen(false);
    toggle.focus();
  });

  // Printed contents should not mark the section being read.
  win.addEventListener('beforeprint', () => {
    for (const link of links) link.removeAttribute('aria-current');
  });
  win.addEventListener('afterprint', schedule);

  win.addEventListener('scroll', schedule, { passive: true });
  win.addEventListener('resize', relayout, { passive: true });
  win.addEventListener('load', relayout);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(relayout);
  if (win.ResizeObserver && article) new win.ResizeObserver(relayout).observe(article);
  relayout();
}

export class TOC extends HTMLElement {
  static get is() { return 'd-toc'; }
}
