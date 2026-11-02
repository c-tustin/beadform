# Choosing closer joint anchors

The previous router weighted each positioning bead passage at 100 and center distance at 1.5 per mm, so a shorter positioning route could win over much closer attachment beads. The new planner builds two deterministic candidates: the original distance preference and a closer-joint preference.

The closer candidate adds 250 times squared excess center separation to the attachment cost. Excess means distance beyond the two nominal bead radii plus a 0.2 mm allowance. This is a ranking heuristic, not a measured air gap or joint-strength model.

## Whole-plan selection

The planner compares the resulting actual plans. It rejects a candidate that changes colored bead inventory or placement, adds approach flags or unresolved ends, exceeds passage budgets, removes attachment loops, or worsens requested arm-height error. With equal access and endpoint coverage, it also rejects a larger widest joint. Improved access or endpoint coverage has priority over the gap score.

The score is mean squared excess separation, with 0.1 mm² per additional working length relative to the baseline (a reduction in lengths earns the corresponding credit). The two weights and the 0.2 mm allowance are explicit heuristics. They are not learned physical-success scores. If a candidate cannot compile, the other compiled candidate remains available. Exported construction graphs retain the selection metrics and reasons.

## Paired digital results

The frozen preceding router is in `training/fixtures/continuous-before-gap-preference.js`. On the existing 32 authored synthetic scenes at two detail settings and two line diameters (128 configurations):

- All 128 compile with identical colored bead inventory and positions. No configuration loses an attachment loop; total pairs remain 827, with 267 two-pair joints.
- Mean anchor-center separation falls from 2.779 mm to 2.519 mm. Separations above 3.5 mm fall from 119 to 37.
- Mean excess separation falls from 0.581 mm to 0.325 mm. Ninety-five configurations reduce mean squared excess; no configuration's widest joint increases. The batch maximum falls from 3.792 mm to 3.735 mm.
- Assembly flags, finishing flags, and detected cross-part bead overlaps remain zero; all 128 combined passage budgets pass. Mean arm-height error also decreases from 0.709 mm to 0.635 mm.
- Working lengths total 140 rather than 138. Turtle/coarse/0.25, sailboat/coarse/0.25, and bird/large/0.25 each add one length; ladybug/large/0.25 removes one. All 280 endpoints have candidate weave-in routes.
- All 280 finishing diagrams and 840 displayed passages pass parity and the existing symbol-spacing checks.

The turtle example keeps component positions fixed and changes the primary parent anchor from bead 20 to bead 21. Flipper bead 107 remains the child anchor. Center separation falls from 3.785 mm to 2.101 mm; the whole turtle uses two lengths instead of one. The SVG aligns the two pairs horizontally at the same scale and does not draw a thread route.

## Controls and integration

Six actual scene decisions check acceptance and fallback behavior, including the sailboat's wider-joint regression, the robot's pose regression, and a flower whose small distance gain does not justify another length. Six deliberately altered selector inputs check the individual geometry, loop-count, finishing, passage, and approach guards. An access-priority control verifies selection can favor fewer approach flags even without a gap-score improvement.

Twelve unreviewed robot arm-height diagnostics still pass and remain excluded from approved training data. All 128 project round trips pass. Focused prior-router imports archive old turtle/ladybug guide progress when routes change; unchanged whale/sailboat routes resume. On-screen, print, and text export functions agree in five controlled DOM cases, including the turtle's two-length plan. No real browser clicks, PDF pagination, or physical samples are verified by those controls.

The rebuilt HTML includes all 30 source/style modules and its 24 inline scripts parse. No additional model training, paid requests, physical-success labels, or manual deployment is introduced. Physical needle access, tension, secure finishes, and joint strength still require actual builds.
