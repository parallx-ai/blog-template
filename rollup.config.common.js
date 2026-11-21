// Copyright 2018 The Distill Template Authors
// Modifications copyright 2026 Parallax: inline brand images, ship fonts,
// load plxviz's palette.
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

import fs from "fs";
import path from "path";
import resolve from "rollup-plugin-node-resolve";
import string from "rollup-plugin-string";
import commonjs from "rollup-plugin-commonjs";
import babel from '@rollup/plugin-babel';

// Brand images (src/assets/parallax/*.webp) are small, so they are bundled
// into template.v2.js as data URIs and the template stays a single file.
const DATA_URI_TYPES = { ".webp": "image/webp", ".png": "image/png" };

function dataURI() {
  return {
    name: "parallax-data-uri",
    load(id) {
      const type = DATA_URI_TYPES[path.extname(id)];
      if (!type) return null;
      const data = fs.readFileSync(id).toString("base64");
      return `export default "data:${type};base64,${data}";`;
    }
  };
}

// Inter is self-hosted: copy the font files next to the bundle (dist/fonts/),
// where src/helpers/fonts.js expects them.
function copyFonts({ from = "src/assets/fonts/inter", to = "dist/fonts" } = {}) {
  return {
    name: "parallax-copy-fonts",
    writeBundle() {
      fs.mkdirSync(to, { recursive: true });
      for (const file of fs.readdirSync(from)) {
        fs.copyFileSync(path.join(from, file), path.join(to, file));
      }
    }
  };
}

// plxviz's palette (src/figures/palette.json) gives the --plx-chart-* properties.
function json() {
  return {
    name: "parallax-json",
    transform(code, id) {
      if (path.extname(id) !== ".json") return null;
      return { code: "export default " + code.trim() + ";", map: { mappings: "" } };
    }
  };
}

const defaultConfig = {
  plugins: [
    json(),
    dataURI(),
    copyFonts(),
    resolve({
      jsnext: true,
      browser: true
    }),
    commonjs(),
    string({
      include: ["**/*.txt", "**/*.svg", "**/*.html", "**/*.css", "**/*.base64"]
    })
  ]
};

const componentsConfig = {
  input: "src/components.js",
  output: [{ format: "umd", name: "dl", file: "dist/template.v2.js", sourcemap: true }],
  plugins: [
    babel({
      "babelHelpers": "bundled",
      "targets": "defaults"
    })
  ]
};

const transformsConfig = {
  input: "src/transforms.js",
  output: [
    {
      format: "umd",
      name: "dl",
      file: "dist/transforms.v2.js",
      globals: { fs: "fs" },
      sourcemap: true,
    }
  ],
  external: ["fs"],
  plugins: [
    babel({
      "babelHelpers": "bundled",
      "targets": {
        "node": "current"
      }
    })
  ]
};

Object.assign(componentsConfig, defaultConfig);
Object.assign(transformsConfig, defaultConfig);

export default [componentsConfig, transformsConfig];
