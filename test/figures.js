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

/* The figures toolkit, dist/figures.v1.js: its colours against plxviz's own
   reference values, and its data readers against files numpy and pyarrow
   wrote (test/fixtures/make_fixtures.py). */

const fs = require("fs");
const path = require("path");
const expect = require("chai").expect;
const plx = require("../dist/figures.v1.js");

const fixture = name => {
  const bytes = fs.readFileSync(path.join(__dirname, "fixtures", name));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
};

describe("Figures toolkit", function() {
  describe("colours", function() {
    const ref = plx.palette.reference;

    it("should draw plxviz's scale tones", function() {
      for (const name of Object.keys(ref.tone)) {
        for (const [t, hex] of ref.tone[name]) {
          expect(plx.tone(name, t), name + " at " + t).to.equal(hex);
        }
      }
    });

    it("should draw plxviz's ordered ramps and text on fills", function() {
      for (const n of Object.keys(ref.ramp)) expect(plx.ramp(Number(n))).to.deep.equal(ref.ramp[n]);
      for (const name of Object.keys(ref["text-on"])) {
        expect(plx.textOn(plx.color(name)), name).to.equal(ref["text-on"][name]);
      }
    });

    it("should name colours by palette name and by role", function() {
      expect(plx.color("intervention")).to.equal("#A37F1F");
      expect(plx.color("baseline")).to.equal(plx.color("gray"));
      expect(plx.color("light_blue")).to.equal("#AFC4D3");
      expect(plx.color("#123456")).to.equal("#123456");
      expect(() => plx.color("chartreuse")).to.throw(/Unknown colour/);
    });

    it("should colour labels by role, muting the rest in turn", function() {
      const colorOf = plx.roles({ control: "Shuffled", intervention: ["Probe"], ordered: ["1B", "8B"] });
      expect(colorOf("Probe")).to.equal("#A37F1F");
      expect(colorOf("Shuffled")).to.equal(plx.color("gray"));
      expect([colorOf("1B"), colorOf("8B")]).to.deep.equal(plx.ramp(2));
      expect([colorOf("x"), colorOf("y"), colorOf("x")]).to.deep.equal(["#BEC5BF", "#D6DCD6", "#BEC5BF"]);
      expect(() => plx.roles({ hero: "A" })).to.throw(/Unknown role/);
      const bySeries = plx.series(["a", "b", "c", "d", "e", "f"]);
      expect(["a", "b", "f"].map(bySeries)).to.deep.equal(["#A37F1F", "#557E98", "#BEC5BF"]);
    });

    it("should build sequential and diverging scales as plxviz does", function() {
      const seq = plx.sequential("gold", [0, 10]);
      expect(seq(10)).to.equal(plx.tone("gold", 1));
      expect(seq(0)).to.equal(plx.tone("gold", plx.palette.scale.start));
      const div = plx.diverging([-2, 1]);
      expect(div.domain()).to.deep.equal([-2, 2]);
      expect(div(0)).to.equal(plx.tone("blue", 0));
      expect(div(-2)).to.equal(plx.tone("coral", 1));
      expect(div(2)).to.equal(plx.tone("blue", 1));
    });

    it("should list the palette as CSS properties", function() {
      const css = plx.chartProperties();
      expect(css).to.include("--plx-chart-gold: #A37F1F;");
      expect(css).to.include("--plx-chart-control: #BEC5BF;");
      expect(css).to.include("--plx-chart-grid: #E1E6E1;");
    });
  });

  describe("data", function() {
    it("should read NumPy files", function() {
      const a = plx.npy(fixture("f4.npy"));
      expect(a.shape).to.deep.equal([3, 4]);
      expect(a.data).to.be.an.instanceof(Float32Array);
      expect(a.get(2, 3)).to.equal(2.75);
      expect(Array.from(plx.npy(fixture("f2.npy")).data)).to.deep.equal([0.5, -1.25, 1000, 0.00006097555160522461]);
      expect(Array.from(plx.npy(fixture("f8-big-endian.npy")).data)).to.deep.equal([1.5, -2.25, 3]);
      expect(Array.from(plx.npy(fixture("i8.npy")).data)).to.deep.equal([-3, 0, Math.pow(2, 40)]);
      expect(plx.npy(fixture("i8.npy"), { bigint: true }).data[2]).to.equal(BigInt(Math.pow(2, 40)));
      expect(Array.from(plx.npy(fixture("u1.npy")).data)).to.deep.equal([0, 7, 255]);
      expect(Array.from(plx.npy(fixture("bool.npy")).data)).to.deep.equal([1, 0, 1]);
      const f = plx.npy(fixture("fortran.npy"));
      expect(Array.from(f.data)).to.deep.equal([0, 1, 2, 3, 4, 5]);
      expect(f.get(1, 0)).to.equal(3);
      const s = plx.npy(fixture("scalar.npy"));
      expect(s.shape).to.deep.equal([]);
      expect(s.data[0]).to.equal(2.5);
      expect(() => plx.npy(new ArrayBuffer(16))).to.throw(/not a NumPy/);
    });

    it("should read Parquet files as rows", async function() {
      const rows = await plx.parquet(fixture("rows.parquet"));
      expect(rows).to.deep.equal([
        { layer: 0, accuracy: 0.52, label: "first" },
        { layer: 16, accuracy: 0.88, label: "middle" },
        { layer: 32, accuracy: 0.66, label: "last" },
      ]);
      const some = await plx.parquet(fixture("rows.parquet"), { columns: ["label"] });
      expect(some.map(r => r.label)).to.deep.equal(["first", "middle", "last"]);
    });

    it("should load and parse by type, once per file", async function() {
      const json = "data:application/json," + encodeURIComponent('{"a": [1, 2]}');
      const first = plx.load(json, { type: "json" });
      expect(plx.load(json, { type: "json" })).to.equal(first);
      expect(await first).to.deep.equal({ a: [1, 2] });
      const csv = await plx.load("data:text/csv," + encodeURIComponent("layer,score\n0,0.5\n1,0.75"), { type: "csv" });
      expect(csv.map(r => r.score)).to.deep.equal([0.5, 0.75]);
    });
  });

  describe("error bars, ranked tokens and draggable numbers", function() {
    const { JSDOM } = require("jsdom");
    const page = () => new JSDOM("<!doctype html><div id='mount'></div>").window.document;

    it("should draw intervals as plxviz's whiskers, or as round lines", function() {
      const document = page();
      const c = plx.chart(document.getElementById("mount"), { width: 300, height: 200 });
      c.x.domain([0, 10]);
      c.y.domain([0, 1]);
      const bars = plx.errorBars(c, [[5, 0.4, 0.6], [7, null, 0.5]]);
      expect(bars.size()).to.equal(1);
      const x = c.x(5), a = c.y(0.4), b = c.y(0.6);
      expect(bars.attr("d")).to.equal("M" + x + "," + a + "V" + b + "M" + (x - 4) + "," + a + "H" + (x + 4) +
        "M" + (x - 4) + "," + b + "H" + (x + 4));
      expect([bars.attr("stroke"), bars.attr("stroke-width"), bars.attr("stroke-linecap")]).to.deep.equal(["#111411", "1.2", "butt"]);
      const round = plx.errorBars(c, [[0.5, 2, 8]], {
        horizontal: true, y: d => c.y(d[0]), lo: d => c.x(d[1]), hi: d => c.x(d[2]), color: "gold", width: 2.2, cap: 0,
      });
      expect(round.attr("d")).to.equal("M" + c.x(2) + "," + c.y(0.5) + "H" + c.x(8));
      expect([round.attr("stroke"), round.attr("stroke-linecap")]).to.deep.equal(["#A37F1F", "round"]);
    });

    it("should rank tokens and colour them as plxviz's bar charts do", function() {
      const document = page();
      const list = plx.topk(document.getElementById("mount"), [[" a", 0.1], [" b", 0.6], [" c", 0.3]],
        { k: 2, colors: { " b": "second" }, title: "Layer 16" });
      const read = cls => [].map.call(list.node.querySelectorAll(cls), el => el.textContent);
      expect(read(".plx-topk__title")).to.deep.equal(["Layer 16"]);
      expect(read(".plx-topk__token")).to.deep.equal(["\u00b7b", "\u00b7c"]);
      expect(read(".plx-topk__value")).to.deep.equal(["60%", "30%"]);
      const fills = [].map.call(list.node.querySelectorAll(".plx-topk__fill"), el => el.style.backgroundColor);
      expect(fills).to.deep.equal(["rgb(85, 126, 152)", "rgb(190, 197, 191)"]);
      expect(list.node.querySelector(".plx-topk__row").classList.contains("is-highlight")).to.be.true;
      list.update([[" c", 0.9], [" d", 0.05]]);
      expect(read(".plx-topk__token")).to.deep.equal(["\u00b7c", "\u00b7d"]);
      expect(read(".plx-topk__rank")).to.deep.equal(["1", "2"]);
    });

    it("should change a draggable number with the keyboard, within its limits", function(done) {
      const document = page();
      const window = document.defaultView;
      const el = document.createElement("span");
      document.body.appendChild(el);
      const s = plx.state({ n: 5 });
      plx.dragNumber(el, { state: s, key: "n", min: 0, max: 10, label: "Layer" });
      expect([el.textContent, el.getAttribute("role"), el.getAttribute("aria-valuemax")]).to.deep.equal(["5", "slider", "10"]);
      const press = key => el.dispatchEvent(new window.KeyboardEvent("keydown", { key, bubbles: true }));
      press("ArrowRight");
      expect(s.get("n")).to.equal(6);
      press("PageUp");
      expect(s.get("n")).to.equal(10);
      press("Home");
      press("ArrowDown");
      expect(s.get("n")).to.equal(0);
      setTimeout(() => {
        expect([el.textContent, el.getAttribute("aria-valuenow")]).to.deep.equal(["0", "0"]);
        done();
      }, 20);
    });
  });

  describe("tokens and state", function() {
    it("should show tokens' spaces and breaks", function() {
      expect(plx.token(" the\n")).to.equal("·the↵");
      expect(plx.token("\tx")).to.equal("→x");
    });

    it("should share state and report changes once", function(done) {
      const s = plx.state({ layer: 1 });
      const seen = [];
      s.on(v => seen.push(v.layer));
      s.set({ layer: 2 }).set({ layer: 3 }).set({ layer: 3 });
      setTimeout(() => {
        expect(seen).to.deep.equal([1, 3]);
        expect(s.get("layer")).to.equal(3);
        done();
      }, 20);
    });
  });
});
