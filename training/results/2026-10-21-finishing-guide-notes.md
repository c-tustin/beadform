# Readable finishing route drafts

The previous on-screen and printed finishing appendix listed bead IDs without a close-up. It now includes one schematic for each candidate thread end and an exact numbered list of passages. Each list identifies the existing tail, its starting bead and hole end, the bead and part for each passage, the inventory color number, and the entrance and exit sides. No new beads, new lines, knots, or securing passes are added.

A/B label the pictured hole ends. The route maps spread and rotate existing beads for readability; use the numbered assembled preview to locate the physical beads. Crossings in a schematic do not define a joint. Green dots mark entrances and a rose square marks the unsecured route end.

The same guide module supplies the on-screen appendix, print appendix, and detailed text export. Screen and print use separate SVG marker IDs. The HTML app is rebuilt with the new module.

## Evidence

- All 128 existing configurations produce 280 endpoint diagrams and 840 displayed passes. Each bead ID and A/B direction matches the computed finishing moves. Rendering leaves the construction graph and bead positions unchanged.
- The first placement-based sketch had two bead-symbol overlaps and 44 bead-number-label contacts with other symbols. A spread-out schematic layout removes those detected contacts: zero glyph overlaps and zero number-label contacts in the final audit. The checker does not prove every line or label is visually clear.
- Controlled execution of the actual parts-app functions confirms matching screen, print, and text output for frog, cactus, sailboat, and robot. It uses a DOM facade and does not verify real browser clicks, PDF pagination, downloads, or printer behavior.
- The rebuilt bundle contains all 30 current source/style modules and its 24 inline scripts parse.
- The rendered cactus working-end example was visually inspected. It uses detail 3, 0.25 mm line, and length 2: beads 114, 113, and 112. Its SVG is in `training/prototypes/2026-10-21-cactus-finishing-route.svg`.

## Remaining limits

These are instructions for candidate weave-in routes, not complete finishes. Real needle access, tension, knot choice, extra securing passes, and holding strength need physical samples. No physical-success labels, model training, paid resources, or manual deployment are introduced by this change.
