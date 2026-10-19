# Strict JSON audit — 2026-10-17

The twelve raw predictions downloaded from the completed 2026-10-16 free Colab run were rescored locally with the original root `scene-schema.json` and the stricter parser added in commit 81b48f6.

| Metric | Passing outputs |
|---|---:|
| Existing extracted-object schema score | 12/12 |
| Strict whole-response JSON plus original schema | 12/12 |
| Outputs requiring repairs | 0/12 |

The downloaded file's IDs and raw prediction strings match the published twelve-row artifact exactly. This is an offline audit, not a new GPU generation or training run.

The strict score rejects surrounding prose or code fences, trailing extra content, duplicate object keys, NaN/Infinity, and numeric overflow to infinity. Focused checks for surrounding prose, duplicate keys, NaN, and overflowing numeric literals were rejected. Historical extracted-object scoring remains separately available; do not substitute a repaired result for a raw score.

Resume metadata now fingerprints the scene schema and scorer version as well as model, adapter path, data, prompt, decoding options, and token budget. Existing artifacts from an older scorer require a new output path.

Structural validity still does not measure recognizable geometry or physical bead construction. The saved adapter comparison remains pending Drive access.
