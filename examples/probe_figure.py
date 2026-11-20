"""Renders probe-light.png and probe-dark.png for index.html with plxviz,
Parallax's chart library (https://github.com/parallx-ai/plxviz).

    uv run --with "viz @ git+https://github.com/parallx-ai/plxviz" python probe_figure.py
"""
import viz

layers = list(range(0, 33, 4))
series = {
    "Linear probe": [52, 58, 69, 81, 88, 86, 79, 71, 66],
    "Shuffled labels": [50, 51, 50, 52, 51, 50, 52, 51, 50],
}
viz.set_roles(control="Shuffled labels", intervention="Linear probe")

for theme in ("light", "dark"):
    viz.set_defaults(theme=theme)
    viz.line(series, x=layers, xlabel="Layer", ylabel="Accuracy (%)",
             title="A linear probe reads the concept best from the middle layers",
             subtitle="Example data").save(f"probe-{theme}.png")
