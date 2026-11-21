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
  Chart scaffolding in plxviz's style: an SVG with margins and scales, axes
  with light gridlines, a stepped colour bar, and labels at the ends of lines
  in place of a legend.
*/

import * as d3 from 'd3';
import { palette as P, readable, color } from './colors';
import { resolve } from './util';

const MARGIN = { top: 28, right: 16, bottom: 42, left: 48 };

/*
  chart(mount, {width, height, margin, x, y, label}) appends an SVG to the
  mount. Width defaults to the mount's width. Returns {svg, g, width, height,
  x, y, margin}: `g` is the plotting area, `width` and `height` its size, and
  x and y linear scales already ranged to it (or the scales you pass).
*/
export function chart(target, options) {
  const opts = options || {};
  const mount = resolve(target);
  const outerWidth = Math.round(opts.width || mount.clientWidth || 640);
  const outerHeight = Math.round(opts.height || 300);
  const margin = Object.assign({}, MARGIN, opts.margin);
  const width = Math.max(outerWidth - margin.left - margin.right, 10);
  const height = Math.max(outerHeight - margin.top - margin.bottom, 10);

  const svg = d3.select(mount).append('svg')
    .attr('class', 'plx-chart')
    .attr('width', outerWidth)
    .attr('height', outerHeight)
    .attr('viewBox', '0 0 ' + outerWidth + ' ' + outerHeight);
  if (opts.label) svg.attr('role', 'img').attr('aria-label', opts.label);
  const g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  const x = (opts.x || d3.scaleLinear()).range([0, width]);
  const y = (opts.y || d3.scaleLinear()).range([height, 0]);
  return { svg, g, width, height, outerWidth, outerHeight, margin, x, y, mount };
}

const asFormat = f => typeof f === 'string' ? d3.format(f) : f;

/*
  axes(c, {xLabel, yLabel, xFormat, yFormat, xTicks, yTicks, grid}) draws the
  axes of a chart: tick labels in muted grey, gridlines along y (grid: "y",
  "x", "both" or false), the x axis line, and short axis labels, the y label
  set horizontally above the axis (it needs a top margin of 26px or more, the
  default).
*/
export function axes(c, options) {
  const opts = options || {};
  const grid = opts.grid === undefined ? 'y' : opts.grid;
  const x = opts.x || c.x;
  const y = opts.y || c.y;

  const xAxis = d3.axisBottom(x).tickSizeOuter(0).tickPadding(7)
    .tickSize(grid === 'x' || grid === 'both' ? -c.height : 4);
  const yAxis = d3.axisLeft(y).tickSizeOuter(0).tickPadding(8)
    .tickSize(grid === 'y' || grid === 'both' ? -c.width : 4);
  // About one tick per 80px across and per 45px up, unless told otherwise.
  xAxis.ticks(opts.xTicks != null ? opts.xTicks : Math.max(2, Math.round(c.width / 80)));
  yAxis.ticks(opts.yTicks != null ? opts.yTicks : Math.max(2, Math.round(c.height / 45)));
  if (opts.xTickValues) xAxis.tickValues(opts.xTickValues);
  if (opts.yTickValues) yAxis.tickValues(opts.yTickValues);
  if (opts.xFormat) xAxis.tickFormat(asFormat(opts.xFormat));
  if (opts.yFormat) yAxis.tickFormat(asFormat(opts.yFormat));

  const gy = c.g.insert('g', ':first-child').attr('class', 'plx-axis plx-axis--y').call(yAxis);
  const gx = c.g.insert('g', ':first-child').attr('class', 'plx-axis plx-axis--x')
    .attr('transform', 'translate(0,' + c.height + ')').call(xAxis);
  gy.select('.domain').remove();
  if (grid === 'y' || grid === 'both') gy.classed('plx-axis--grid', true);
  if (grid === 'x' || grid === 'both') gx.classed('plx-axis--grid', true);

  if (opts.xLabel) {
    c.g.append('text').attr('class', 'plx-axis-label')
      .attr('x', c.width / 2).attr('y', c.height + c.margin.bottom - 8)
      .attr('text-anchor', 'middle').text(opts.xLabel);
  }
  if (opts.yLabel) {
    c.g.append('text').attr('class', 'plx-axis-label')
      .attr('x', -c.margin.left + 2).attr('y', -14)
      .text(opts.yLabel);
  }
  return { x: gx, y: gy };
}

