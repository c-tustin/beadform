# Beadform

Turn an idea into a draft 3D beadwork pattern, with a preview, bead list and step-by-step thread charts.

**Still in development:** patterns need hands-on testing. The preview and digital checks do not prove that a piece will hold its shape or that its joints and finishes will be secure.

## Try it for free

1. [Download the latest development version](https://github.com/c-tustin/beadform/archive/refs/heads/runpod-training-guide.zip) and unzip it.
2. Open **beadform.html** in a desktop browser.
3. Choose **try an animal** to open a starter.
4. Use **try another example** to explore the 32 draft designs, including a castle, flower, robot and guitar.

Examples work without an AI model, API key or paid service. Fish is excluded from the added example catalog.

## What you can do

- Rotate and zoom the 3D preview.
- Follow the pattern charts or replay the thread movements.
- See bead quantities and a supply checklist.
- Save an editable project and open it again later.
- Export a printable guide, diagrams, bead list or text instructions.

Start small: the practice menu includes a **12-bead CRAW cube**.

## How the patterns work

| Technique | Used for |
| --- | --- |
| **CRAW** — cubic right-angle weave | Blocky shapes and structure; neighboring cubes share edge beads. |
| **Peyote** | Rounded forms and surface shaping. |
| **Panels and strands** | Flat details and flexible appendages. |

The planner computes bead counts and thread routes. AI experiments focus on interpreting requests and choosing designs.

## Optional AI setup

To try local text and image interpretation, follow the [Qwen setup guide](https://github.com/c-tustin/beadform/blob/runpod-training-guide/qwen-and-lora.md), then run:

```sh
node launch-qwen.mjs
```

This needs Node.js and a local Ollama model. The built-in examples are the easiest place to start.

## Free model training

We are preparing Qwen to choose from the supported drafts and reject unsupported requests.

- **128 training requests** and **48 development requests** are ready.
- The latest attempt could not start because Colab's free GPU usage limit was reached.
- The earlier geometry-training experiment produced no usable patterns. Its adapter is not deployed.

[Open the free Colab notebook](https://colab.research.google.com/github/c-tustin/beadform/blob/runpod-training-guide/training/colab_catalog_selector.ipynb) · [Read the training guide](https://github.com/c-tustin/beadform/blob/runpod-training-guide/training/catalog-selector-v1/README.md)

## More detail

- [Latest development files](https://github.com/c-tustin/beadform/tree/runpod-training-guide) — current pattern and training work.
- [Pattern quality and results](https://github.com/c-tustin/beadform/blob/runpod-training-guide/training/PATTERN_QUALITY.md) — what was checked and what still needs work.
- [Development history](docs/development-history.md) — the previous detailed README, kept for reference. Some instructions are outdated.

For contributors: edit the source modules and run `python3 build.py` to rebuild `beadform.html`.
