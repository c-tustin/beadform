# Compiler audit of the twelve base-model outputs

The twelve saved raw scenes were parsed without repair and passed to `Parts.build(scene, {detail: 3, threadDiameter: 0.25})` using the current GitHub compiler files. This was a local CPU evaluation with Node; no paid service or additional generation was used.

- Schema: 12/12, including strict whole-response JSON.
- Current compiler checks: **11/12**.
- Dragon: compilation throws because no close attachment for wings to body fits the available hole space at 0.25 mm line.

See [per-scene results](2026-10-17-base-compiler-results.json). Compiler bead counts describe this specific compiler/configuration and are not proof of physical success.

A compiler pass does not check whether all requested features are present. For example, a one-box chair and an oval pineapple without its crown still pass. Do not use this audit to approve the predictions as training targets or claim recognizable, physically tested patterns. Reducing line thickness solely to obtain a passing count would not address subject fidelity, so the requested compiler configuration was kept fixed.

## Source fingerprints

Git blob SHAs used:

```json
{
  "shape-engine.js": "289289e6dc9899ea8b31eafa81faecdedc961bbf",
  "parts-engine.js": "8cda6edc85b14d470ce0f3816210404dfea6e2fa",
  "peyote-ball.js": "a071cc053b6fadd4281e727515be7579d6775277",
  "continuous-thread.js": "fd41e246bc09cc92424d767f653d64f1458745fa",
  "construction-graph.js": "362128ebadfa9aeecd4efde4ca62ffb7e28db774"
}
```

Saved-adapter schema comparison remains separate and is running with bounded decoding on the same twelve prompts.
