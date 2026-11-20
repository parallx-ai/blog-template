// Copyright 2018 The Distill Template Authors
// Modifications copyright 2026 Parallax: Parallax syntax theme (replaces the
// default Prism theme, which has no dark variant).
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

import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-lua';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-julia';

import { Template } from '../mixins/template.js';
import { Mutating } from '../mixins/mutating.js';

const T = Template('d-code', `
<style>

:host {
  letter-spacing: 0;
}

code {
  white-space: nowrap;
  font-family: var(--plx-font-mono);
  font-size: 0.88em;
  color: var(--plx-ink);
  background: var(--plx-paper);
  border-radius: 2px;
  padding: 0.1em 0.35em;
  -moz-tab-size: 2;
  tab-size: 2;
}

pre {
  margin: 0 0 1.5em;
}

pre code {
  display: block;
  white-space: pre;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.6;
  padding: 1em 1.25em;
  border-left: 2px solid var(--plx-gold);
  border-radius: 0 4px 4px 0;
}

.token.comment,
.token.prolog,
.token.doctype,
.token.cdata {
  color: var(--plx-code-comment);
  font-style: italic;
}

.token.punctuation,
.token.operator,
.token.entity,
.token.url {
  color: var(--plx-code-punctuation);
}

.token.namespace {
  opacity: 0.75;
}

.token.property,
.token.boolean,
.token.number,
.token.constant,
.token.symbol,
.token.deleted {
  color: var(--plx-code-number);
}

.token.selector,
.token.attr-name,
.token.string,
.token.char,
.token.builtin,
.token.inserted {
  color: var(--plx-code-string);
}

.token.atrule,
.token.attr-value,
.token.keyword {
  color: var(--plx-code-keyword);
}

.token.function,
.token.class-name {
  color: var(--plx-code-function);
}

.token.tag,
.token.regex,
.token.important,
.token.variable {
  color: var(--plx-code-tag);
}

.token.important,
.token.bold {
  font-weight: 600;
}

.token.italic {
  font-style: italic;
}
</style>

<code id="code-container"></code>

`);

export class Code extends Mutating(T(HTMLElement)) {

  renderContent() {

    // check if language can be highlighted
    this.languageName = this.getAttribute('language');
    if (!this.languageName) {
      console.warn('You need to provide a language attribute to your <d-code> block to let us know how to highlight your code; e.g.:\n <d-code language="python">zeros = np.zeros(shape)</d-code>.');
      return;
    }
    const language = Prism.languages[this.languageName];
    if (language == undefined) {
      console.warn(`The template does not yet support highlighting your code block in "${this.languageName}".`);
      return;
    }

    let content = this.textContent;
    const codeTag = this.shadowRoot.querySelector('#code-container');

    if (this.hasAttribute('block')) {
      // normalize the tab indents
      content = content.replace(/\n/, '');
      const tabs = content.match(/\s*/);
      content = content.replace(new RegExp('\n' + tabs, 'g'), '\n');
      content = content.trim();
      // wrap code block in pre tag if needed
      if (codeTag.parentNode instanceof ShadowRoot) {
        const preTag = document.createElement('pre');
        this.shadowRoot.removeChild(codeTag);
        preTag.appendChild(codeTag);
        this.shadowRoot.appendChild(preTag);
      }

    }

    codeTag.className = `language-${this.languageName}`;
    codeTag.innerHTML = Prism.highlight(content, language);
  }

}
