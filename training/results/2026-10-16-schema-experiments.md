# Free Colab schema experiments — 2026-10-16

Model: `Qwen/Qwen3-VL-2B-Instruct`, base model with no adapter. Free Tesla T4, 4-bit inference, greedy generation, 4096 maximum new tokens. The evaluation families are frog, mushroom, sailboat, and cloud, selected from `approved-expanded.jsonl` and kept out of pilot training.

| Experiment | Raw schema-valid outputs | Repairs needed |
|---|---:|---:|
| Earlier unconstrained pilot-03 base evaluation | 1/4 (25%) | Not applied |
| Schema constrained generation | 3/4 (75%) | 0 for passing outputs |
| Bounded schema constrained generation | 4/4 (100%) | 0 |

Bounded decoding limits title/name strings to 80 characters, notes to 240 characters, and parts to 1–18. Predictions are still scored against the original `scene-schema.json`. The unbounded frog repeated notes until generation ended with incomplete JSON. Bounded decoding forced a transition to the remaining scene fields and completed all four objects.

The published `2026-10-16-bounded-base.jsonl` contains the four raw strings, input prompts, IDs, and no repairs. These strings were fetched back from GitHub and independently validated with jsonschema: all four pass. Original full evaluation records and logs are in the saved Colab notebook output and the temporary runtime directory `/content/beadform-constrained-base-01`. Drive mounting failed with credential propagation errors during this experiment, so these predictions were published to GitHub instead of relying on temporary runtime storage.

Compatibility fixes: constrain Transformers to >=4.57.0,<5 for lm-format-enforcer 0.11, and use typed text blocks for system messages in both trainer and evaluator. The earlier run used a different dependency environment. The improvement is therefore evidence for the combined working configuration, not an isolated causal measurement of each change.

## Limits and next work

This is a four-example development result, not evidence of 100% generalization. These families have now informed debugging and should be treated as a regression/development set. Reserve new unseen families before making broader performance claims.

Schema validity does not establish subject fidelity or compiler/physical validity. The frog uses a generic color and one combined eye marking. The mushroom has a misleading title and weak proportions. The sailboat contains repeated/poorly positioned geometry and cut regions. The cloud repeats raindrop geometry. Notes can end mid-sentence at the imposed character limit. None of these generated predictions has been approved as a training target or physically built.

Next: evaluate both saved adapters with `--bounded` once Drive credentials work; compare recognizability and compiler validity separately; improve concise target serialization and inference instructions; test on new unseen families. Do not train on the four evaluation targets to inflate this score. No paid compute was used.

## Fresh twelve-prompt benchmark

The same bounded base-model configuration completed all twelve new original prompts on the free Tesla T4: **12/12 raw schema-valid (100%), no repairs**, process exit 0. No adapter or additional fine-tuning was used. Subjects: dog, cat, duck, lobster, owl, hedgehog, dragon, lamp, chair, watering can, umbrella, and pineapple. Inputs are in `training/benchmarks/schema-fresh-12.jsonl`; predictions and summary are in `2026-10-16-fresh-12-bounded-base.jsonl` and `2026-10-16-fresh-12-summary.json`.

These prompts were reserved before this run and contain no target scenes. This broadens the structural evidence beyond the four regression examples, but twelve prompts are still a small sample. There is no matched unconstrained run on these twelve prompts, so this is not a measured twelve-prompt improvement over an unconstrained baseline.

A manual inspection shows why structural validity is insufficient: the lobster is only a body; the chair is only a box; the pineapple omits its green crown. Owl eyes occupy identical coordinates, and the dragon's parts are all centered at the origin. Several capsules have identical start/end coordinates, and some requested additive parts use the cut role. Many notes end mid-sentence. These predictions remain unapproved evaluation outputs, not training labels or usable bead patterns.

The standalone `training/colab_schema_benchmark.ipynb` reproduces this schema benchmark without Drive authentication and offers a ZIP download. Saved-adapter comparisons remain pending Drive access. Next work should prioritize corrected geometry, requested-feature coverage, and compiler/render review alongside schema validity.
