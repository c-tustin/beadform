# Bounded Qwen comparison — completion verified 2026-10-19

## Result

| Qwen3-VL-2B configuration | Fresh prompts | Strict JSON + original schema | Repairs |
|---|---:|---:|---:|
| Base, bounded decoding | 12 | 12/12 (100%) | 0 |
| pilot-02b LoRA, bounded decoding | 12 | 12/12 (100%) | 0 |
| pilot-03-expanded LoRA, bounded decoding | 12 | 12/12 (100%) | 0 |

All three use the same twelve prompt subjects and bounded schema configuration. Bounded decoding limits names/titles to 80 characters, notes to 240 characters and parts to 1–18, while scoring against the original scene schema. Free Tesla T4 resources were used; no paid compute was purchased.

**Use the bounded base model for the measured schema task.** The adapters tie its score and add loading complexity. This recommendation is limited to schema performance; this comparison does not rank recognizability, color fidelity, or physical construction quality.

## Evidence and provenance

The base raw predictions are published in [2026-10-16-fresh-12-bounded-base.jsonl](2026-10-16-fresh-12-bounded-base.jsonl). They matched the downloaded Colab artifact exactly and passed an independent local [strict JSON audit](2026-10-17-strict-json-audit.md).

Both saved adapter `summary.json` files were opened and read in Google Drive under:

`Beadform-free-qwen/runs/bounded-adapter-comparison-2026-10-17/{pilot-02b,pilot-03-expanded}/`

Each summary records twelve examples, twelve raw/strict/repaired passes, and pass rates of 1.0. [Published summary data](2026-10-19-bounded-adapter-summaries.json) transcribes those metrics with adapter labels. The original summary, predictions, metadata and run log files remain in those Drive folders. The prediction artifacts are approximately 34 KB and 37 KB. Browser downloads failed, so the adapter raw predictions have not been independently rescored locally or copied to GitHub in this audit. Do not imply that they have been.

The live notebook display stopped updating after eight first-adapter prompts. Subsequent runtime management showed no active sessions and Colab refused a new GPU due to usage limits. This did not establish when the old job stopped: Drive completion summaries show both adapters had finished. No duplicate evaluation was started. The recovery notebook is retained for reference and is unnecessary for this completed run.

## What improved

Earlier unconstrained development evaluation passed 1/4 base outputs and 2/4 pilot-02b adapter outputs. Schema-constrained base generation then passed 3/4. Bounded schema generation passed 4/4 development outputs and subsequently 12/12 fresh outputs, including strict whole-response validation. These are recorded experiments, not a causal estimate that fine-tuning alone produced the final gain: dependencies and decoding changed between some experiments.

The evaluator separately reports extracted-object, strict whole-response, and repaired validity. Strict parsing rejects surrounding text, duplicate keys, non-finite constants and overflowing numbers. Resume metadata fingerprints schema, data, system instructions, configuration and scorer version. The original schema was not loosened to raise the score.

## Limits

Twelve prompts are a small measured set; 100% here does not guarantee all future inputs. These subjects have now been inspected and should be treated as development/regression inputs. Reserve genuinely new families for future generalization claims. None of the generated outputs is automatically an approved training label.

The base compiler audit passed 11/12 scenes at detail 3 and 0.25 mm thread; the dragon failed an attachment constraint. Some compiler-passing scenes omit major requested features. See [compiler audit](2026-10-17-base-compiler-audit.md). Schema improvement is established; production-quality bead designs, physically tested joints and image-conditioned accuracy are separate unfinished work.

## Reproduce

Use [training/README.md](../README.md) for the free benchmark and adapter notebooks, score definitions and CLI commands. Download or save outputs to Drive before the free runtime expires. Honor usage limits and retry later when no free GPU is available.
