# Arm attachment height

The old limb rule restricted both arms and legs to lower-body parent anchors. The robot source places its arm roots slightly above the torso center, but that rule forced its arm anchors below the requested region.

Arms now use their capsule starting point (or primitive center) to derive a height fraction within the source parent's vertical bounds. The planner maps that fraction onto the placed parent's bead-center bounds. The allowed band is the larger of 1.4 mm or one quarter of the parent's bead-center height, an explicit allowance for coarse bead levels. Side and depth restrictions still apply. Legs retain the existing lower-body rule; continuation tips still attach to the preceding strand tip.

The exported construction graph records the arm region and validates its numeric fields and actual anchor heights. Target heights are derived from current parent coordinates, so translations of the parent beadwork cannot leave an obsolete absolute target.

## Paired results

Across the same 32 authored synthetic scenes × two detail settings × two line diameters:

- All 128 configurations compile and retain identical colored bead inventory. The part mesh group sequences (the comparison's `identicalStitchSchedules` metric, including peyote pickup/pass groups) remain unchanged. Assembly positioning and attachment routes may change.
- All 40 arm anchors satisfy the requested height band, versus 32 before. The eight previous out-of-band anchors were the robot's two arms at all four settings.
- Mean absolute arm-anchor height error falls from 1.605 mm to 0.709 mm. The frog, cactus, and robot routes change; the octopus's actual final route already fits its requested region.
- Assembly path flags, finishing path flags, and detected cross-part bead overlaps remain zero. Combined passage budgets pass for all 128.
- Working lengths total 138 rather than 140: the coarse cactus and robot with 0.25 mm line each return to one working length. All 276 endpoints have candidate weave-in routes.
- The updated finishing guides contain 276 diagrams and 828 correctly directed displayed passages, with no detected bead-symbol overlaps or bead-number contacts with other symbols.

## Additional diagnostics

Twelve internal robot variations cover three arm-root heights, two detail settings, and two line diameters. All retain the requested low/middle/high attachment regions and pass nominal clearance, thread access, and combined passage checks. These variants are unreviewed diagnostics; none is added to approved training data or the public example library.

Four controls reject missing, nonfinite, altered, or out-of-band region claims. A whole-model translation confirms the target follows the parent. All 128 saved-project round trips and existing migration checks pass. Focused imports of actual preceding version-5 frog, cactus, and robot projects archive old progress and reset active replay; unchanged octopus and bear guides resume. This does not verify browser import dialogs.

The rebuilt HTML includes all 30 source/style modules and its 24 inline scripts parse. The robot SVG uses the actual parts-preview renderer and was visually inspected; its before/after panels use the same frontal orientation, each fitted independently.

## Limits

The height band is a computational pose constraint, not evidence of needle access, tension, rigidity, secure finishes, or physical buildability. No physical samples, physical-success labels, additional model training, paid resources, or manual deployment are introduced.
