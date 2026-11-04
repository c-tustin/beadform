# Qwen stitch selection + pattern recipes (free pilot)

This changes Qwen LoRA weights for a **new task**, rather than changing the earlier catalog adapter. The first scope is one flat swatch: peyote, brick, ladder, RAW or square stitch. A recipe specifies technique and dimensions; deterministic code produces the bead chart, thread operations and passage ledger.

**175 synthetic training examples; 22 development and 31 frozen challenge examples.** Positive recipe dimensions do not cross splits. Templates are synthetic and repetitive, so scores are not independent real-user validation. No physical-success labels or copied project patterns are used.

Use a free T4 GPU. Run setup, connect Drive if asked, then run training. No paid resources or quota bypass. Saves under `MyDrive/Beadform-free-qwen/runs/stitch-program-v1`, preserving earlier adapters. Both base and adapter predictions are compiled and compared. No automatic deployment.

These flat swatch routes exclude finishing and do not yet generate complete 3D subjects, spheres, tubes, mixed-stitch parts or arbitrary joints. The five-pass preference is checked for assembly; missing finishes stay explicitly flagged.

## Compile an actual draft

Run from the repository root with Node.js. The JSON output contains every pickup, bead reuse and brick thread-bridge action, plus an assembly passage ledger:

```sh
echo '{"stitch":"brick","shape":"triangle","width":6,"rows":4}' | node stitch-programs.mjs
```

Add `--svg` to produce a bead-placement chart. The SVG is not a complete thread diagram; the JSON steps supply the construction order. Brick rectangles/narrowing triangles and single ladder strips are new experimental generators. Flat peyote, RAW and square use the existing flat engine. The model never invents bead IDs or counts.

## Use the trained weights after completion

In the same free Colab GPU runtime, generate a fresh recipe and compile its bead chart, exact operations and assembly ledger:

```sh
python training/generate_stitch_pattern.py --adapter /content/drive/MyDrive/Beadform-free-qwen/runs/stitch-program-v1/adapter --prompt "A triangular flat wing worked through thread bridges, six foundation beads and four rows total" --output /content/drive/MyDrive/Beadform-free-qwen/generated/brick-wing-01
```

Choose a new output folder each time. Unsupported or missing specifications return a clarification result, not a substitute design. Generated requests remain in your output folder and are not automatically published or added to training. This script requires the completed new adapter; earlier catalog adapters have a different task.

## Try an image reference

**New image-trained continuation:** [read the completed image experiment and its failures](../results/image-stitch-v1/README.md). It fixes the known triangle regression and improves synthetic image recipes, but rejection of unsupported inputs is weaker. The following describes the earlier text-only adapter and its original upload path; use the new experiment's interface to try the separately trained image adapter.

The try-it interface now accepts an optional PNG, JPEG or WebP (up to 10 MB and 20 megapixels) plus your text dimensions. The frozen Qwen base reads the outline and structure through its vision processor, then the text-trained stitch adapter receives that uncertain visual description plus your dimensions. Code still computes the resulting flat chart and passage ledger. Use a clear image of one small flat shape. The pilot does not trace arbitrary silhouettes, reproduce image colors, or generate whole 3D objects.

For the CLI, add `--image /content/reference.png` to the inference command above. Bead dimensions must still be in the text; image scale is never a reliable bead measurement. Unsupported inputs should request clarification; review every result; the separate image experiment now records this adapter's image failures.

**Live integration finding (2026-11-03):** a simple authored solid triangle was correctly read as `triangle` / `solid` by the frozen vision model, but the recipe adapter returned `unknown` despite text supplying six foundation beads and four rows. Direct multimodal input and several text handoff variations declined this same request. This is a known failure, not a passing image benchmark. Image upload and vision reading work; reliable image-to-pattern generation remains unfinished. Preserve these failures when building image-conditioned training and a separate evaluation set; do not automatically label declined or generated examples as correct.

**Original adapter:** this adapter was trained on text only, with zero image training examples. It has now been evaluated as the baseline in the separate image experiment. Its earlier text scores do not measure image accuracy. The original upload feature did not change its weights; the new image-trained continuation is saved separately. Real-photo and physical validation are still needed.

Uploaded images are processed on the connected free Colab GPU, resized to at most 896 pixels per side, and saved as `reference.png`. This reference and generation metadata stay with the output in your Drive; neither uploads nor generated results are automatically published to GitHub or used as training labels. For CLI inputs, the original file is not modified.

The interactive UI is in `training/colab_stitch_try.py`. After GPU, Drive and dependency setup, run it with `%run /content/beadform-stitch-try/training/colab_stitch_try.py`. See the inference-only notebook `training/colab_stitch_try.ipynb` for setup; it never reruns training. Source reference: [official Qwen3-VL image-input documentation](https://huggingface.co/docs/transformers/model_doc/qwen3_vl).

## Meaning of the five-pass preference

For new 3D parts projects, 11/0 round seed beads and 0.20 mm thread are now the default. The planner tries a five-pass search budget first, including available proposed finishing routes. It can fall back to the earlier eight-pass engineering budget if necessary; every bead above five is reported as a review exception in the interface, text/print notes and construction export. This is a soft preference, not a certified hole capacity. A different needle, bead finish, knot or extra reinforcement can require more space. Existing saved projects retain their recorded thread size, and changed routes reset guide progress through the existing route-key mechanism.

For the new flat-recipe pilot, the exact ledger covers assembly only. Starting and finishing remain explicitly unplanned. Training labels never call such a pattern physically successful just because its assembly ledger is at most five.

## Training and evaluation

[Open the free notebook](https://colab.research.google.com/github/c-tustin/beadform/blob/main/training/colab_stitch_program.ipynb).

The run starts from the same frozen Qwen3-VL-2B-Instruct base revision used in prior runs, with a new q/v language-attention LoRA adapter. Two epochs, seed 42, batch one and gradient accumulation eight. Dependencies are pinned to the working recipe; Colab PyTorch is retained. Source/model/data hashes, environments, checkpoints and all predictions are saved. A resume rejects changed source/data/configuration, and completed results are preserved.

The base and new adapter see the same system rules and frozen evaluation requests. Report stitch accuracy, exact recipe accuracy, actual compilation and assembly ledger results separately. A valid JSON object is not sufficient. The challenge is not used for training, epoch selection or automatic promotion.

This does not retrain the older catalog selector, deploy an adapter into Ollama, or make the 3D app generate brick/ladder parts automatically. It is the first bounded weight-training experiment toward that capability. Add more shaped generators and independently written requests before broadening the task; physically sample the routes and joints before claiming beadability.

Technique references: [Beadworkers Guild brick/ladder](https://beadworkersguild.com/wp-content/uploads/2021/04/Brick-ladder-stitch-1.pdf) and [peyote](https://beadworkersguild.com/wp-content/uploads/2021/04/Peyote-stitch-basic-instructions-1.pdf). These are reading references; training data and code are authored locally, with no copied tutorials or project charts. QLoRA approach: [official PEFT quantization guide](https://huggingface.co/docs/peft/developer_guides/quantization).