/*
  labelEnds(c, series, {x, y, color}) writes each line's name at its last
  point, nudged apart so labels never overlap: the plxviz way of naming lines
  without a legend. series: [{name, values, color}], x and y read a value's
  position (default d => d[0] and d => d[1], through the chart's scales).
  Leave room on the right with the chart's margin.
*/
export function labelEnds(c, list, options) {
  const opts = options || {};
  const px = opts.x || (d => c.x(d[0]));
  const py = opts.y || (d => c.y(d[1]));
  const gap = opts.gap || 15;
  const items = list.filter(s => s.values && s.values.length).map(s => {
    const last = s.values[s.values.length - 1];
    return { name: s.name, color: s.color || color('muted'), x: px(last), y: py(last), want: py(last) };
  }).sort((a, b) => a.want - b.want);

  // Push labels down where they collide, then back up from the bottom edge.
  for (let i = 1; i < items.length; i++) items[i].y = Math.max(items[i].want, items[i - 1].y + gap);
  const bottom = c.height;
  for (let i = items.length - 1; i >= 0; i--) {
    const limit = i === items.length - 1 ? bottom : items[i + 1].y - gap;
    items[i].y = Math.min(items[i].y, limit);
  }

  return c.g.append('g').attr('class', 'plx-end-labels').selectAll('text').data(items).enter().append('text')
    .attr('class', 'plx-end-label')
    .attr('x', d => d.x + 8)
    .attr('y', d => d.y)
    .attr('dy', '0.35em')
    .attr('fill', d => readable(d.color, P.surfaces.background, 3))
    .text(d => d.name);
}

/*
  colorbar(target, scale, {label, format, steps}) draws a stepped colour bar
  for a sequential or diverging scale, as plxviz does above its heatmaps:
  eleven steps, with the values at both ends and the middle.
*/
export function colorbar(target, scale, options) {
  const opts = options || {};
  const steps = opts.steps || 11;
  const fmt = asFormat(opts.format || '.2~f');
  const [lo, hi] = scale.domain();
  const mid = scale.middle == null ? (lo + hi) / 2 : scale.middle;
  const sw = 16;
  const sh = 10;
  const gap = 1;
  const labelWidth = opts.label ? measure(opts.label, 13) + 10 : 0;
  const width = labelWidth + steps * (sw + gap) - gap + 12;
  const pos = v => labelWidth + sw / 2 + (v - lo) / (hi - lo) * (steps - 1) * (sw + gap);

  const svg = d3.select(resolve(target)).append('svg')
    .attr('class', 'plx-colorbar').attr('width', width).attr('height', sh + 20)
    .attr('viewBox', '0 0 ' + width + ' ' + (sh + 20));
  if (opts.label) {
    svg.append('text').attr('class', 'plx-colorbar__label').attr('x', 0).attr('y', sh / 2 + 4.5).text(opts.label);
  }
  svg.selectAll('rect').data(d3.range(steps)).enter().append('rect')
    .attr('x', k => labelWidth + k * (sw + gap)).attr('y', 0)
    .attr('width', sw).attr('height', sh).attr('rx', 2)
    .attr('fill', k => scale(lo + k * (hi - lo) / (steps - 1)));
  svg.selectAll('text.plx-colorbar__tick').data([lo, mid, hi]).enter().append('text')
    .attr('class', 'plx-colorbar__tick').attr('x', pos).attr('y', sh + 15).attr('text-anchor', 'middle')
    .text(fmt);
  return svg;
}

let canvas = null;
function measure(text, size) {
  if (typeof document === 'undefined') return text.length * size * 0.55;
  canvas = canvas || document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return text.length * size * 0.55;
  ctx.font = '500 ' + size + 'px Inter, system-ui, sans-serif';
  return ctx.measureText(text).width;
}
