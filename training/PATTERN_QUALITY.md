# Pattern quality work — 2026-10-19

This work measures positioning, requested features and digital construction separately from JSON formatting. No new physical build success is claimed.

## First compiler fixes

1. A zero direction vector could collapse a part's mesh. The compiler now uses a nonzero principal axis for its orientation.
2. A round eye bead or other non-extended strand-based part could be translated directly onto a parent bead because its attachment offset was multiplied by a zero vector. It now uses the parent-to-child direction when no endpoint direction exists.
3. A teapot lid could be interpreted as a strand. Lids now select the existing dome construction, and lid knobs prefer the lid as their parent. Existing part and joint constructions are reused; no new supposedly tested joint type was invented.

The standalone `beadform.html` was rebuilt from the corrected compiler source.

## Measured results

All measurements below use detail 3 and 0.25 mm thread. Clearance uses spherical envelopes around nominal bead diameters, with a 0.05 mm overlap tolerance. It is a conservative digital diagnostic: actual bead shape, hole direction, tension, flexible strand pose and manufacturing tolerance still require physical checks.

| Data | Compiler pass before → after | Cross-component clearance pass before → after |
|---|---:|---:|
| Twelve saved base-model outputs | 11/12 → 11/12 | 5/12 → 11/12 |
| Existing 32-example library | 32/32 → 32/32 | 28/32 → 30/32 |

An intermediate direction-only change exposed the teapot's incorrect lid attachment and temporarily gave 31/32 compiler passes. The lid/knob correction restored 32/32. The original, intermediate and final reports are retained rather than overwritten.

None of the twelve generated scenes passes every authored feature/pose check. Some missing features, such as absent chair legs or a pineapple crown, cannot be solved by moving existing parts. A painted-eye spacing proposal is recorded separately for the coincident owl eyes; it does not turn that incomplete owl into a good pattern.

Reports:

- [Original twelve-output audit](results/2026-10-19-pattern-quality-baseline.json)
- [Twelve-output direction fix](results/2026-10-19-pattern-quality-direction-fix.json)
- [Library original and intermediate measurements](results/2026-10-19-library-clearance-comparison.json)
- [Final library audit](results/2026-10-19-library-quality-final.json)

The [annotated benchmark](benchmarks/pattern-quality-12.jsonl) contains explicit minimum feature counts and distinct-position requirements. These are development prompts that have already been inspected. Passing them is not an independent recognizability judgment or proof of physical buildability. The evaluator refuses missing rows, duplicate IDs and mismatched prompts, so a favorable subset cannot silently become the denominator.

## Fine-tuning pilot prepared

`prepare_quality_pilot.cjs` filters existing approved scenes using the new digital checks. It leaves their target values and approval flags unchanged. The first subset has 27 training examples and three development holdout families: frog, mushroom and cloud. Cactus and sailboat are excluded because they still have nominal bead overlaps. The twelve pattern-quality benchmark families are absent from this training set.

The dataset and source fingerprints are in [quality-pilot-v1/manifest.json](quality-pilot-v1/manifest.json). This is a small text-only experiment, not new physically verified training data.

