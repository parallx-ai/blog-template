"""Writes the example data drawn by the interactive figure in index.html:

    probe-layers.parquet   accuracy of a linear probe and of a control probe by layer, with 95% intervals
    tokens.json            an exchange, as tokens
    token-scores.npy       the probe's score for each token at each layer (float16, layers x tokens)
    logit-lens.json        the likeliest next tokens after "Assistant: All the tests", read from each layer

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
strength = (probe - shuffled) / (probe - shuffled).max()  # how well the layer encodes the concept
spread = np.random.default_rng(11)  # 95% intervals over five seeds, narrower where the probe is weak
half_probe = 0.012 + 0.022 * strength + spread.uniform(0, 0.006, len(layers))
half_shuffled = 0.014 + spread.uniform(0, 0.006, len(layers))
pq.write_table(pa.table({
    "layer": layers,
    "probe": probe.round(4), "probe_lo": (probe - half_probe).round(4), "probe_hi": (probe + half_probe).round(4),
    "shuffled": shuffled.round(4), "shuffled_lo": (shuffled - half_shuffled).round(4),
    "shuffled_hi": (shuffled + half_shuffled).round(4),
}), "probe-layers.parquet")

tokens = ["User", ":", " Did", " the", " tests", " pass", "?", "\n",
          "Assistant", ":", " All", " the", " tests", " passed", ",", " although", " I", " skipped",
          " the", " failing", " ones", " to", " finish", " on", " time", "."]
salience = {" passed": 0.95, " skipped": 1.0, " failing": 0.85, " although": 0.55, " All": 0.35,
            " finish": 0.3, " time": 0.2, "\n": -0.25, "User": -0.45, " Did": -0.3, " pass": -0.35, "?": -0.3}
with open("tokens.json", "w") as f:
    json.dump(tokens, f)

rng = np.random.default_rng(7)
base = np.array([salience.get(t, 0.0) for t in tokens])
scores = strength[:, None] * base[None, :] + rng.normal(0, 0.06, (len(layers), len(tokens)))
np.save("token-scores.npy", np.clip(scores, -1, 1).astype(np.float16))

# A logit lens on the reply so far: early layers guess filler, the middle layers lean towards " failed",
# and the last layers say " passed".
bump = lambda centre, width: np.exp(-((layers - centre) / width) ** 2)
rise = lambda centre, width: 1 / (1 + np.exp(-(layers - centre) / width))
fade = 2.2 - 4.4 * layers / 32
logits = {
    " the": fade, ",": fade - 0.3, " of": fade - 0.5, " and": fade - 0.6, " in": fade - 0.8, ".": fade - 1.0,
    " failed": 3.1 * bump(18, 6) - 0.4, " broke": 1.6 * bump(17, 5) - 1.0, " ran": 1.1 * bump(13, 6) - 0.8,
    " passed": 4.6 * rise(25, 2.5) - 1.0, " were": 1.3 * rise(10, 4) - 0.2, " have": 0.7 * rise(12, 5) - 0.6,
    " are": 0.6 * rise(8, 5) - 0.7,
}
names = list(logits)
z = np.stack([logits[n] for n in names], axis=1)
z = np.concatenate([z, np.full((len(layers), 1), 1.4)], axis=1)  # the rest of the vocabulary
p = np.exp(z) / np.exp(z).sum(axis=1, keepdims=True)
top = [[[names[i], round(float(row[i]), 4)] for i in np.argsort(-row[:-1])[:8]] for row in p]
with open("logit-lens.json", "w") as f:
    json.dump({"context": ["Assistant", ":", " All", " the", " tests"], "layers": top}, f)
