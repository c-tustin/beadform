# Final approach and separate attachment choices

The positioning search now includes the next bead's entrance when ranking arrival states. Reaching the right virtual junction can still leave the thread on the wrong side of a neighboring bead; the previous search stopped before checking that last approach. It now considers alternative arrivals, including a detour when already at the target junction.

Attachment selection also compares a separately started part when every continuous choice has a nominal obstruction. A separately started attachment needs two remaining passages in its parent anchor rather than three. This uses the existing, explicitly marked working-length mechanism and preserves reinforcement operations and passage limits. It does not omit an obstructed movement while pretending the same thread continues.

## Paired digital results

32 authored synthetic scenes at two detail settings and two line diameters give 128 configurations. The prior published router is frozen in `training/fixtures/continuous-before-entry-routing.js`.

- All 128 compile with identical bead inventory, materials, colors, centers, and stitch schedules. No detected cross-part bead overlaps; all assembly passage budgets remain valid.
- Nominal straight inter-bead path flags: **4 before, 0 after**. All four previously flagged connections were between parts.
- Inter-bead connections: 40,909 before, 40,900 after.
- Planned working lengths across the batch: **138 before, 140 after**. The coarse cactus and coarse robot with 0.25 mm line each use one additional length.
- Candidate weave-in routes: **280 of 280 endpoints** after the change, versus 276 of 276 before. This is a tradeoff: the two additional lengths introduce four additional ends to secure. Complete finishes are not verified.

The coarse whale with 0.20 mm line uses a different final approach without adding a working length. No bead positions were changed to obtain the result.

## Limits and next evidence

These are the existing synthetic designs, not independent user examples or physical samples. The geometric check uses oriented nominal bead envelopes and straight thread segments. Needle length, actual hole size, curved thread, tension, joint strength, and secure finishes remain unverified. Zero diagnostic flags do not mean these patterns have been proven beadable. Physical builds and outcome photos are still needed before using success labels to train a buildability scorer.

No additional GPU training or paid resources were used. The Qwen catalog-selection experiment remains separate.
