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
  Section numbers, figure numbers, cross-references and section cards.

  These steps run twice: as a transform when an article is prerendered, and
  in the browser once the page has loaded. Both runs must give the same
  result, so every step can be repeated safely. The code avoids closest(),
  :scope and :has(), which the jsdom used for prerendering lacks.
*/

const HEADING = /^H[234]$/;
const MEDIA = /^(IMG|SVG|PICTURE|VIDEO|CANVAS)$/;

function childWith(parent, test) {
  const children = parent.children;
  for (let i = 0; i < children.length; i++) {
    if (test(children[i])) return children[i];
  }
  return null;
}

function hasAncestor(element, test, stop) {
  for (let node = element.parentElement; node && node !== stop; node = node.parentElement) {
    if (test(node)) return true;
  }
  return false;
}

function isA(tagName, className) {
  return el => el.tagName === tagName && (!className || el.classList.contains(className));
}

export function slugify(text) {
  const slug = String(text)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'section';
}

/* A heading's own text, without the section number added below. */
export function headingTitle(heading) {
  let text = '';
  for (const node of Array.from(heading.childNodes)) {
    if (node.nodeType === 1 && node.classList.contains('secnum')) continue;
    text += node.textContent;
  }
  return text.replace(/\s+/g, ' ').trim();
}

/* The appendix starts at the first h2 marked with an `appendix` attribute
   (or with the id "appendix"); from there on sections are lettered. */
export function isAppendixStart(heading) {
  return heading.tagName === 'H2' &&
    (heading.hasAttribute('appendix') || heading.id === 'appendix');
}

function setSectionNumber(dom, heading, number) {
  let mark = heading.firstElementChild;
  if (!(mark && mark.tagName === 'A' && mark.classList.contains('secnum'))) {
    mark = null;
  }
  if (!number) {
    if (mark) heading.removeChild(mark);
    heading.removeAttribute('data-secnum');
    return;
  }
  if (!mark) {
    mark = dom.createElement('a');
    mark.className = 'secnum';
    heading.insertBefore(mark, heading.firstChild);
  }
  mark.setAttribute('href', '#' + heading.id);
  mark.textContent = number;
  heading.setAttribute('data-secnum', number);
}

/*
  Numbers the h2, h3 and h4 headings of d-article: 1, 1.1, 1.1.1, and A,
  A.1, A.1.1 from the start of the appendix. Headings with a `no-toc`
  attribute stay unnumbered. Headings without an id get one from their text.
  Returns the h2 and h3 sections, for the table of contents.
*/
export function numberSections(dom) {
  const article = dom.querySelector('d-article');
  if (!article) return [];

  const usedIds = new Set();
  for (const el of Array.from(dom.querySelectorAll('[id]'))) usedIds.add(el.id);

  const sections = [];
  let inAppendix = false;
  let chapters = 0;
  let letters = 0;
  let top = null;
  let sub = null;
  let h3 = 0;
  let h4 = 0;

  for (const heading of Array.from(article.children)) {
    if (!HEADING.test(heading.tagName)) continue;

    const title = headingTitle(heading);
    if (!heading.id) {
      const base = slugify(title);
      let id = base;
      for (let n = 2; usedIds.has(id); n++) id = base + '-' + n;
      heading.id = id;
      usedIds.add(id);
    }

    const level = Number(heading.tagName.charAt(1));
    const skip = heading.hasAttribute('no-toc');
    let number = null;

    if (level === 2) {
      if (isAppendixStart(heading)) inAppendix = true;
      h3 = 0;
      sub = null;
      if (skip) {
        top = null;
      } else {
        top = inAppendix ? String.fromCharCode(65 + letters++) : String(++chapters);
        number = top;
      }
    } else if (level === 3) {
      h4 = 0;
      sub = null;
      if (top && !skip) {
        h3 += 1;
        sub = top + '.' + h3;
        number = sub;
      }
    } else if (sub && !skip) {
      h4 += 1;
      number = sub + '.' + h4;
    }

    setSectionNumber(dom, heading, number);
    if (number && level < 4) {
      sections.push({ id: heading.id, number, title, level, appendix: inAppendix });
    }
  }
  return sections;
}

