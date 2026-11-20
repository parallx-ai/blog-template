// Copyright 2018 The Distill Template Authors
// Modifications copyright 2026 Parallax: the www.parallx.ai navigation bar.
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

import { logos, nav, themeIcons, SITE_URL } from './parallax-brand';

// Same structure and measurements as SiteNav.astro: sticky, 76px tall,
// translucent cream with a blur, wordmark on the left, About, a gold
// "Join us" pill and the theme toggle on the right.
export const headerTemplate = `
<style>
distill-header {
  position: sticky;
  top: 0;
  z-index: 50;
  height: var(--plx-nav-height);
  width: 100%;
  box-sizing: border-box;
  color: var(--plx-ink);
  font-family: var(--plx-font-body);
  background-color: var(--plx-cream);
  background-color: color-mix(in srgb, var(--plx-cream) 88%, transparent);
  -webkit-backdrop-filter: blur(12px) saturate(1.4);
  backdrop-filter: blur(12px) saturate(1.4);
  border-bottom: 1px solid var(--plx-rule-soft);
}
/* The website's Container (1180px, 32px gutters), so the wordmark and links
   sit exactly where they do on www.parallx.ai. */
distill-header .content {
  grid-column: screen;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  max-width: 1180px;
  height: 100%;
  margin: 0 auto;
  padding: 0 32px;
  box-sizing: border-box;
}
distill-header a {
  text-decoration: none;
  border-bottom: none;
}
distill-header .logo {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}
distill-header .logo img {
  display: block;
  width: 120px;
  height: auto;
  background: none;
}
distill-header .logo .on-dark {
  display: none;
}
html.dark distill-header .logo .on-light {
  display: none;
}
html.dark distill-header .logo .on-dark {
  display: block;
}
distill-header .nav {
  display: flex;
  align-items: center;
  gap: 28px;
  font-size: 16px;
  line-height: 1.5;
}
distill-header .nav-link {
  position: relative;
  padding: 6px 0;
  font-weight: 600;
  color: var(--plx-ink-1);
}
distill-header .nav-link:hover {
  color: var(--plx-ink-1);
}
distill-header .nav-link::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: var(--plx-gold);
  display: none;
}
distill-header .nav-link:hover::after {
  display: block;
}
distill-header .join {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--plx-gold-button);
  padding: 8px 16px;
  font-weight: 600;
  line-height: 1;
  color: #fff;
}
distill-header .join:hover,
distill-header .join:active {
  color: #fff;
}
distill-header .theme-toggle {
  display: flex;
  width: 42px;
  height: 42px;
  margin: 0;
  padding: 0;
  align-items: center;
  justify-content: center;
  border: 0;
  background: none;
  color: var(--plx-ink-2);
  cursor: pointer;
  transition: color 0.15s;
}
distill-header .theme-toggle:hover {
  color: var(--plx-gold-deep);
}
distill-header .theme-toggle svg {
  display: block;
  width: 22px;
  height: 22px;
}
distill-header .theme-toggle .icon-sun {
  display: none;
}
html.dark distill-header .theme-toggle .icon-moon {
  display: none;
}
html.dark distill-header .theme-toggle .icon-sun {
  display: block;
}
html[data-theme] distill-header .theme-toggle {
  display: none;
}
@media (max-width: 600px) {
  distill-header .content {
    padding: 0 16px;
  }
  distill-header .logo img {
    width: 100px;
  }
  distill-header .nav {
    gap: 14px;
    font-size: 15px;
  }
  distill-header .join {
    padding: 8px 10px;
  }
}
@media print {
  distill-header {
    display: none;
  }
}
</style>
<div class="content">
  <a href="${SITE_URL}" class="logo" aria-label="Parallax">
    <img class="on-light" src="${logos.wordmarkOnLight}" alt="Parallax" width="120" height="42">
    <img class="on-dark" src="${logos.wordmarkOnDark}" alt="" aria-hidden="true" width="120" height="42">
  </a>
  <nav class="nav" aria-label="Primary">
    <a class="nav-link" href="${nav.about.href}">${nav.about.label}</a>
    <a class="join" href="${nav.join.href}">${nav.join.label}</a>
    <button class="theme-toggle" type="button" aria-label="Toggle theme" title="Toggle theme">${themeIcons.moon}${themeIcons.sun}</button>
  </nav>
</div>
`;
