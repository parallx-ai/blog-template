// Copyright 2018 The Distill Template Authors
// Modifications copyright 2026 Parallax: appendix typography and colours.
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

import { Template } from '../mixins/template';

const T = Template('d-appendix', `
<style>

d-appendix {
  contain: layout style;
  font-size: 14px;
  line-height: 1.7;
  margin-top: 64px;
  margin-bottom: 0;
  border-top: 1px solid var(--plx-rule-soft);
  color: var(--plx-ink-2);
  padding-top: 56px;
  padding-bottom: 72px;
}

d-appendix h3 {
  grid-column: text;
  font-family: var(--plx-font-display);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.015em;
  margin-top: 2rem;
  margin-bottom: 0;
  color: var(--plx-ink);
}

d-appendix h3 + * {
  margin-top: 0.6rem;
}

/* On wide screens headings sit in the left margin, level with their text. */
@media (min-width: 1000px) {
  d-appendix h3 {
    grid-column: page-start / text-start;
    margin-top: 1.75rem;
  }

  d-appendix h3 + * {
    margin-top: 1.75rem;
  }
}

/* Numbers start on the text edge, like the rest of the appendix, and the
   item text hangs at a fixed indent after them. */
d-appendix ol {
  list-style: none;
  counter-reset: plx-item;
  padding: 0;
  margin-left: 0;
}

d-appendix ol > li {
  counter-increment: plx-item;
  position: relative;
  padding-left: 2em;
}

d-appendix ol > li::before {
  content: counter(plx-item) ".";
  position: absolute;
  left: 0;
  color: var(--plx-ink-2);
  font-variant-numeric: tabular-nums;
}

d-appendix li {
  margin-bottom: 1em;
}

d-appendix a {
  color: var(--plx-ink-1);
  text-decoration: none;
  border-bottom: 1px solid var(--plx-rule);
  transition: color 0.15s, border-color 0.15s;
}

d-appendix a:hover {
  color: var(--plx-gold-ink);
  border-bottom-color: var(--plx-gold);
}

d-appendix > * {
  grid-column: text;
}

d-appendix > d-footnote-list,
d-appendix > d-citation-list,
d-appendix > distill-appendix {
  grid-column: screen;
}

</style>

`, false);

export class Appendix extends T(HTMLElement) {

}
