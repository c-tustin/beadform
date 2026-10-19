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
