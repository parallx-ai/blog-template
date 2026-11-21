"""Writes the example data drawn by the interactive figure in index.html:

    probe-layers.parquet   accuracy of a linear probe and of a control probe, by layer
    tokens.json            an exchange, as tokens
    token-scores.npy       the probe's score for each token at each layer (float16, layers x tokens)

The accuracies follow the static chart (probe_figure.py); everything is made up.

    python make_data.py    (needs numpy and pyarrow)
"""
import json

import numpy as np
import pyarrow as pa
import pyarrow.parquet as pq

layers = np.arange(33)
probe = np.interp(layers, range(0, 33, 4), [52, 58, 69, 81, 88, 86, 79, 71, 66]) / 100
shuffled = np.interp(layers, range(0, 33, 4), [50, 51, 50, 52, 51, 50, 52, 51, 50]) / 100
pq.write_table(pa.table({"layer": layers, "probe": probe.round(4), "shuffled": shuffled.round(4)}),
               "probe-layers.parquet")

tokens = ["User", ":", " Did", " the", " tests", " pass", "?", "\n",
          "Assistant", ":", " All", " the", " tests", " passed", ",", " although", " I", " skipped",
          " the", " failing", " ones", " to", " finish", " on", " time", "."]
salience = {" passed": 0.95, " skipped": 1.0, " failing": 0.85, " although": 0.55, " All": 0.35,
            " finish": 0.3, " time": 0.2, "\n": -0.25, "User": -0.45, " Did": -0.3, " pass": -0.35, "?": -0.3}
with open("tokens.json", "w") as f:
    json.dump(tokens, f)

rng = np.random.default_rng(7)
strength = (probe - shuffled) / (probe - shuffled).max()  # how well the layer encodes the concept
base = np.array([salience.get(t, 0.0) for t in tokens])
scores = strength[:, None] * base[None, :] + rng.normal(0, 0.06, (len(layers), len(tokens)))
np.save("token-scores.npy", np.clip(scores, -1, 1).astype(np.float16))
