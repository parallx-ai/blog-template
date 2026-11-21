// Copyright 2018 The Distill Template Authors
// Modifications copyright 2026 Parallax: the www.parallx.ai footer.
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

import { logos, textures, footerEdgeMask, nav, legal, socials, SITE_URL } from './parallax-brand';

const year = new Date().getFullYear();
const sponsorLink = `<a href="${legal.sponsor.href}" rel="noopener" target="_blank">${legal.sponsor.name}</a>`;

const socialItems = socials.map(({ label, href, size, icon }) => {
  const external = !href.startsWith('mailto:');
  return `<li><a href="${href}"${external ? ' rel="noopener" target="_blank"' : ''} aria-label="${label}" title="${label}"><svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${icon}</svg></a></li>`;
}).join('');

// Same composition as SiteFooter.astro: an ink landscape (dark ground, a
// watercolour top edge, an inverted ink wash), a dotted gold orbit, then the
// wordmark, links, legal line and social icons. The footer is dark in both
// themes, as on the website.
export const footerTemplate = `
<style>

:host {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding-top: 64px;
  color: #eee7d8;
  font-family: var(--plx-font-body);
  font-size: 16px;
  line-height: 1.6;
  text-align: left;
  contain: content;
}

.landscape {
  position: absolute;
  inset: 0;
  z-index: -2;
  background: #151c19;
  -webkit-mask: url("${footerEdgeMask}") center / 100% 100% no-repeat;
  mask: url("${footerEdgeMask}") center / 100% 100% no-repeat;
}

.landscape::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("${textures.footerInk}") center bottom / cover;
  filter: sepia(0.2) hue-rotate(145deg) saturate(0.5);
  opacity: 0.45;
}

.landscape::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(#151c1966, #1016121a 25%, #030504c7 60%, #000 90%);
}

.orbit {
  position: absolute;
  inset: auto 0 20px;
  width: 100%;
  height: 140px;
  color: #cfac67;
  opacity: 0.36;
  pointer-events: none;
}

.footer-container {
  grid-column: screen;
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 32px;
  box-sizing: border-box;
}

a {
  text-decoration: none;
}

.main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 24px;
}

.brand {
  display: block;
  width: 160px;
  max-width: 55%;
}

.brand img {
  display: block;
  width: 100%;
  height: auto;
}

.navigation {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  font-size: 15px;
}

.navigation a {
  color: #eee7d8;
  transition: color 180ms;
}

.navigation a:hover {
  color: #efcc82;
}

.bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 0 20px;
  border-top: 1px solid #ccae7040;
}

.legal {
  max-width: 660px;
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: #d0d0c4;
}

.legal a {
  color: inherit;
  text-decoration: underline;
  text-decoration-color: #c9bfa06b;
  text-underline-offset: 3px;
}

.legal a:hover {
  color: #efcc82;
}

.socials {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 5px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.socials a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: #e1dacb;
  border-radius: 50%;
  transition: color 180ms, background 180ms;
}

.socials a:hover {
  color: #efcc82;
  background: #ccae701c;
}

a:focus-visible {
  outline: 2px solid #d7aa3d;
  outline-offset: 4px;
}

@media (max-width: 600px) {
  :host {
    padding-top: 60px;
  }
  .footer-container {
    padding: 0 16px;
  }
  .main {
    flex-direction: column;
    gap: 16px;
    padding-bottom: 20px;
  }
  .brand {
    width: 140px;
    max-width: 80%;
  }
  .navigation {
    justify-content: center;
    gap: 20px;
    font-size: 14px;
  }
  .bottom {
    flex-direction: column-reverse;
    gap: 10px;
    text-align: center;
    padding-top: 14px;
  }
  .landscape::before {
    background-position: 70% bottom;
  }
}

</style>

<div class="landscape" aria-hidden="true"></div>
<svg class="orbit" viewBox="0 0 1100 250" preserveAspectRatio="none" fill="none" aria-hidden="true"><path d="M-30 184C222 22 396 309 717 144S1025 47 1170 95" stroke="currentColor" stroke-width="0.9" stroke-dasharray="0.8 4" stroke-linecap="round"/><circle cx="717" cy="144" r="3" fill="currentColor"/></svg>

<div class="footer-container">
  <div class="main">
    <a href="${SITE_URL}" aria-label="Parallax home" class="brand"><img src="${logos.wordmarkOnDark}" alt="" width="160" height="56"></a>
    <nav class="navigation" aria-label="Footer">
      <a href="${nav.about.href}">${nav.about.label}</a>
      <a href="${nav.join.href}">${nav.join.label}</a>
      <a href="${nav.contact.href}">${nav.contact.label}</a>
    </nav>
  </div>
  <div class="bottom">
    <p class="legal">${legal.text(year, sponsorLink)}</p>
    <ul class="socials" aria-label="Parallax links">${socialItems}</ul>
  </div>
</div>

`;
