# Parallax publication template

The template for research articles published by [Parallax](https://www.parallx.ai). It is a fork of the [Distill template](https://github.com/distillpub/template), so articles are written the same way, with one script, JSON front matter and the `<d-*>` elements, but they look like www.parallx.ai: the site's header and footer, Inter for text, the site's display serif for headings, and the cream, ink and gold palette. Articles use the light theme only.

Open `examples/index.html` (see [Local development](#local-development)) for a tour of every element. `examples/kitchen-sink.html` is the upstream Distill demo, kept as a regression page.

## Writing an article

```html
<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <script src="https://<where dist/ is served>/template.v2.js"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <distill-header></distill-header>
  <d-front-matter>
    <script type="text/json">{
      "title": "Article title",
      "description": "One-sentence summary.",
      "published": "November 20, 2026",
      "authors": [{"author": "Name Surname", "affiliations": [{"name": "Parallax", "url": "https://www.parallx.ai/"}]}]
    }</script>
  </d-front-matter>
  <d-title>
    <h1>Article title</h1>
    <p>Standfirst.</p>
  </d-title>
  <d-byline></d-byline>
  <d-article>
    <d-toc></d-toc>
    …
  </d-article>
  <d-appendix>
    <d-bibliography src="bibliography.bib"></d-bibliography>
  </d-appendix>
  <distill-footer></distill-footer>
</body>
</html>
```

Everything else (`d-cite`, `d-footnote`, `d-math`, `d-code`, `d-figure`, the `l-body`/`l-page`/`l-gutter` layout classes, asides) works as described in the [Distill guide](https://distill.pub/guide/).

Parallax additions:

- **Front matter.** Besides title, description, published date and authors, the JSON accepts `url` (canonical address, used in the citation and link previews), `journal` (`{"title": "…"}`, to cite under a name other than "Parallax"), `githubPath` (`"org/repo"`, adds "Updates and Corrections") and `license` (`{"name": "CC-BY 4.0", "url": "…"}`, adds a "Reuse" note). The closing section ends with a citation block and BibTeX once the article has a published date.
- **Byline.** Authors run together in one block, with affiliations, the date and the DOI (when the front matter has a `doi`) to the side. Mark authors with `"core": true` (*, "Core contributor") and `"corresponding": true` plus an optional `"email"` (†, "Correspondence to …"). If authors have different affiliations, these are numbered and each name carries its numbers. Dates are written the British way (20 November 2026).
- **Section numbers.** The `h2`, `h3` and `h4` headings of `d-article` are numbered (1, 1.1, 1.1.1), and each number links to its section. Headings without an `id` get one from their text (`"Code and tables"` → `#code-and-tables`). A heading with the `no-toc` attribute stays unnumbered and out of the contents.
- **Appendices.** Put an `appendix` attribute on the first appendix heading, `<h2 appendix>Appendix</h2>`; from there sections are lettered instead of numbered. One appendix with subsections reads A, A.1, A.2; several `h2`s read A, B, C. Acknowledgements, footnotes, references, updates and corrections and the citation stay in `d-appendix`, the closing section of the page.
- **Contents.** Add `<d-toc></d-toc>` where the contents should start, usually as the first child of `d-article`. They list the numbered `h2` and `h3` sections in the style of the reading menu on parallx.ai. On screens 1280px and wider they sit in the left margin beside the opening of the article; once they have scrolled away, they fold into a floating button at the bottom right that opens them as a panel. Narrower screens only get the button, and so does an article whose opening has a wide figure next to where the contents would sit.
- **Figure numbers and cross-references.** Every `figure` in `d-article` with a `figcaption` is numbered, and its caption starts with "Figure N:". Give a figure an `id` and refer to it with an empty link, `Figure <a class="fig-ref" href="#fig-probe"></a>`: the template fills in the number. A `fig-ref` to a section reads "§2.1". References that match nothing read "??" and log a warning.
- **Section cards.** An optional row of cards under the title, each linking to a section with a picture, as at the top of `examples/index.html`:

  ```html
  <d-section-cards>
    <a href="#figures"><img src="cards/figures.svg" alt=""></a>
    <a href="#code-and-tables"><img src="cards/code.svg" alt=""> Code</a>
  </d-section-cards>
  ```

  Place it after `d-title`. Each card shows the section's number and, unless the link has its own text, the section's title. Pictures are fitted into a 3:2 frame; up to six cards share a row on wide screens.

## Interactive figures

`figures.v1.js` is an optional toolkit for figures drawn in the browser. Load it after the template, from the same folder:

```html
<script src="template.v2.js"></script>
<script src="figures.v1.js"></script>
```

It defines `plx`, and `d3` if the page has none, and draws in plxviz's colours:

```html
<figure id="fig-layers" class="l-page">
  <div id="layers"></div>
  <figcaption>Accuracy of the probe by layer.</figcaption>
</figure>
<script>
  const chosen = plx.state({ layer: 16 });

  plx.figure("#layers", async (mount, context) => {
    const rows = await plx.load("data/probe.parquet");
    const c = plx.chart(mount, { height: 280 });
    c.x.domain([0, 32]);
    c.y.domain([0.4, 1]);
    plx.axes(c, { xLabel: "Layer", yLabel: "Accuracy", yFormat: ".0%" });
    // ...draw with d3, then follow the state:
    context.watch(chosen, ({ layer }) => { /* move a marker */ });
  });
</script>
```

| Functions | What they do |
| --- | --- |
| `plx.figure(mount, draw)` | Draws when the figure comes into view (or is printed), and again when its width changes. `draw(mount, context)` may be async; `context.watch(state, fn)` follows a state for as long as that drawing lasts. Errors show in place of the figure. |
| `plx.chart`, `plx.axes`, `plx.labelEnds`, `plx.colorbar` | An SVG with margins and scales; axes with light gridlines; line names at their ends instead of a legend; a stepped colour bar. |
| `plx.color`, `plx.roles`, `plx.series`, `plx.ramp`, `plx.tint`, `plx.textOn` | plxviz's colours: by name or by role (`roles({control: "Base", intervention: "Steered"})`), the series order, the ordered ramp, pale tints, readable text on a fill. |
| `plx.sequential`, `plx.diverging`, `plx.tone` | plxviz's heatmap scales. |
| `plx.tooltip`, `plx.hover`, `plx.nearest` | One tooltip for the page, readouts on hover, and the point nearest the pointer. |
| `plx.state`, `plx.slider`, `plx.toggle` | State shared between figures, and controls bound to it. |
| `plx.load`, `plx.npy`, `plx.parquet` | Files read once per page and parsed by extension: JSON, CSV and TSV (typed), text, NumPy `.npy` (floats from 16 to 64 bits, integers, booleans) and Parquet (rows as objects; Snappy or uncompressed, the pandas and pyarrow defaults). |
| `plx.tokens`, `plx.token` | Model text shaded token by token as plxviz draws it, with a colour bar and a tooltip per token; `update(values)` recolours it. |
| `plx.fit`, `plx.captionKey`, `plx.lazy` | Scale a fixed-size figure to its column; colour words of a caption to serve as its legend; run something when an element comes into view. |

D3 selections also get a few shortcuts: `append("div.note")` with classes and an id, `at({...})` and `st({...})` for several attributes or styles at once, `translate([x, y])` and `appendMany(tag, data)`.

The colours come from plxviz: `src/figures/palette.json` is a copy of plxviz's `docs/palette.json` (`viz colors --json`). When plxviz's palette changes, run `node bin/sync-palette.js path/to/plxviz` and rebuild; the tests check the colour formulas against reference values computed by plxviz. Every page made with the template also has these colours as CSS properties, `--plx-chart-gold`, `--plx-chart-control`, `--plx-chart-grid` and so on, with or without the toolkit.

The file name carries the major version, so published articles keep working: changes that could break existing figures go into `figures.v2.js`. Figure 3 of `examples/index.html` uses most of the toolkit; `examples/data/make_data.py` writes its data.

## Design tokens

All colours and fonts are CSS custom properties (`src/styles/parallax-tokens.css`), mirrored from the website's `global.css` and namespaced with `--plx-`. Articles can use them in their own CSS and SVG.

| Token | Value | Use |
| --- | --- | --- |
| `--plx-cream` | `#f4f1ea` | page |
| `--plx-paper` | `#eef1ed` | inline code, panels |
| `--plx-ink` | `#111411` | headings, emphasis |
| `--plx-ink-1` | `#303631` | body text |
| `--plx-ink-2` | `#606a63` | captions, secondary text |
| `--plx-rule` / `--plx-rule-soft` | `#cfd6d0` / `#e1e6e1` | hairlines |
| `--plx-gold` | `#c89a2a` | rules, underlines, markers |
| `--plx-gold-deep` | `#a37f1f` | hover, accents |
| `--plx-gold-ink` | `#896600` | small gold text: links, citation marks |
| `--plx-code-bg` | `#151c19` | code blocks (with `--plx-code-*` colours) |
| `--plx-card` / `--plx-card-figure` | `#fbf8f0` / `#eee8da` | section cards, from the website's research cards |
| `--plx-font-display` | Iowan Old Style, Palatino, … | headings |
| `--plx-font-body` | Inter, system UI | text |
| `--plx-font-mono` | ui-monospace, SF Mono, … | code |

`--plx-gold-ink` is the one deliberate departure from the website: the site's `#a37f1f` reaches 3.3:1 on cream, below WCAG AA for running text, so link text uses a darker gold (4.7:1) while underlines and accents keep the site's gold.

Charts use plxviz's palette, as `--plx-chart-*` properties (see [Interactive figures](#interactive-figures)).

Names, links, the legal line and the logos live in `src/distill-components/parallax-brand.js`; keep it in sync with `SiteNav.astro` and `SiteFooter.astro` on the website.

## Local development

```bash
npm ci
npm run dev    # watches src/ and serves dist/ + examples/ on http://localhost:8088
npm run build  # one-off build into dist/
npm test
```

The template is built with Rollup; the figures toolkit, `src/figures/`, with esbuild (`bin/build-figures.js`), because d3 and hyparquet need a newer JavaScript parser. Both run in `npm run dev` and `npm run build`.

## Deploying

Serve the contents of `dist/` together: `template.v2.js` plus the `fonts/` folder next to it, and `figures.v1.js` for articles with interactive figures. The template loads Inter from that folder, relative to its own URL, so no third-party font service is contacted (fonts are sent with CORS headers by GitHub Pages and most static hosts). The logos are bundled into the script.

KaTeX and the polyfills for very old browsers are still loaded from distill.pub, as in the upstream template.

## Licences

The code is the Distill template's, under the [Apache License 2.0](LICENSE); files changed for Parallax say so in their headers. Inter is under the SIL Open Font License (`src/assets/fonts/inter/OFL.txt`). `figures.v1.js` bundles d3 (ISC, with d3-ease under BSD-3-Clause) and hyparquet (MIT); their licences are at the end of the file. The Parallax name, wordmark and mark in `src/assets/parallax/` belong to Parallax and are not covered by the Apache License.
