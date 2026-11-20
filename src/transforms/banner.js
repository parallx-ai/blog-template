// Copyright 2018 The Distill Template Authors
// Modifications copyright 2026 Parallax: Parallax draft banner.
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

const html = `
<style>
  dt-banner {
    background: #e8c97a;
    display: block;
    text-align: center;
    color: #111411;
    font-family: var(--plx-font-body);
    font-size: 15px;
    font-weight: 500;
    padding: 14px 16px;
    line-height: 1.5;
  }
</style>
<div>This article is a draft and has not been published by Parallax yet.</div>
`;

export default function(dom, data) {
  let banner = dom.createElement('dt-banner');
  banner.innerHTML = html;
  let b = dom.querySelector('body');
  b.insertBefore(banner, b.firstChild);
  banner.addEventListener('click', function() {
    banner.style.display = 'none';
  });
}
