// Copyright 2018 The Distill Template Authors
// Modifications copyright 2026 Parallax: Parallax citation text and styles,
// and an optional, front-matter driven "Reuse" note.
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

import { serializeFrontmatterToBibtex } from '../helpers/bibtex';

const styles = `
<style>
  distill-appendix {
    contain: layout style;
  }

  distill-appendix .citation {
    font-family: var(--plx-font-mono);
    font-size: 12px;
    line-height: 1.6;
    letter-spacing: 0;
    color: var(--plx-ink-1);
    background: var(--plx-paper);
    border: 1px solid var(--plx-rule-soft);
    border-radius: 4px;
    padding: 10px 16px;
    overflow: hidden;
    margin-top: -12px;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  distill-appendix > * {
    grid-column: text;
  }
</style>
`;

export function appendixTemplate(frontMatter) {
  let html = styles;

  if (typeof frontMatter.githubUrl !== 'undefined') {
    html += `
    <h3 id="updates-and-corrections">Updates and Corrections</h3>
    <p>`;
    if (frontMatter.githubCompareUpdatesUrl) {
      html += `<a href="${frontMatter.githubCompareUpdatesUrl}">View all changes</a> to this article since it was first published.`;
    }
    html += `
    If you see mistakes or want to suggest changes, please <a href="${frontMatter.githubUrl + '/issues/new'}">create an issue on GitHub</a>. </p>
    `;
  }

  const license = frontMatter.license;
  if (license && license.name) {
    const licenseName = license.url ? `<a href="${license.url}">${license.name}</a>` : license.name;
    const source = frontMatter.githubUrl ? ` with the <a class="github" href="${frontMatter.githubUrl}">source available on GitHub</a>` : '';
    html += `
    <h3 id="reuse">Reuse</h3>
    <p>Diagrams and text are licensed under ${licenseName}${source}, unless noted otherwise. Figures reused from other sources are not covered by this licence and are marked in their captions.</p>
    `;
  }

  if (typeof frontMatter.publishedDate !== 'undefined') {
    const journal = (frontMatter.journal && frontMatter.journal.title) || 'Parallax';
    html += `
    <h3 id="citation">Citation</h3>
    <p>For attribution in academic contexts, please cite this work as</p>
    <pre class="citation short">${frontMatter.concatenatedAuthors}, "${frontMatter.title}", ${journal}, ${frontMatter.publishedYear}.</pre>
    <p>BibTeX citation</p>
    <pre class="citation long">${serializeFrontmatterToBibtex(frontMatter)}</pre>
    `;
  }

  return html;
}

export class DistillAppendix extends HTMLElement {

  static get is() { return 'distill-appendix'; }

  set frontMatter(frontMatter) {
    this.innerHTML = appendixTemplate(frontMatter);
  }

}
