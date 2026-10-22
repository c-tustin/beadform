# Routes through existing joints

The route search now retains the last bead and hole exit when it crosses an existing virtual joint. It penalizes straight approaches that intersect already-built nominal bead envelopes, and uses that penalty when choosing an attachment or face-loop route. Cached approach checks are cleared whenever a new bead is added or an unbuilt subtree moves. Passage limits, attachment span limits, and bead geometry are unchanged.

## Paired comparison

The same 32 authored synthetic scenes were built at both detail settings and both line diameters: 128 configurations. The previous published router is preserved in `training/fixtures/continuous-before-hole-routing.js`.

- All 128 compile, preserve bead IDs, materials, colors, centers, and stitch schedules, and have no detected cross-part bead overlaps.
- Nominal straight-path flags fall from 47 to 4; all remaining flags are between parts.
- Inter-bead connections increase from 40,844 to 40,909; aggregate planned working lengths fall from 139 to 138.
- Every endpoint has a candidate weave-in route: 276 of 276. All assembly passage budgets remain valid. These candidates are not complete, physically tested finishes.

## Remaining work

The coarse whale with 0.20 mm line has one flagged approach into the tail anchor. The coarse cactus with 0.25 mm line has one flagged positioning connection through an older joint. The coarse robot with 0.25 mm line has two flagged return crossings at the left-arm attachment. These diagnostics stay visible; the planner does not discard beads or raise passage limits to remove them.

Real needle access, curved thread, tension, joint strength, and secure finishing still need physical samples. This is a deterministic routing improvement, separate from the Qwen catalog-selection experiment. No paid compute or model run was needed.
