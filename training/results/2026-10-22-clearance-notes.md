# Recompute cross-part bead clearance

The parts and construction validators did not independently inspect spacing between beads in different parts. Placement routines and the separate quality inspector did check this, but the validators could still accept a model whose coordinates or dimensions were subsequently altered.

A shared geometry routine now recomputes cross-part clearance directly from node positions and nominal bead diameters. Both validators use it. It checks finite three-dimensional coordinates, positive nominal diameter, and a declared component for every bead. Absent/null diameters retain the existing 2 mm seed default; explicit non-finite or non-positive diameters are rejected. Cross-part bead envelopes are conservative spheres; penetration greater than 0.05 mm plus a 1e-8 mm numerical allowance is rejected. Within-part geometry is outside this guard and retains its template checks.

The construction validator rechecks the model rather than trusting a supplied clearance flag. The exported clearance report comes from that fresh check, including when the parts-validation cache is stale. The report counts all cross-part pairs even when its example list is capped or disabled.

## Evidence

Three deliberately altered computed frog models were accepted by both preceding validators: an eye bead moved into its body anchor, a non-finite eye position, and a zero eye diameter. Both updated validators reject all three, including a graph that still claims zero overlaps. These are controlled corruption cases, not naturally generated examples of failures.

Tolerance-boundary controls check 0.049, 0.050, and 0.051 mm nominal penetration. An example-limit control verifies that all three overlaps in a three-part cluster are counted when only one example is retained. A stale-cache control confirms exports reflect the actual current geometry.

All 128 existing configurations pass the new guard. It examines 684,920 cross-part bead pairs across that batch and agrees with the independent quality inspector. Twelve compressed/expanded position variants of flower, cloud, bear, and castle also remain clear. The variants are unreviewed internal diagnostics and are not added to approved training data.

The paired preceding/current validator audit preserves bead positions, hole axes, materials, colors and guide keys in all 128 configurations. No existing guide is rerouted by this change. Assembly and finishing approach flags remain zero; all 280 finishing diagrams and 840 displayed passes retain their existing parity and spacing checks.

All 128 saved-project round trips pass against the frozen rebuilt HTML. Offline API fixtures check all 128 existing configurations with zero live model calls. The bundle audit verifies all 30 current source/style modules and parses 24 inline scripts. These checks do not verify browser interactions or physical construction.

## Limits

Spherical envelopes are a conservative planning rule, not an exact intersection test for oriented beads. Clearance does not establish needle access, tension, rigidity, knot security or holding strength. No physical samples, physical-success labels, new model training, paid provider calls or manual deployment are introduced.
