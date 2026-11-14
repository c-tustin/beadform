# Beadform local app draft

A private desktop-browser studio that turns a description or reference image into a draft beading guide using the installed Qwen3-VL 2B model and Beadform adapter.

## First version

1. Check the model connection at the top of the studio.
2. Describe a design, optionally add a PNG, JPEG or WebP reference, and choose flat or 3D.
3. Qwen selects a stitch recipe. For a new 3D design, a separate base-model pass proposes geometry.
4. The compiler computes beads and thread movements. The independent checker reports unsupported stitches, inconsistent dimensions and invalid routes as advisory findings. Compiled drafts remain available for preview and export.
5. Review the bead count, preview and checker findings; move through the thread guide and download the project data, SVG chart or text instructions.

The built-in 18-bead brick triangle opens without inference and is explicitly labeled as an example. It runs the same construction checker, without pretending that Qwen selected it.

## Run

Double-click `Start Local Beadform.command`, or run from the project folder:

```sh
node start-local-beadform.mjs
```

Open http://127.0.0.1:8198. Keep the terminal open. The launcher starts the installed local model server on port 8197 and studio on port 8198. Model weights, vision projector, trained adapter and runtime must already be installed under `.local-qwen`; the launcher does not download them. No cloud provider fallback is configured in this studio.

For UI exploration without starting the model:

```sh
node local-image-workbench.mjs
```

Click **Open sample pattern**. The connection panel will show the model as offline until it starts.

## Scope and next steps

Flat patterns are bounded stitch samples, and 3D uses the supported CRAW lattice compiler. The adapter was trained on flat stitches; 3D stitch selection remains experimental. Digital checks do not establish physical buildability. Starting, finishing, tension and needle clearance need physical samples.

JSON download currently preserves the computed project data for inspection; reopening and editing that download is a future feature. Further work: a visual palette editor, project library, finished-build feedback and packaging the server/runtime into a native launcher. Training and new stitch generators are separate work.
