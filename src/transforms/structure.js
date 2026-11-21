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

import { renderStructure } from '../helpers/structure';
import { renderTOC } from '../components/d-toc';

/* Section and figure numbers, cross-references, section cards and the
   contents. The browser repeats this on load (see controller.js). */
export default function(dom) {
  const sections = renderStructure(dom);
  const toc = dom.querySelector('d-toc');
  if (toc) renderTOC(dom, toc, sections);
}
