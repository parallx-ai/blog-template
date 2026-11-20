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

// Prerendered pages load the template late (after the web components
// loader), so they get the same small inline script as www.parallx.ai to set
// the reader's theme before first paint. Mirrors src/helpers/theme.js.
const themeScript = `(function () {
  try {
    var root = document.documentElement;
    var pinned = root.getAttribute('data-theme');
    if (pinned === 'light' || pinned === 'dark') {
      root.classList.toggle('dark', pinned === 'dark');
      return;
    }
    var stored = localStorage.getItem('theme');
    var systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (!stored && systemDark)) root.classList.add('dark');
  } catch (_) {}
})();`;

export default function render(dom) {
  if (dom.getElementById('parallax-theme')) return;
  const script = dom.createElement('script');
  script.id = 'parallax-theme';
  script.textContent = themeScript;
  dom.head.insertBefore(script, dom.head.firstChild);
}
