// Copyright 2018 The Distill Template Authors
// Modifications copyright 2026 Parallax: fill an existing empty appendix.
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

import { appendixTemplate } from '../distill-components/distill-appendix';

export default function(dom, data) {

  const appendixTag = dom.querySelector('d-appendix');
  if (!appendixTag) {
    console.warn('No appendix tag found!');
    return;
  }
  let distillAppendixTag = appendixTag.querySelector('distill-appendix');
  if (!distillAppendixTag) {
    distillAppendixTag = dom.createElement('distill-appendix');
    appendixTag.appendChild(distillAppendixTag);
  }
  // OptionalComponents may already have added an empty one.
  if (!distillAppendixTag.innerHTML.trim()) {
    distillAppendixTag.innerHTML = appendixTemplate(data);
  }

}
