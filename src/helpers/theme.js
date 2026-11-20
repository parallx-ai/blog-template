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

// Light/dark theme, matching www.parallx.ai: the `dark` class on <html>, the
// same localStorage key ("theme"), and the system preference as the default.
// A page can pin its theme with <html data-theme="light"> or "dark"; the
// header then hides its toggle.

export const THEME_STORAGE_KEY = 'theme';
export const THEME_CHANGE_EVENT = 'parallax:themechange';

function root() {
  return document.documentElement;
}

export function pinnedTheme() {
  const pinned = root().getAttribute('data-theme');
  return pinned === 'light' || pinned === 'dark' ? pinned : null;
}

export function isDark() {
  return root().classList.contains('dark');
}

// Runs as soon as the template script executes (normally in <head>), so the
// page is painted in the right theme from the start.
export function initTheme() {
  const pinned = pinnedTheme();
  if (pinned) {
    root().classList.toggle('dark', pinned === 'dark');
    return;
  }
  let stored = null;
  try {
    stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch (_) {
    // storage can be unavailable (privacy modes, sandboxed frames)
  }
  const systemDark = typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (stored === 'dark' || (!stored && systemDark)) {
    root().classList.add('dark');
  }
}

export function setTheme(dark) {
  if (pinnedTheme()) return isDark();
  root().classList.toggle('dark', dark);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
  } catch (_) {
    // the theme still applies for this page view
  }
  // Interactive figures can listen for this event to redraw.
  document.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { dark } }));
  return dark;
}

export function toggleTheme() {
  return setTheme(!isDark());
}
