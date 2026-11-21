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

/*
  plx: the toolkit for interactive figures in Parallax articles. Load it
  after the template, from the same folder:

    <script src="template.v2.js"></script>
    <script src="figures.v1.js"></script>

  It provides `plx` (and `d3`, if the page has none):

    plx.figure(mount, draw)          draw when in view, redraw when the width changes
    plx.chart / axes / labelEnds / errorBars / colorbar   charts in plxviz's style
    plx.color / roles / series / ramp / sequential / diverging / tint / textOn
    plx.tooltip / hover / nearest    readouts
    plx.state / slider / toggle / dragNumber   shared state and controls
    plx.load / npy / parquet         data: JSON, CSV, TSV, text, NumPy, Parquet
    plx.tokens / token / topk        model text shaded token by token; ranked tokens
    plx.lazy / fit / captionKey      page helpers

  The file name carries the major version: changes that could break a
  published figure go into figures.v2.js.
*/

import * as d3 from 'd3';
import { installJetpack } from './jetpack';
import { chartProperties } from './colors';
import css from './figures.css';

export { d3 };
export const version = '1.0.0';

export {
  palette, color, rgb, mix, tint, luminance, contrast, textOn, readable, ramp, oklch, fromOklch, tone,
  sequential, diverging, roles, series, chartProperties,
} from './colors';
export { chart, axes, labelEnds, errorBars, colorbar } from './chart';
export { tooltip, hover, nearest, state, slider, toggle, dragNumber } from './interact';
export { load, npy, parquet } from './data';
export { tokens, token, topk } from './tokens';
export { figure, fit, lazy, captionKey } from './page';

installJetpack(d3);

if (typeof document !== 'undefined' && !document.getElementById('plx-figures-styles')) {
  const style = document.createElement('style');
  style.id = 'plx-figures-styles';
  style.textContent = chartProperties() + css;
  (document.head || document.documentElement).appendChild(style);
}

if (typeof window !== 'undefined' && !window.d3) window.d3 = d3;
