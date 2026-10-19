# Pattern quality work — 2026-10-19

This work measures positioning, requested features and digital construction separately from JSON formatting. No new physical build success is claimed.

## First compiler fixes

1. A zero direction vector could collapse a part's mesh. The compiler now uses a nonzero principal axis for its orientation.
2. A round eye bead or other non-extended strand-based part could be translated directly onto a parent bead because its attachment offset was multiplied by a zero vector. It now uses the parent-to-child direction when no endpoint direction exists.
3. A teapot lid could be interpreted as a strand. Lids now select the existing dome construction, and lid knobs prefer the lid as their parent. Existing part and joint constructions are reused; no new supposedly tested joint type was invented.

The standalone `beadform.html` was rebuilt from the corrected compiler source.

## Measured results

All measurements below use detail 3 and 0.25 mm thread. Clearance uses spherical envelopes around nominal bead diameters, with a 0.05 mm overlap tolerance. It is a conservative digital diagnostic: actual bead shape, hole direction, tension, flexible strand pose and manufacturing tolerance still require physical checks.

| Data | Compiler pass before → after | Cross-component clearance pass before → after |
|---|---:|---:|
| Twelve saved base-model outputs | 11/12 → 11/12 | 5/12 → 11/12 |
| Existing 32-example library | 32/32 → 32/32 | 28/32 → 30/32 |

An intermediate direction-only change exposed the teapot's incorrect lid attachment and temporarily gave 31/32 compiler passes. The lid/knob correction restored 32/32. The original, intermediate and final reports are retained rather than overwritten.

None of the twelve generated scenes passes every authored feature/pose check. Some missing features, such as absent chair legs or a pineapple crown, cannot be solved by moving existing parts. A painted-eye spacing proposal is recorded separately for the coincident owl eyes; it does not turn that incomplete owl into a good pattern.

Reports:

- [Original twelve-output audit](results/2026-10-19-pattern-quality-baseline.json)
- [Twelve-output direction fix](results/2026-10-19-pattern-quality-direction-fix.json)
- [Library original and intermediate measurements](results/2026-10-19-library-clearance-comparison.json)
- [Final library audit](results/2026-10-19-library-quality-final.json)

The [annotated benchmark](benchmarks/pattern-quality-12.jsonl) contains explicit minimum feature counts and distinct-position requirements. These are development prompts that have already been inspected. Passing them is not an independent recognizability judgment or proof of physical buildability. The evaluator refuses missing rows, duplicate IDs and mismatched prompts, so a favorable subset cannot silently become the denominator.

## Fine-tuning pilot prepared

`prepare_quality_pilot.cjs` filters existing approved scenes using the new digital checks. It leaves their target values and approval flags unchanged. The first subset has 27 training examples and three development holdout families: frog, mushroom and cloud. Cactus and sailboat are excluded because they still have nominal bead overlaps. The twelve pattern-quality benchmark families are absent from this training set.

The dataset and source fingerprints are in [quality-pilot-v1/manifest.json](quality-pilot-v1/manifest.json). This is a small text-only experiment, not new physically verified training data.

