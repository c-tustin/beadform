# Beadform

Turn an idea into a draft 3D beadwork pattern, with a preview, bead list and step-by-step thread charts.

**Still in development:** patterns need hands-on testing. The preview and digital checks do not prove that a piece will hold its shape or that its joints and finishes will be secure.

## Try it for free

1. [Download Beadform](https://github.com/c-tustin/beadform/archive/refs/heads/main.zip) and unzip it.
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

Text/image generation now consults an [editable stitch-selection guide](docs/stitch-selection.md) for peyote, brick, RAW, CRAW, ladder and other techniques. It compares each part’s shape and construction needs and explains the choice in notes. The guide distinguishes advice from stitches the compiler can actually generate.

## Optional AI setup

To try local text and image interpretation, follow the [Qwen setup guide](https://github.com/c-tustin/beadform/blob/main/qwen-and-lora.md), then run:

```sh
node launch-qwen.mjs
```

This needs Node.js and a local Ollama model. The built-in examples are the easiest place to start.

## Free model training

The new [image-trained flat-stitch experiment](training/results/image-stitch-v1/README.md) is complete: held-out synthetic image recipes improved from **12/40 to 26/40**, but unsupported-input rejection got worse. It remains experimental and is separate from the app's default model. [Try it in free Colab](https://colab.research.google.com/github/c-tustin/beadform/blob/main/training/colab_image_stitch_try.ipynb), including a built-in triangle reference. This two-cell notebook never retrains the model.

A new [stitch-selection and pattern-recipe pilot](training/stitch-program-v1/README.md) trains a separate Qwen adapter for flat peyote, brick, ladder, RAW and square drafts. It compiles recipes into counted routes; it is not yet a deployed or physically validated model.

New 11/0 parts projects default to **0.20 mm thread** and prefer **at most five passes per bead**, counting available finishing candidates. Exceptions above five are shown for review.

We are training Qwen to choose from the supported drafts and reject unsupported requests.

- The expanded run used **320 synthetic training requests**, **48 development requests**, and a separate **80-request synthetic set**.
- The latest free T4 catalog-selector run completed: **47/48 development requests correct** and **77/80** on the separate synthetic set. The first adapter also scored 77/80 on that set. It still makes mistakes and is not deployed.
- The earlier geometry-training experiment produced no usable patterns. Its adapter is not deployed.

[Open the free Colab notebook](https://colab.research.google.com/github/c-tustin/beadform/blob/main/training/colab_catalog_selector_v2.ipynb) · [Read the training guide](https://github.com/c-tustin/beadform/blob/main/training/catalog-selector-v2/README.md)

[See catalog-selector results and failures](https://github.com/c-tustin/beadform/blob/main/training/results/2026-10-22-catalog-selector-v2/README.md). These measure draft selection, not physical buildability.

## More detail

- [Project files](https://github.com/c-tustin/beadform/tree/main) — current pattern and training work on main.
- [Pattern quality and results](https://github.com/c-tustin/beadform/blob/main/training/PATTERN_QUALITY.md) — what was checked and what still needs work.
- [Development history](docs/development-history.md) — the previous detailed README, kept for reference. Some instructions are outdated.

For contributors: edit the source modules and run `python3 build.py` to rebuild matching `beadform.html` and `index.html` entry points.
