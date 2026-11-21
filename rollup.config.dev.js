// Copyright 2018 The Distill Template Authors
// Modifications copyright 2026 Parallax: also watch the figures toolkit.
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

import configs from "./rollup.config.common";
import serve from "rollup-plugin-serve";
import { spawn } from "child_process";

const [componentsConfig, transformsConfig] = configs;

// The figures toolkit is built by esbuild (bin/build-figures.js); watch it too.
let figuresWatch = null;
function watchFigures() {
  return {
    name: "parallax-watch-figures",
    buildStart() {
      if (figuresWatch) return;
      figuresWatch = spawn(process.execPath, ["bin/build-figures.js", "--watch"], { stdio: "inherit" });
      process.on("exit", () => figuresWatch.kill());
    }
  };
}

componentsConfig.plugins.push(watchFigures());

componentsConfig.plugins.push(
  serve({
    open: true,
    openPage: "/index.html",
    contentBase: ["dist", "examples"],
    headers: {
      "Access-Control-Allow-Origin": "*"
    },
    port: 8088
  })
);

export default [componentsConfig, transformsConfig];
