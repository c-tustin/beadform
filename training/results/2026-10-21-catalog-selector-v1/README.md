# Free Qwen catalog selector: completed

October 21, 2026 · free Colab Tesla T4 · Qwen3-VL-2B-Instruct · two-epoch QLoRA

The adapter improved selection on the 48 authored development requests, mainly by learning to reject unsupported requests. It is **not deployed**.

| Measurement | Base | Trained adapter |
| --- | ---: | ---: |
| Correct overall | 33/48 | 45/48 |
| Supported designs recognized | 32/32 | 30/32 |
| Requests correctly rejected | 1/16 | 15/16 |
| Fish rejected | 1/4 | 4/4 |
| Other unsupported subjects rejected | 0/4 | 4/4 |
| Combined subjects rejected | 0/4 | 3/4 |
| Ambiguous requests rejected | 0/4 | 4/4 |
| Valid JSON, with constrained decoding | 48/48 | 48/48 |

## Three remaining errors

- “A round-eared teddy animal.” → unknown; expected bear.
- “A heart-shaped strawberry with tiny seeds.” → unknown; expected strawberry.
- “Two separate designs, a frog and a turtle.” → frog; expected unknown.

The first two are regressions from the base model. Improved rejection has come with some false rejection of supported designs.

## What this does and does not show

These 128 training and 48 development requests are newly authored synthetic text. They were authored together and are not an independent generalization test. The adapter chooses from existing draft designs; it does not generate geometry, calculate beads or prove physical buildability. JSON was constrained to the catalog IDs and unknown, so format correctness is not evidence of unconstrained reliability.

Next, collect independently written requests and review failures before considering deployment. Test joints, finishes, hole fit and tension separately with actual beads.

## Reproducibility and evidence

- Source commit: `015eb303fb08a02fb87dd3e002b1f24824e89dcd`.
- Base model revision: `89644892e4d85e24eaac8bacfd4f463576704203`.
- 128 training requests, 48 development requests, 32 optimizer steps.
- Training time: 336.7314 seconds; average training loss: 0.2022579.
- Epoch-two validation loss: 0.0236327. Loss alone is not selection quality.
- [Comparison](comparison.json), [base predictions](base/predictions.jsonl), [adapter predictions](adapter/predictions.jsonl).
- [Source/data hashes](metadata.json), [model revision](model-revision.json), [environment](environment.json), [package versions](pip-freeze.txt), [training metrics](training-complete.json).

All 96 downloaded predictions were matched to the original development inputs and recounted. Recorded source hashes match the local files. Startup failures were fixed before the model run, without changing labels or prompts. The original October 20 GPU-limit status remains historical evidence.

Weights and resumable checkpoints are saved in `MyDrive/Beadform-free-qwen/runs/catalog-selector-v1/adapter`. This repository contains the experiment records, not the model weights. No paid compute, API calls, quota workarounds or automatic deployment were used.