[Open the free quality pilot in Colab](https://colab.research.google.com/github/c-tustin/beadform/blob/runpod-training-guide/training/colab_quality_pilot.ipynb).

The notebook compares improved spatial instructions alone with a three-epoch QLoRA using the same instructions and benchmark. Target serialization can place geometry before notes. Checkpoints, raw predictions, strict schema scores and pattern-quality reports are saved to Drive. This notebook has been prepared; no new fine-tuning result is claimed yet. Use only an eligible free GPU and honor usage limits.

## Work still required

- Run the new prompted baseline and quality-filtered LoRA comparison.
- Improve missing-feature coverage and proportions, not just the spelling of part names.
- Resolve remaining cactus and sailboat overlap cases without extending exposed thread or lowering clearance thresholds.
- Measure assembly displacement and label/diagram crowding, then improve their layouts.
- Render and inspect candidate silhouettes and instructions.
- Physically build a small set with specified beads and line, recording joint strength, hole capacity, tension, gaps and corrections. Digital routing checks do not substitute for this evidence.

The goal remains active. No generated scene is newly labelled physically tested or approved merely because it passes these diagnostics.

## Completed follow-up: placement, diagrams and free LoRA

The sections above preserve the first measurements. The later changes and completed experiment supersede their pending-work status.

### Placement and instruction spacing

- Strand attachment searches reject colliding candidates. They may rotate a requested strand by at most 30 degrees; the largest measured change in the 32-scene library is 29.302 degrees. There is no fallback that accepts an overlap.
- Named strand tips attach to their corresponding stem. Sails attach to an earlier mast; a mast uses the existing supported tube construction. A small sail can use a four-bead panel. These change the sailboat from 31 to 57 beads.
- Dedicated eye beads retain their specified color when nearby painted markings are applied.
- The final library result is **32/32 compiler-valid and 32/32 without detected cross-component overlaps**, using the same detail, thread size and clearance tolerance as before. No scene has been physically tested by this work.
- Combined instruction maps now preserve bead spacing, wrap titles, use larger bead numbers and scroll horizontally where needed. Across 284 join/reposition diagrams, measured crowded glyph pairs fall from 2,915 to zero at 950 pixels rendered width. Minimum nominal glyph clearance is 10 pixels. This does not measure every label collision, thread crossing or readability concern.

Evidence: [final library](results/2026-10-19-library-quality-placement-final.json), [orientation changes](results/2026-10-19-placement-orientation.json), [diagram spacing](results/2026-10-19-diagram-spacing-comparison.json), [visual comparison](results/2026-10-19-spacing-preview.png). Intermediate placement-v2 through placement-v6 reports retain unsuccessful iterations, including the stricter direction cap that initially prevented sailboat compilation.

### Completed free Colab experiment: no usable generated patterns

The run used source commit `0d09d8a22f292ece1fff38d06459122d9bb15cd9`, Qwen3-VL-2B-Instruct in NF4 on a free Tesla T4, 27 training examples and three evaluation examples. The three-epoch LoRA completed 12 optimizer steps in about 503 seconds. Training loss was 0.626673 and final evaluation loss 0.478252. These loss values do not establish pattern quality.

| Same 12 development prompts | Strict JSON | Minimum scene checks | Compiler-valid | Clearance-valid |
|---|---:|---:|---:|---:|
| Base with quality instructions | 12/12 | 0/12 | 0/12 | 0/12 |
| New LoRA with quality instructions | 12/12 | 1/12 | 0/12 | 0/12 |

Both configurations repeated small coordinates and produced irrelevant, missing or duplicated features. The adapter is **not deployed or recommended**. Rescoring the same saved outputs with the latest compiler still gives zero compiler-valid patterns for both configurations. The compiler improvements cannot supply features that the model omitted.

All 24 [raw predictions](results/2026-10-19-quality-pilot-predictions.jsonl) are retained, with [base](results/2026-10-19-quality-base-current-compiler.json) and [adapter](results/2026-10-19-quality-adapter-current-compiler.json) audits. These are inspected development cases, not independent generalization evidence or training targets. Checkpoints remain in the user's Drive under `Beadform-free-qwen/runs/quality-pilot-v1`.

### Next model experiment and remaining work

The next probe restricts Qwen to semantic family selection, including unsupported-subject rejection. Its 15 original development prompts paraphrase twelve known families and include three unsupported or multiple-subject controls. It is not yet a complete planner: deterministic templates must exist and pass geometry checks before a family can be offered by the product. No semantic score should be reported as generated-pattern success.

A [single hand-authored dog prototype](prototypes/2026-10-19-dog.scene.json) demonstrates deterministic placement: 149 beads, nine solid parts, one working line, zero detected cross-component overlaps, and the specified minimum dog features. Its [guide](prototypes/2026-10-19-dog-guide.txt) is an unreviewed draft. It is not model output, an approved training target, a twelve-case benchmark result or proof of physical buildability.

Still required: inspect silhouettes and proportions across subjects; expand deterministic placements without weakening requested features; define supported design choices; evaluate semantic decisions and unsupported requests; account for finishing passes and thread access; physically sample joints, tension and bead-hole capacity. Collect corrections before training again. The full pattern-quality goal remains active.

## Semantic probe and three-view review

The free semantic-only Qwen probe completed on 15 development requests: **11/15 correct, 15/15 strict JSON, 0/3 unsupported controls rejected correctly**. It confused hedgehog with dog, dragonfly with dragon, galaxy with owl, and a cat-plus-dog composition with cat. This configuration is unsuitable for automatic planning. It was a base-model inference probe, not another fine-tuning run. See [raw decisions](results/2026-10-19-family-selector-predictions.jsonl) and [summary](results/2026-10-19-family-selector-summary.json).

Three orthographic views of the dog exposed a real face-placement error: nearest-center matching could put an eye on an ear. Painted facial features now prefer a named head, or a named body/torso if no head exists. Dedicated eye components remain protected. The dog has all three face landmarks on its head after this fix. The complete library still gives [32/32 compiler and clearance passes](results/2026-10-19-library-face-host-fix.json), with source fingerprints recorded in that report. No physical success is implied.

The [dog three-view preview](prototypes/2026-10-19-dog-preview.png) remains unapproved: proportions, splayed ears, line access and finishing need review. The sailboat's silhouette also remains poor despite its clearance improvement. Neither prototype is promoted to a training target. The new `render_prototype.py` renders saved nominal geometry consistently for further shape reviews.