/*
  Numbers every captioned figure in d-article (nested figures excepted) and
  starts its caption with "Figure N:".
*/
export function numberFigures(dom) {
  const article = dom.querySelector('d-article');
  if (!article) return 0;
  let count = 0;
  for (const figure of Array.from(article.querySelectorAll('figure'))) {
    if (hasAncestor(figure, isA('FIGURE'), article)) continue;
    const caption = childWith(figure, isA('FIGCAPTION'));
    if (!caption) {
      figure.removeAttribute('data-fignum');
      continue;
    }
    count += 1;
    figure.setAttribute('data-fignum', String(count));
    let label = caption.firstElementChild;
    if (!(label && label.tagName === 'SPAN' && label.classList.contains('fig-num'))) {
      label = dom.createElement('span');
      label.className = 'fig-num';
      caption.insertBefore(label, caption.firstChild);
    }
    label.textContent = 'Figure ' + count + ': ';
  }
  return count;
}

function hashTarget(link) {
  const hash = (link.getAttribute('href') || '').replace(/^#/, '');
  try {
    return decodeURIComponent(hash);
  } catch (e) {
    return hash;
  }
}

/*
  Fills in cross-references: <a class="fig-ref" href="#fig-probe"></a>
  becomes the figure's number, and a link to a section becomes "§2.1". With
  data-ref="probe", the figure #fig-probe is tried first, then the section
  #probe. Unresolved references read "??".
*/
export function resolveCrossRefs(dom) {
  for (const link of Array.from(dom.querySelectorAll('a.fig-ref'))) {
    const ref = link.getAttribute('data-ref');
    const candidates = ref ? ['fig-' + ref, ref] : [hashTarget(link)];
    let text = null;
    let id = null;
    for (const candidate of candidates) {
      const target = candidate ? dom.getElementById(candidate) : null;
      if (!target) continue;
      if (target.hasAttribute('data-fignum')) {
        text = target.getAttribute('data-fignum');
      } else if (target.hasAttribute('data-secnum')) {
        text = '§' + target.getAttribute('data-secnum');
      } else {
        continue;
      }
      id = candidate;
      break;
    }
    if (text === null) {
      link.textContent = '??';
      console.warn('Cross-reference to "' + (ref || hashTarget(link)) + '" did not match a numbered figure or section.');
      continue;
    }
    link.textContent = text;
    link.setAttribute('href', '#' + id);
  }
}

/* Balanced rows: up to `max` cards per row, rows as even as possible. */
function columnsFor(count, max) {
  if (count <= max) return Math.max(count, 1);
  return Math.ceil(count / Math.ceil(count / max));
}

/*
  Section cards: a <d-section-cards> holding one link per section, each
  with an image and, optionally, a label. The cards move into d-title,
  under the standfirst; each gets the section's number, and its label
  defaults to the section's title.
*/
export function renderSectionCards(dom) {
  const cards = dom.querySelector('d-section-cards');
  if (!cards) return;

  const title = dom.querySelector('d-title');
  if (title && cards.parentElement !== title) title.appendChild(cards);

  const links = Array.from(cards.children).filter(isA('A'));
  for (const link of links) {
    let label = childWith(link, isA('SPAN', 'section-card__label'));
    if (!label) {
      const media = Array.from(link.children).filter(el => MEDIA.test(el.tagName.toUpperCase()));
      for (const el of media) link.removeChild(el);
      const text = link.textContent.replace(/\s+/g, ' ').trim();
      while (link.firstChild) link.removeChild(link.firstChild);

      const figure = dom.createElement('span');
      figure.className = 'section-card__figure';
      for (const el of media) figure.appendChild(el);
      link.appendChild(figure);

      label = dom.createElement('span');
      label.className = 'section-card__label';
      const num = dom.createElement('span');
      num.className = 'section-card__num';
      const name = dom.createElement('span');
      name.className = 'section-card__title';
      name.textContent = text;
      label.appendChild(num);
      label.appendChild(name);
      link.appendChild(label);
      link.classList.add('section-card');
    }

    const target = dom.getElementById(hashTarget(link));
    const num = childWith(label, isA('SPAN', 'section-card__num'));
    const name = childWith(label, isA('SPAN', 'section-card__title'));
    if (num) num.textContent = target && target.getAttribute('data-secnum') || '';
    if (name && !name.textContent.trim() && target) name.textContent = headingTitle(target);
  }

  cards.setAttribute('data-columns', String(columnsFor(links.length, 6)));
  cards.setAttribute('data-columns-medium', String(columnsFor(links.length, 4)));
  cards.setAttribute('data-columns-small', String(columnsFor(links.length, 3)));
}

/* Runs every step, in order. Returns the sections for the contents. */
export function renderStructure(dom) {
  const sections = numberSections(dom);
  numberFigures(dom);
  resolveCrossRefs(dom);
  renderSectionCards(dom);
  return sections;
}