[Open the free quality pilot in Colab](https://colab.research.google.com/github/c-tustin/beadform/blob/runpod-training-guide/training/colab_quality_pilot.ipynb).

The notebook compares improved spatial instructions alone with a three-epoch QLoRA using the same instructions and benchmark. Target serialization can place geometry before notes. Checkpoints, raw predictions, strict schema scores and pattern-quality reports are saved to Drive. This notebook has been prepared; no new fine-tuning result is claimed yet. Use only an eligible free GPU and honor usage limits.

## Work still required

- Run the new prompted baseline and quality-filtered LoRA comparison.
- Improve missing-feature coverage and proportions, not just the spelling of part names.
- Resolve remaining cactus and sailboat overlap cases without extending exposed thread or lowering clearance thresholds.
- Measure assembly displacement and label/diagram crowding, then improve their layouts.
- Render and inspect candidate silhouettes and instructions.
- Physically build a small set with specified beads and line, recording joint strength, hole capacity, tension, gaps and corrections. Digital routing checks do not substitute for this evidence.

The goal remains active. No generated scene is newly labelled physically tested or approved merely because it passes these diagnostics.

## Completed follow-up: placement, diagrams and free LoRA

The sections above preserve the first measurements. The later changes and completed experiment supersede their pending-work status.

### Placement and instruction spacing

- Strand attachment searches reject colliding candidates. They may rotate a requested strand by at most 30 degrees; the largest measured change in the 32-scene library is 29.302 degrees. There is no fallback that accepts an overlap.
- Named strand tips attach to their corresponding stem. Sails attach to an earlier mast; a mast uses the existing supported tube construction. A small sail can use a four-bead panel. These change the sailboat from 31 to 57 beads.
- Dedicated eye beads retain their specified color when nearby painted markings are applied.
- The final library result is **32/32 compiler-valid and 32/32 without detected cross-component overlaps**, using the same detail, thread size and clearance tolerance as before. No scene has been physically tested by this work.
- Combined instruction maps now preserve bead spacing, wrap titles, use larger bead numbers and scroll horizontally where needed. Across 284 join/reposition diagrams, measured crowded glyph pairs fall from 2,915 to zero at 950 pixels rendered width. Minimum nominal glyph clearance is 10 pixels. This does not measure every label collision, thread crossing or readability concern.

Evidence: [final library](results/2026-10-19-library-quality-placement-final.json), [orientation changes](results/2026-10-19-placement-orientation.json), [diagram spacing](results/2026-10-19-diagram-spacing-comparison.json), [visual comparison](results/2026-10-19-spacing-preview.png). Intermediate placement-v2 through placement-v6 reports retain unsuccessful iterations, including the stricter direction cap that initially prevented sailboat compilation.

### Completed free Colab experiment: no usable generated patterns

The run used source commit `0d09d8a22f292ece1fff38d06459122d9bb15cd9`, Qwen3-VL-2B-Instruct in NF4 on a free Tesla T4, 27 training examples and three evaluation examples. The three-epoch LoRA completed 12 optimizer steps in about 503 seconds. Training loss was 0.626673 and final evaluation loss 0.478252. These loss values do not establish pattern quality.

| Same 12 development prompts | Strict JSON | Minimum scene checks | Compiler-valid | Clearance-valid |
|---|---:|---:|---:|---:|
| Base with quality instructions | 12/12 | 0/12 | 0/12 | 0/12 |
| New LoRA with quality instructions | 12/12 | 1/12 | 0/12 | 0/12 |

Both configurations repeated small coordinates and produced irrelevant, missing or duplicated features. The adapter is **not deployed or recommended**. Rescoring the same saved outputs with the latest compiler still gives zero compiler-valid patterns for both configurations. The compiler improvements cannot supply features that the model omitted.

All 24 [raw predictions](results/2026-10-19-quality-pilot-predictions.jsonl) are retained, with [base](results/2026-10-19-quality-base-current-compiler.json) and [adapter](results/2026-10-19-quality-adapter-current-compiler.json) audits. These are inspected development cases, not independent generalization evidence or training targets. Checkpoints remain in the user's Drive under `Beadform-free-qwen/runs/quality-pilot-v1`.

### Next model experiment and remaining work

The next probe restricts Qwen to semantic family selection, including unsupported-subject rejection. Its 15 original development prompts paraphrase twelve known families and include three unsupported or multiple-subject controls. It is not yet a complete planner: deterministic templates must exist and pass geometry checks before a family can be offered by the product. No semantic score should be reported as generated-pattern success.

A [single hand-authored dog prototype](prototypes/2026-10-19-dog.scene.json) demonstrates deterministic placement: 149 beads, nine solid parts, one working line, zero detected cross-component overlaps, and the specified minimum dog features. Its [guide](prototypes/2026-10-19-dog-guide.txt) is an unreviewed draft. It is not model output, an approved training target, a twelve-case benchmark result or proof of physical buildability.

Still required: inspect silhouettes and proportions across subjects; expand deterministic placements without weakening requested features; define supported design choices; evaluate semantic decisions and unsupported requests; account for finishing passes and thread access; physically sample joints, tension and bead-hole capacity. Collect corrections before training again. The full pattern-quality goal remains active.

## Semantic probe and three-view review

The free semantic-only Qwen probe completed on 15 development requests: **11/15 correct, 15/15 strict JSON, 0/3 unsupported controls rejected correctly**. It confused hedgehog with dog, dragonfly with dragon, galaxy with owl, and a cat-plus-dog composition with cat. This configuration is unsuitable for automatic planning. It was a base-model inference probe, not another fine-tuning run. See [raw decisions](results/2026-10-19-family-selector-predictions.jsonl) and [summary](results/2026-10-19-family-selector-summary.json).

Three orthographic views of the dog exposed a real face-placement error: nearest-center matching could put an eye on an ear. Painted facial features now prefer a named head, or a named body/torso if no head exists. Dedicated eye components remain protected. The dog has all three face landmarks on its head after this fix. The complete library still gives [32/32 compiler and clearance passes](results/2026-10-19-library-face-host-fix.json), with source fingerprints recorded in that report. No physical success is implied.

The [dog three-view preview](prototypes/2026-10-19-dog-preview.png) remains unapproved: proportions, splayed ears, line access and finishing need review. The sailboat's silhouette also remains poor despite its clearance improvement. Neither prototype is promoted to a training target. The new `render_prototype.py` renders saved nominal geometry consistently for further shape reviews.

## Candidate weave-in routes — 2026-10-19

The new `thread-finishing.js` searches from both ends of every working length. Each candidate visits three distinct existing bead holes and uses only connections already recorded by the assembly route. Starting tails and working ends share one passage inventory: a route cannot spend capacity already allocated to another candidate. The search is bounded and greedy, so unresolved routes are reported as unresolved rather than impossible.

The audited 32-example library has **70/70 endpoints with a candidate**, with 32/32 combined inventories within the existing passage limit. Assembly operation counts are independently recounted before the audit. Neither the assembly sequence nor its counts are silently changed. See [audited routes and source fingerprints](results/2026-10-19-finishing-candidates-audited.json). The earlier v1 report preserves the initial search allocation.

The studio now shows these drafts under thread details, and includes them in text/PDF guides. The construction graph carries the candidate records. Bead CSV exports separate assembly passages, candidate finishing passages and the combined total. The frog UI was inspected: both ends have candidates and the combined maximum remains six passages.

**These are not complete finishes.** Three beads is an authored search heuristic, not an experimentally established rule for securing fishing line. No knot is specified; additional knot or securing passes are not included. Physical hole access, needle angle, line damage, tension and holding strength remain unverified. The report explicitly records zero complete or physically tested finishes. Do not use these results as physical-success training labels.

### Settings sweep and corrected parent relationships

The complete library was swept across detail 3/4 and 0.20/0.25 mm line, retaining failed compiles in every denominator. The initial sweep exposed antennae attaching to a wing, narrow structural necks becoming flexible strands at detail 4, and a guitar headstock selecting its body. Antennae now prefer head/body, structural necks use the existing tube construction, and headstocks prefer a neck. Small non-capsule leaf panels retain their small construction at both detail settings, allowing the small sail to attach at detail 4.

| Setting | Compiled before → after | No detected overlaps after | Every thread end has a candidate after |
|---|---:|---:|---:|
| Detail 3, 0.20 mm | 31/32 → 32/32 | 32/32 | 32/32 |
| Detail 3, 0.25 mm | 32/32 → 32/32 | 32/32 | 32/32 |
| Detail 4, 0.20 mm | 27/32 → 31/32 | 31/32 | 31/32 |
| Detail 4, 0.25 mm | 28/32 → 31/32 | 31/32 | 31/32 |

These are 128 configurations of the same 32 inspected scenes, not 128 independent subjects. The larger castle still fails its right-tower attachment. That failure remains explicit; clearance or span limits were not relaxed. Attachment errors now suggest the smaller setting when the selected line is already 0.20 mm, rather than recommending the same line again.

Evidence: [initial sweep](results/2026-10-19-settings-sweep-v1.json), [parent correction sweep](results/2026-10-19-settings-sweep-parent-fix.json), and [finishing audit after parent fixes](results/2026-10-19-finishing-parent-fix-audited.json). An actual UI-downloaded frog CSV was inspected: 116 rows, six candidate finishing passes, correct assembly-plus-candidate sums, maximum combined count six ([export check](results/2026-10-19-finishing-export-check.json)).

Still required: repair the larger castle using appropriate structural geometry; improve weak silhouettes; choose and physically sample complete finishes; verify actual hole axes and access; improve model semantic rejection before deployment. The goal remains active.

## Current CRAW geometry, library and app entry

The later CRAW work supersedes the previously unresolved larger-castle result. Non-flat boxes now become shared-edge cube lattices. Thin boxes such as sails remain panels, and rounded parts retain circular peyote. The compiler selects integer block dimensions at bead scale, computes all edge beads, and completes cubes in an order that shares a previously built face. Child blocks start from their parent-facing corner. No LLM supplies these counts.

`craw-block.js` matches `a(b+1)(c+1) + b(a+1)(c+1) + c(a+1)(b+1)`. Its bounded generator was audited across 216 dimension combinations and eight entry corners each: **1,728 orders**, one cube = 12 beads, two in a row = 20, row increment = eight. This is a digital inventory/order result, not physical stitch validation.

Visual inspection found and corrected two placement errors: castle tower bases now align with the wall baseline, and flat non-capsule panels use the thinnest source axis as their normal. The compiler checks those constraints. CRAW charts separate xy layers and the z-direction edge beads into labelled groups rather than projecting coincident bead positions. The [castle](prototypes/2026-10-19-craw-castle.png), [house](prototypes/2026-10-19-craw-house.png) and [robot](prototypes/2026-10-19-craw-robot.png) previews are still unreviewed physical drafts. Recognizability and proportions remain judgments beyond the numeric checks.

### Final measurements from unchanged source

- **128/128** library configurations compile: all 32 scenes at detail 3/4 and 0.20/0.25 mm line.
- **128/128** have no detected cross-component bead overlaps and candidates for every thread end.
- **Zero crowded bead-glyph pairs across 2,856 part, joint and repositioning diagrams** at the measured 950-pixel width. This does not establish text readability, absence of thread crossings, or needle access.
- **128/128** version-5 project round trips retain the matching route. Legacy parts migration resets obsolete progress and retains old settings, colors and progress metadata in `legacyProjectData`.
- **128/128** offline API response fixtures return inventory from the actual parts planner. The collapsed-capsule control is rejected. These use **zero live model calls** and do not measure Qwen's generation quality.
- **Zero physical builds or complete knotted finishes** have been verified.

Authoritative reports: [pattern/settings/diagram audit](results/2026-10-19-patterns-frozen-final.json), [project round trips](results/2026-10-19-projects-frozen-final.json), [offline API fixtures](results/2026-10-19-api-frozen-final.json), [CRAW inventory](results/2026-10-19-craw-frozen-final.json). The main evaluators capture source hashes at the start and refuse to write a report if captured files change during execution. Earlier iterations, regressions and the initial app-entry harness error are retained separately. One earlier API report explicitly warns that source changed during its process; use the frozen report for current-state evidence.

### Usable app path and sample files

All 32 existing reviewed synthetic scenes are now bundled as **draft examples**. Fish is excluded from this added catalog, as requested. After choosing a starter, use **try another example** to choose the castle, house, guitar and other subjects. No model, API key or paid service is required for examples. The bundle is generated from the existing approved scene file; no physical-success labels were added.

The parts studio previously required an unrelated voxel model to succeed before showing its parts graph. That blocked the guitar at the default setting and the house at the larger setting. Parts projects now build and save the actual parts graph directly, and the API validates the requested construction mode. No placeholder voxel inventory is substituted. The actual browser guitar opened with **90 beads / three parts**, exported as version 5 with guide version 12, and reopened from the gallery with a matching route. The castle was inspected in the browser at **66 beads** (Everyday) and **144 beads** (Expanded).

The [12-bead CRAW cube guide](prototypes/2026-10-19-craw-cube-guide.txt), [numbered chart](prototypes/2026-10-19-craw-cube.svg), and [editable project](prototypes/2026-10-19-craw-cube.beadform-3d.json) provide a concrete small sample to try. The practice menu also includes this cube. Knots are deliberately not invented; candidate weave-in routes are not secure finishes. Record actual supplies, hole fit, tension, geometry and corrections before adding physical success to any dataset. Future build snapshots include the route key so an outcome can be tied to its actual recipe.

The new compiler results do **not** change the unsuccessful Qwen geometry pilot or semantic rejection results above. No adapter has been promoted or deployed. Remaining work includes physically sampled finishing and joints, stronger visual fidelity, and reliable learned design decisions and rejection of unsupported requests. The full goal remains active.

## Resumed work — October 20, 2026

The CRAW, project persistence, draft catalog, prototype and frozen-audit changes were published in commit `1f499638cb9491866a55a674706c78b6185239c6`. Before publication, all four final reports' source fingerprints still matched the local sources; the expensive audits were not rerun merely to duplicate unchanged results.

A separate [catalog selector pilot](catalog-selector-v1/README.md) now targets the actual 32 bundled draft subjects, rather than the previous probe's different 12-family catalog. It has 128 newly authored synthetic training requests and 48 development requests, including explicit fish, unsupported-subject, composition and ambiguity rejection. These new semantic labels are marked as not user reviewed and do not supply physical-success labels. Development phrases were authored alongside training phrases and are not an independent test.

The new [free Colab notebook](colab_catalog_selector.ipynb) compares the base model and a two-epoch QLoRA adapter with the same instructions, catalog and development set. Source/data hashes, the resolved base-model revision, checkpoints, raw decisions and package versions are retained in Drive. Completed runs are preserved. There is no automatic adapter deployment. Local data and syntax checks passed; GPU execution and model scores must be recorded separately after the actual run. The old unsuccessful geometry pilot and 15-case semantic probe remain unchanged.

**Actual Colab attempt:** a copy of the new notebook was saved to Drive and Run all was invoked. GPU allocation was refused with “You cannot currently connect to a GPU due to usage limits in Colab.” No training, base evaluation or adapter evaluation began. No compute units were purchased and no quota workarounds were attempted. The [status record](results/2026-10-20-catalog-selector-status.json) preserves this distinction. Retry the saved notebook when eligible free GPU access returns; no model improvement is claimed from preparation alone.

## Completed catalog selector — October 21, 2026

Free T4 access returned. Drive initially failed to mount; retrying after the user's approval succeeded. The first startup command then exposed an overly strict output-directory check: notebook setup files were being mistaken for unidentified model outputs. Commit `015eb303fb08a02fb87dd3e002b1f24824e89dcd` permits the three known setup files while continuing to reject unidentified outputs. This correction happened before any model evaluation or training. The failed startup log and revision transition were preserved in Drive.

The two-epoch QLoRA run completed 32 optimizer steps in 336.7 seconds. On the same 48 authored development requests, base selection scored **33/48**, adapter selection **45/48**. Supported designs changed from **32/32 to 30/32**; rejection changed from **1/16 to 15/16**, including fish **1/4 to 4/4**. The adapter falsely rejects the teddy-bear and strawberry descriptions and incorrectly selects frog for a frog-plus-turtle request. Both configurations have 48/48 valid JSON under constrained decoding; this is not unconstrained format reliability.

[Evidence and limitations](results/2026-10-21-catalog-selector-v1/README.md) include all 96 raw decisions, exact source/data hashes, the pinned model revision, environment, package versions and training metrics. Downloaded predictions were checked against their original inputs and independently recounted; recorded source hashes match the local code. The adapter and resumable checkpoints remain in Drive. Colab reported a notebook autosave conflict, so the completed notebook was copied separately rather than overwriting the remote version; the Drive result files were complete and the subprocess exited successfully.

These are synthetic development results, not an independent test, generated-geometry success or physical-success evidence. The adapter is **not deployed**. Independent requests, rejection regressions and physically sampled patterns remain necessary. The earlier unsuccessful geometry pilot is unchanged.

## Nominal hole directions and clearer attachment approaches — October 21, 2026

The previous overlap checks compare bead centers with conservative spherical envelopes. They do not check the direction of the hole or whether thread approaches cross a neighboring bead. `bead-geometry.js` now derives nominal axes from each bead's placed endpoint geometry, uses 2 mm diameter / 1.3 mm longitudinal length for seed beads and 4 mm for round eyes, and audits straight connections in actual guide order. Only beads already present at that point are obstacles. Oriented oblate envelopes are enlarged by the selected line radius. Needle length and diameter, actual hole diameter, tension, thread curvature and deformation are not simulated.

The attachment selector now ranks candidate parent/child bead pairs using both outward and return approaches, alongside the existing passage budget, reach, continuity and anatomical constraints. It prefers candidates whose approaches do not intersect those nominal envelopes. It does not relax the existing 3.8 mm center-span limit or change physical-success labels.

| Paired measurement, 128 configurations | Previous anchors | Revised anchors |
| --- | ---: | ---: |
| Compiled | 128 | 128 |
| Nominal straight-path flags | 526 | 371 |
| Flags between parts | 212 | 50 |
| Flags within parts | 314 | 321 |
| Inter-bead connections | 40,858 | 40,889 |
| Working lengths across the whole set | 137 | 139 |

All 128 paired cases have **identical bead IDs, materials, colors and center positions**. The reduction comes from attachment and traversal choices, not deleting beads or changing the subject to pass an easier check. Within-part flags increase by seven; the remaining 371 flags still need review, especially in shaped peyote. These are 32 inspected synthetic scenes at four settings, not 128 independent subjects. A straight-path flag may be resolved by curved thread in real beadwork; zero flags does not prove needle access or buildability.

The studio now displays a **thread approach review**, retained in text and print guides and construction JSON. Bead previews use nominal oblate geometry with placed hole directions; hole symbols remain illustrative. CRAW shape maps draw the actual lattice rather than using the tube fallback. A new preview-SVG export preserves the current view. The bead CSV includes positions, nominal hole length and axis vectors.

Final unchanged-source checks: **128/128** compiles with no detected cross-component bead overlap, **128/128** matching project round trips, **128/128** offline API fixtures, and zero crowded bead-glyph pairs across **2,858** charts. Every thread end still has a candidate weave-in route within the existing combined passage limit. Those candidates remain incomplete finishes. No live model calls or physical builds were added.

Evidence: [paired policies](results/2026-10-21-thread-access-comparison.json), [initial nominal audit](results/2026-10-21-thread-access-baseline.json), [final nominal audit](results/2026-10-21-thread-access-final.json), [settings and diagram audit](results/2026-10-21-patterns-access-final.json), [project round trips](results/2026-10-21-projects-access-final.json), [offline API fixtures](results/2026-10-21-api-access-final.json). Intermediate v1 and pre-export reports are retained as development history; the final reports correspond to the final source.

The actual app opened the 12-bead CRAW sample with zero nominal flags. Browser-downloaded [preview](prototypes/2026-10-21-craw-cube-angled.svg), [bead CSV](prototypes/2026-10-21-craw-cube-parts-beads.csv) and [guide](prototypes/2026-10-21-craw-cube-parts-guide.txt) were inspected: 12 unique beads, four axes in each cube direction, unit axis vectors and a 1.3 mm nominal longitudinal length. [PNG preview](prototypes/2026-10-21-craw-cube-angled.png) is a rasterization of the actual SVG export. No maker-completion or physical-success flag was set. Physical samples, secure finishes, stronger silhouettes and reliable learned decisions remain outstanding; the full goal is not complete.
