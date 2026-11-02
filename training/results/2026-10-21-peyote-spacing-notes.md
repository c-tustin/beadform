## Peyote spacing and finishing recovery — October 21, 2026

The peyote preview previously clustered pairs of beads at increases. A body round with 15 beads had a minimum center separation of 1.23 mm in the nominal illustration. The revised geometry places that same round uniformly, giving 2.45 mm minimum center separation at the same ring radius. The [ring comparison](../prototypes/2026-10-21-peyote-ring-spacing.png) is a single-round top view, not a stitch guide or physical sample.

The algorithm solves the angular offset that keeps every new bead inside the gap required by the existing anchor schedule. At decreases it uses the gap before the first anchor, rather than centering a new bead across the entire anchor group. A nominal packing step enlarges crowded rings and adjusts their vertical spacing. It preserves the original bounds' center, including the offset of open domes. Counts, increases, decreases, step-ups and pickup/pass sequences are unchanged across all 16 combinations of the four profiles, size and economy flags.

Every fitted template also checks a separating plane between each pair of oriented nominal bead envelopes. This gives at least 0.05 mm nominal clearance for the assumed 2 mm diameter and 1.3 mm longitudinal bead dimensions. It is a digital geometry property, not a measured clearance in beadwork. Actual bead dimensions, holes, thread curvature, tension, needle access and shaping remain unverified. The first prototype incorrectly recentered domes and broke two expanded-snail settings; preserving the original origin corrected those regressions. Intermediate reports are retained.

### Paired library results

| Same 128 configurations, same routing policy | Old peyote geometry | Fitted geometry |
| --- | ---: | ---: |
| Compiled | 128 | 128 |
| Nominal straight-path flags | 371 | 47 |
| Flags within parts | 321 | 0 |
| Flags between parts | 50 | 47 |
| Inter-bead connections | 40,889 | 40,844 |
| Working lengths across the full set | 139 | 139 |

All configurations preserve their part templates and bead IDs/counts. Bead positions deliberately change; painted details and silhouettes still need visual review. These are the same 32 inspected synthetic scenes at four settings, not 128 independent subjects. See the [paired comparison](2026-10-21-peyote-spacing-comparison-final.json) and [final path audit](2026-10-21-thread-access-peyote-final.json).

### Finishing regression and old projects

One expanded ladybug initially had only three candidate weave-in routes for four thread ends. The starting bead of its second length had consumed all six allowed assembly passages. A bounded retry now reserves one passage at an observed unresolved starting-tail bead and replans without increasing the passage limit or changing the stitch recipe. The ladybug uses five assembly passages at that bead and recovers all four candidates. This does not specify a knot or prove a secure finish.

The final [settings audit](2026-10-21-patterns-peyote-final.json) has 128/128 compiles, no detected cross-part overlaps, and candidates for every thread end, within the existing combined passage limit. It also reports zero crowded bead-glyph pairs across 2,861 charts. The [project audit](2026-10-21-projects-peyote-final.json) and [offline API fixtures](2026-10-21-api-peyote-final.json) pass all 128 settings. No live model calls were made.

Changed version-5 guides now retain their previous guide key, colors, settings and maker progress in `legacyProjectData`. The paired migration audit checks all 128 old projects: 24 identical routes resume; changed routes reset active progress while preserving the old data as reference. This does not provide a renderer for the archived old guide. The separate browser import attempt was interrupted and its tab is now missing; it is **not counted as a completed browser migration check**.

The actual browser frog showed 116 beads, seven parts, one working line and zero nominal flags, versus 12 flags before the geometry correction. Its [saved preview SVG](../prototypes/2026-10-21-frog-peyote-preview.svg) and [PNG rasterization](../prototypes/2026-10-21-frog-peyote-preview.png) are unreviewed digital drafts. No maker-completion or physical-success label was set.

All final report source fingerprints were checked against the current workspace after interruption and still match. This work adds no training labels or deployed adapter. Physical samples, secure finishes, the remaining 47 between-part path flags, better silhouettes and reliable learned decisions remain outstanding. The full goal remains incomplete.
