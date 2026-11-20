// Copyright 2018 The Distill Template Authors
// Modifications copyright 2026 Parallax: theme toggle.
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
import { isDark, toggleTheme, THEME_CHANGE_EVENT } from '../helpers/theme';

import {headerTemplate} from './distill-header-template';

const T = Template('distill-header', headerTemplate, false);

export class DistillHeader extends T(HTMLElement) {

  connectedCallback() {
    // Inserts the template, unless the header was prerendered.
    super.connectedCallback();

    const toggle = this.querySelector('.theme-toggle');
    if (!toggle || toggle.hasAttribute('data-bound')) return;
    toggle.setAttribute('data-bound', '');

    const sync = () => toggle.setAttribute('aria-pressed', String(isDark()));
    toggle.addEventListener('click', () => {
      toggleTheme();
      sync();
    });
    document.addEventListener(THEME_CHANGE_EVENT, sync);
    sync();
  }

}
