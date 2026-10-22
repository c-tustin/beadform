# Expanded Qwen catalog run — October 22, 2026

**Training finished.** Two epochs on a free Tesla T4, with 320 synthetic training requests. The new adapter is saved separately in Google Drive. It is not deployed.

| Model | Development (48) | Separate synthetic challenge (80) |
| --- | ---: | ---: |
| Base Qwen | 33/48 | 66/80 |
| First adapter (v1) | 45/48 | 77/80 |
| Expanded adapter (v2) | 47/48 | 77/80 |

V2 fixes the strawberry and separate frog/turtle development requests. It still rejects “A round-eared teddy animal.” On the separate set, both adapters make the same three mistakes: accepting a cup request as a teapot, three bunny ornaments as one bunny, and separate whale/pear designs as one whale. Fish is rejected in all four cases in each evaluation split by both adapters.

**The expanded run has not shown a better challenge score than v1.** Development wording was already known, and the 80 challenge requests are authored synthetic phrases with repeated templates. These scores do not establish real-user generalization or beadability. This model selects an existing draft; it does not calculate bead geometry or thread paths.

## What is saved

- [Comparison](comparison.json), every raw prediction, per-category summaries, source hashes and model revision.
- [Verification](verification.json): all 384 predictions reparsed against the frozen input rows, scores recomputed, and source hashes matched.
- [Training metrics](training-complete.json): two epochs, 805.3541 seconds of training (about 13.4 minutes, excluding model loading and evaluation).
- [Adapter checksums](adapter-file-sha256.json). Weights remain at `MyDrive/Beadform-free-qwen/runs/catalog-selector-v2/adapter`; no model weights are committed here. V1 stays separate.
- [Environment](environment.json) and [package versions](pip-freeze.txt).

Source revision: `1cc6120e2128e747c6997f18879753fde9ade5fb`.
Base model: `Qwen/Qwen3-VL-2B-Instruct`, revision `89644892e4d85e24eaac8bacfd4f463576704203`.
Recipe: fixed two epochs, seed 42, 4-bit QLoRA on language attention q/v projections, batch size one, gradient accumulation eight. No paid resources or automatic promotion.

The next evaluation needs independently written requests and explicit checks for negation, quantity and multiple subjects. Do not keep training against the same challenge and call it unseen. Physical samples are still needed to judge the actual bead patterns.
