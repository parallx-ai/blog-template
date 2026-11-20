// Copyright 2018 The Distill Template Authors
// Modifications copyright 2026 Parallax: Parallax review screen.
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
import { logos, PRODUCTION_HOSTNAMES } from '../distill-components/parallax-brand';

// This overlay is not secure.
// It is only meant as a social deterrent.

const T = Template('d-interstitial', `
<style>

.overlay {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: var(--plx-cream);
  color: var(--plx-ink-1);
  font-family: var(--plx-font-body);

  opacity: 1;
  visibility: visible;

  display: flex;
  flex-flow: column;
  justify-content: center;
  z-index: 2147483647 /* MaxInt32 */

}

.container {
  position: relative;
  margin-left: auto;
  margin-right: auto;
  max-width: 420px;
  padding: 2em;
}

.logo {
  display: block;
  width: 120px;
  height: auto;
  margin-bottom: 3em;
}

.logo-light {
  display: var(--plx-show-on-light, block);
}

.logo-dark {
  display: var(--plx-show-on-dark, none);
}

h1 {
  font-family: var(--plx-font-display);
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: var(--plx-ink);
  text-decoration: underline;
  text-decoration-color: var(--plx-gold);
  -webkit-text-decoration-color: var(--plx-gold);
  text-decoration-thickness: 1px;
  text-underline-offset: 6px;
  margin-bottom: 1em;
}

input[type="password"] {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  box-shadow: none;
  border-radius: 0;
  outline: none;

  font-family: inherit;
  font-size: 18px;
  color: var(--plx-ink);
  background: none;
  width: 50%;
  padding: 10px 0;
  border: none;
  border-bottom: solid 2px var(--plx-rule);
  transition: border .3s;
}

input[type="password"]:focus {
  border-bottom: solid 2px var(--plx-gold);
}

input[type="password"].wrong {
  border-bottom: solid 2px #a6553e;
}

p small {
  color: var(--plx-ink-2);
}

</style>

<div class="overlay">
  <div class="container">
    <img class="logo logo-light" src="${logos.wordmarkOnLight}" alt="Parallax">
    <img class="logo logo-dark" src="${logos.wordmarkOnDark}" alt="" aria-hidden="true">
    <h1>This article is in review.</h1>
    <p>Do not share this URL or the contents of this article. Thank you!</p>
    <input id="interstitial-password-input" type="password" name="password" aria-label="Review password" autofocus/>
    <p><small>Enter the password we shared with you as part of the review process to view the article.</small></p>
  </div>
</div>
`);

export class Interstitial extends T(HTMLElement) {

  connectedCallback() {
    if (this.shouldRemoveSelf()) {
      this.parentElement.removeChild(this);
    } else {
      const passwordInput = this.root.querySelector('#interstitial-password-input');
      passwordInput.oninput = (event) => this.passwordChanged(event);
    }
  }

  passwordChanged(event) {
    const entered = event.target.value;
    if (entered === this.password) {
      console.log('Correct password entered.');
      this.parentElement.removeChild(this);
      if (typeof(Storage) !== 'undefined') {
        console.log('Saved that correct password was entered.');
        localStorage.setItem(this.localStorageIdentifier(), 'true');
      }
    }
  }

  shouldRemoveSelf() {
    // should never be visible in production
    if (window && PRODUCTION_HOSTNAMES.includes(window.location.hostname)) {
      console.warn('Interstitial found on production, hiding it.');
      return true
    }
    // should only have to enter password once
    if (typeof(Storage) !== 'undefined') {
      if (localStorage.getItem(this.localStorageIdentifier()) === 'true') {
        console.log('Loaded that correct password was entered before; skipping interstitial.');
        return true;
      }
    }
    // otherwise, leave visible
    return false;
  }

  localStorageIdentifier() {
    const prefix = 'parallax-drafts'
    const suffix = 'interstitial-password-correct';
    return prefix + (window ? window.location.pathname : '-') + suffix
  }

}
