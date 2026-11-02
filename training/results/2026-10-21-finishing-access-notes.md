# Finishing route access

Finishing candidates now screen each straight approach against every bead in the completed project. The search retains the previous physical bead and its hole exit across virtual connections. This matters because an assembly connection can become obstructed after nearby beadwork is added.

The returned candidate format is version 2 and includes a nominal-access audit. Validation replays the actual candidate moves and checks geometry again, independently of the cached search decisions or a supplied claim of zero conflicts. Combined assembly and finishing passage counts still include all proposed ends together.

## Paired comparison

Across the existing 32 authored synthetic scenes at both detail settings and line diameters (128 configurations):

- The preceding finisher proposed three obstructed straight approaches: the coarse cactus with 0.25 mm line, and the larger sailboat with either line diameter. The revised search replaces all three.
- All 280 thread ends retain a three-distinct-bead candidate. Finishing approach flags fall from 3 to 0.
- Assembly approach flags remain zero; all combined passage budgets remain valid.
- Planned working lengths remain 140 across the batch. All bead IDs, positions, materials, colors and stitch schedules remain identical. No cross-part bead overlaps are detected.
- Inter-bead finishing connections change from 819 to 818; no endpoint or required three-bead sequence is omitted.

Three focused controls confirm that the validator rejects the actual preceding obstructed candidates, including when a caller supplies a forged zero-conflict claim. The repaired candidates pass. All 128 saved-project round trips and existing migration checks pass.

## Rebuilt app

The checked-in `beadform.html` had not incorporated the preceding two source-only routing improvements. It has now been regenerated with `python3 build.py`, including those changes and this finishing change. A bundle audit verifies all 29 source/style modules (including the existing craft-asset substitution) and parses all 23 inline scripts. The rebuilt app loads in the browser and builds the garden frog example (116 beads, 7 parts, one working line, zero assembly flags). Detailed finishing-panel interaction could not be confirmed through browser automation; finishing routes are covered by the programmatic audits. No live deployment was performed.

## Limits

Three distinct beads remains an untested search heuristic. The nominal envelope check does not model needle length, actual hole sizes, curved thread, tension, knots, securing passes, or holding strength. No complete finish or physical sample is verified, and zero nominal flags must not be used as a physical-success training label. Qwen training is separate; no paid compute or additional GPU run was used.
