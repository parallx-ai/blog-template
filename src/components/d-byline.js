// Copyright 2018 The Distill Template Authors
// Modifications copyright 2026 Parallax: authors as one block with
// contribution marks, affiliations and date on the side; British dates; DOI
// shown only when the article has one.
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

const affiliationKey = affiliation => (affiliation.name || '') + '\n' + (affiliation.url || '');

function listOf(items) {
  if (items.length < 2) return items.join('');
  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}

function link(text, url) {
  return url ? `<a href="${url}">${text}</a>` : text;
}

/*
  Authors run together as one block, each followed by its marks: * for a
  core contributor ("core": true), † for a corresponding author
  ("corresponding": true, with an optional "email"). Affiliations and the
  date sit beside them. When authors have different affiliations, these are
  numbered and each author carries the numbers of their own.
*/
export function bylineTemplate(frontMatter) {
  const authors = frontMatter.authors || [];

  const affiliations = [];
  const numbers = new Map();
  for (const author of authors) {
    for (const affiliation of author.affiliations || []) {
      const key = affiliationKey(affiliation);
      if (!numbers.has(key)) {
        numbers.set(key, affiliations.length + 1);
        affiliations.push(affiliation);
      }
    }
  }
  const signature = author => (author.affiliations || []).map(affiliationKey).join('\n\n');
  const shared = authors.every(author => signature(author) === signature(authors[0]));
  const numbered = affiliations.length > 1 && !shared;

  const marks = author => {
    let text = numbered
      ? (author.affiliations || []).map(affiliation => numbers.get(affiliationKey(affiliation))).join(',')
      : '';
    if (author.core) text += '*';
    if (author.corresponding) text += '†';
    return text ? `<sup>${text}</sup>` : '';
  };

  const names = authors.map((author, i) => `<span class="author">${
    author.personalURL
      ? `<a class="name" href="${author.personalURL}">${author.name}</a>`
      : `<span class="name">${author.name}</span>`
  }${marks(author)}${i < authors.length - 1 ? ',' : ''}</span>`).join(' ');

  const notes = [];
  if (authors.some(author => author.core)) {
    notes.push('<span><sup>*</sup>Core contributor</span>');
  }
  const corresponding = authors.filter(author => author.corresponding);
  if (corresponding.length) {
    const emails = corresponding.filter(author => author.email)
      .map(author => `<a href="mailto:${author.email}">${author.email}</a>`);
    notes.push(`<span><sup>†</sup>${emails.length
      ? 'Correspondence to ' + listOf(emails)
      : (corresponding.length > 1 ? 'Corresponding authors' : 'Corresponding author')}</span>`);
  }

  return `
  <div class="byline">
    <div class="byline-authors">
      <h3>${authors.length === 1 ? 'Author' : 'Authors'}</h3>
      <p>${names}</p>
    </div>
    <div class="byline-meta">
      ${affiliations.length ? `
      <div class="byline-affiliations">
        <h3>${affiliations.length === 1 ? 'Affiliation' : 'Affiliations'}</h3>
        ${affiliations.map((affiliation, i) => `
        <p>${numbered ? `<sup>${i + 1}</sup>` : ''}${link(affiliation.name, affiliation.url)}</p>`).join('')}
      </div>` : ''}
      <div class="byline-published">
        <h3>Published</h3>
        ${frontMatter.publishedDate ? `
        <p>${frontMatter.publishedDateLong}</p>` : `
        <p><em>Not published yet.</em></p>`}
      </div>
      ${frontMatter.doi ? `
      <div class="byline-doi">
        <h3>DOI</h3>
        <p><a href="https://doi.org/${frontMatter.doi}">${frontMatter.doi}</a></p>
      </div>` : ''}
    </div>
    ${notes.length ? `
    <p class="byline-notes">${notes.join(' ')}</p>` : ''}
  </div>
`;
}

export class Byline extends HTMLElement {

  static get is() { return 'd-byline'; }

  set frontMatter(frontMatter) {
    this.innerHTML = bylineTemplate(frontMatter);
  }

}
