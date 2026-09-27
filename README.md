# Beadform — your idea, bead by bead

A pink-and-green bead studio that starts with varied parts: peyote balls, pears and domes; angle-weave leaves, fans, pointed caps and tubes; and flexible strands. Text/vision interpretation supplies a subject’s parts and colors; the app builds original bead routes and explicit joins. Detailed cubic RAW and flat peyote, RAW, and square stitch are also available. All embedded example artwork, geometric templates, bead diagrams and instructions are original code-generated assets. No reference pattern pages or third-party product images are bundled.

## Start with text and image generation

1. Extract **beadform-project.zip** into its own folder.
2. Install [Node.js 22 or newer](https://nodejs.org/en/download) if it is not already installed.
3. On a Mac, open **start.command**. On Windows, open **start.bat**. The launcher opens the studio in your browser. Keep its terminal window open while using Beadform. You can also open Terminal in the extracted folder and run `node launch.mjs`.
4. Choose **connect text + image generation** in the studio.
5. Create a secret key on your [OpenAI API keys page](https://platform.openai.com/api-keys), paste it into the studio’s private password field, and choose **check key + enable generation**. Enter the key in the local studio, not in chat.
6. Choose **describe it** to make a project from text, or **use an image → interpret as a full 3D subject** to use a reference’s shape, proportions, parts, and colors.

The connection check sends one small API request. Checks and generation use your API account’s billing. If the check reports no quota, add API billing or credits using the link in the connection screen, then try again. The app does not ship with a key or include API credits. See the official [OpenAI setup guide](https://developers.openai.com/api/docs/quickstart).

The server saves your checked key outside the project folder, in a private user configuration file. On macOS this is `~/Library/Application Support/Beadform/credentials.json`; on other systems it is `~/.config/beadform/credentials.json`. POSIX directory/file permissions are restricted to the user. This is a local credentials file, not an encrypted system keychain. The key is never returned by the server, saved in browser storage, or included in an exported pattern or project. Open the connection screen again to replace it. Delete that credentials file to remove a saved key.

The server accepts open-ended descriptions and images. The model proposes a new scene of ellipsoids, swept capsules, boxes, cuts, and color patches; it does not select among the starter examples. The bead engine then constructs and validates the project’s actual bead inventory and thread routes. Review the inferred shape before following its guide.

## Open without an API key

Open **beadform.html** directly in a modern desktop browser for local image-outline generation, editing, viewing, project saving, and exports. Choose **use an image**, upload a PNG/JPG/WebP, refine the outline with **keep / remove**, then choose **build this outline**. The outline determines the whole shape and its colors. Broad regions gain more depth than thin limbs; **body depth** adjusts the inflation.

For a complicated photo, clean up its mask or use the connected image interpreter. Local tracing removes a dominant, border-connected background; it is not semantic segmentation. A single silhouette supplies a rounded depth estimate, not unseen anatomy. The standalone HTML explains how to launch the connected studio and does not present an API-key input field.

## Shaped construction: peyote forms, panels, points and strands

**Balls, tubes + strands** is the default Construction choice. It creates actual hollow surfaces and strands, rather than a filled cubic lattice with different labels.

- **Parts map:** labelled shape symbols show the overall subject and the small set of components to make. Select a part to open its guide.
- **Peyote balls:** original 40- and 70-bead circular-peyote drafts use a five-bead foundation, one-bead stitches, two-bead increases, paired-anchor decreases, explicit round-end step-ups, and a five-bead draw-in closure. Choose **Everyday** or **Expanded** project size. These shaping schedules require physical sampling; the illustrated sphere is not a guarantee of finished roundness or rigidity.
- **Open peyote domes:** 10-bead compact eye mounds; larger 25-bead domes and a 55-bead shell/cap in Expanded size. The rim stays open; the guide never tells you to draw it closed.
- **Peyote pears:** a 20-bead compact or 40-bead expanded tapered form for haunches, bodies or teardrops, with its own round schedule.
- **Leaf/wing/fin panels:** nine beads in three adjoining four-bead loops, shaped into a pointed, open panel.
- **Fans/webbed feet/tails:** ten beads in three adjoining four-bead loops, spread at their outer edge.
- **Points/beaks/horns:** eight beads in triangular sides and a square base. These are small faceted caps, not smooth solid cones.

- **Tubes:** five-sided tubes have four-bead wall loops and five-bead ends. A whole tube is one significant step, including its repeated wall sections.
- **Strands:** string the beads, skip the tip, and return through the others. These stay flexible with fishing line; they are not rigid rods.
- **Join cards:** build each new part from the existing beadwork, then close its labelled parent/child attachment before starting the next part. Keep the working line attached. Two attachment loops help reduce twisting; strands use one flexible attachment. Join cards add no new beads and include their anchor passes in the inventory’s passage counts.
- **Replay:** reveal one thread movement at a time, track the new beads, and switch to the beaded assembly to see the current part. Saved projects retain the construction choice and partial part replay.

The default frog has **156 total beads in nine parts**: one 100-seed-bead combined head and body, two compact haunches, two tiny paws, two short arms, and two single 4 mm black round eye beads. Prepare **154 size-11/0 seed beads plus two larger eye beads**. The body has an optional filling pause before the first decrease.

The planner prioritizes **one continuous working line**. It routes through existing bead holes to the next attachment, starts the new component on that line, closes its attachment, and continues to the next part. It does not split the thread at normal part or stage boundaries. A fresh length is used only when the planner cannot find a route within the remaining passage budget, or when a separate start saves a necessary anchor pass. Each such change has a visible marker and a reason; one line is preferred, not guaranteed for every scene.

The thread-plan box lists the planned number of lengths and their estimated preparation lengths. Estimates include a 30% routing allowance and 40 cm of tails per length; they are not measured cut lengths. Ordinary stage exits say **continue**. Only the final stage gives the normal finishing instruction. Joining anchors are labelled in earlier part charts so they can be identified later. Existing beads used for positioning appear as pale context beads below a part’s main chart.

The parts compiler favors named heads/bodies, tubes, and thin strands in model-generated scenes. Eyes and markings color real surface beads. It supports up to 18 solid parts, and the text/vision prompt asks for at most 10. It does not guarantee exact proportions, rigidity, likeness, or the closure of complex curved features. Cut-out regions are omitted in this mode and explicitly reported. Review the assembly before making it.

For a photograph, choose **interpret as a full 3D subject** to identify meaningful parts. Local image-outline inflation remains available under **Cubic RAW**; it cannot identify anatomical parts without interpretation. Everyday parts use the compact vocabulary; Expanded keeps larger forms. Body-depth stretching is disabled for this mode because these bead components have fixed geometry.

Use the **save + export** menu in the parts studio for its complete print/PDF guide, parts-map SVG, current thread-chart SVG, exact text sequence, bead CSV, or editable project. These exports use the parts inventory, including joins. The package includes original `parts-map.svg`, `parts-ball.svg`, `parts-join.svg`, and `parts-assembly.svg` examples.

No physical sample was made. Digital checks verify closed surfaces, unique inventory, thread continuity, and planned passage counts including joins. Starting, finishing, knots, needle access, tension, and actual seed-bead hole fit require a sample with your own materials.

## Detailed lattice construction

Choose **Cubic RAW · detailed lattice** to use the earlier detailed studio.

- **Pattern** opens a sheet of significant construction stages. Each stage shows many outlined beads together, connected by curved thread paths and directional arrows. Select a stage to enlarge it. The default frog has 9 stages, combining its 380 underlying rings.
- **3D** lets you turn the whole project around and check its proportions.
- **Assembly** highlights the current stage on the finished form. **Show only beads added so far** follows your replay progress.
- **let’s make it** replays a whole stage, revealing one thread movement at a time and counting newly added beads. You can jump to a complete unit or inspect the optional exact movement list.
- **Export** provides the entire stage sheet as SVG, the current connected stage diagram, a complete print/PDF pack, detailed text instructions, 3D reference views, material/coordinate CSVs, and editable JSON projects.

Rose shows weaving, green shows repositioning through existing beads, and pale beads are already made. The green dot marks the stage start; the rose square marks its exit. A star marks a fresh working length: finish the previous line before starting there. Bead IDs are optional to keep drawings clear. A repeated B ID always refers to the same physical bead. Line crossings between beads are not joins.

Stages group complete connected units and contain up to about 60 new beads; they are not horizontal layers. New projects favor connected body parts in their construction order. The charts spread a 3D bead graph into a schematic, so the drawing is not a physical flattening of the sculpture. Use its 3D context view and replay to understand how the section fits.

The print pack includes a cover, materials, and one large connected chart per stage. It does not print a separate page for every ring or layer. Start with Small detail for a first sample.

Version 4 projects now also store the construction choice and parts replay. Older files open in their original lattice mode. They preserve their geometry, source image, outline, colors, edits, and partial stage replay. Version 2/3 3D and version 1 flat projects can still be opened. Older 3D projects retain their original bead IDs and routes. Rebuilding construction settings changes a pattern; save a separate copy before changing a partially completed project.

## Server configuration

There are no production npm dependencies. You can supply `OPENAI_API_KEY` through your environment or an optional local `.env` file and use `node launch.mjs`. Do not share that file. Optional settings are `OPENAI_MODEL` (default `gpt-4.1`), `PORT` (default `4173`), and `BEADFORM_CONFIG_PATH` for a private credential location. A key saved through the setup screen takes precedence over the environment key. `node server.mjs` starts the server without opening a browser.

The launcher tries the next available port if its first port is busy. The server binds to `127.0.0.1`, validates localhost host/origin headers, uses a per-run token for key setup, limits input size/request frequency, and allows one generation or connection check at a time. It serves only the app and its three API routes. Public hosting needs authentication, per-user quotas, durable rate limits, and deployment-managed secrets; this package does not publish a site.

## Supplies and limits

Default supplies are **size 11/0 round/rocaille seed beads**, nominally **2 mm diameter × 1.3 mm along the hole**, and **0.20–0.25 mm fishing line**. Bead measurements vary by manufacturer and finish. The flat studio uses the same starting measurements and allows adjustments.

Detailed lattice projects use full cubic right-angle-weave structures: each cube has six four-bead faces, neighboring cubes share a complete face, and interior beads are counted. The engine validates unique inventory, shared faces, connectivity, closed rings and thread continuity. New routes reserve future face passages and cap planned use of one bead at **8 passes for 0.20 mm line** or **6 for 0.25 mm line**. If needed, a new working length is explicitly marked.

Those caps are engineering planning heuristics, **not certified hole capacities**. Knots, tails, starting/finishing passages, needle thickness and additional reinforcement are not covered by the cap. Instructions identify starts, exits and changes of working length, but the maker must use a fishing-line finish they have tested. Make several joined cubes with the actual supplies before committing to a sculpture. No physical bead sample was made during development; needle access, tension, rigidity and likeness are not proven by the digital checks.

Text/image interpretation returns a stylized approximation within the geometric vocabulary and bead resolution. It cannot guarantee an exact reconstruction of every subject. Thin features may need to be thickened, poses simplified, or separate components explicitly joined. Small supporting cells connect nearby diagonal contacts and are included in the inventory; widely disconnected parts are rejected. Check all inferred proportions in the 3D preview before making the pattern.

## Source and verification

`beadform.html` is the complete front end. To rebuild it after editing the source modules, run `python3 build.py` in this folder.

Core files:

| File | Purpose |
| --- | --- |
| `parts-engine.js` | Peyote balls and angle-weave tubes, return strands, part placement, passage-aware routes, and explicit joins |
| `peyote-ball.js` | Original circular-peyote schedules, up-bead anchors, increases, decreases, step-ups, closure and illustrative geometry |
| `continuous-thread.js` | Interleaved part construction and attachment, constrained repositioning, explicit necessary thread changes, and length estimates |
| `parts-app.js` | Parts map, assembly, whole-part guide, replay, materials, and exports |
| `shape-engine.js` | Image masks, distance-field inflation, arbitrary parametric scenes, connectivity and color regions |
| `volume-engine.js` | CRAW bead topology, shared-face inventory, passage-aware thread routes and validation |
| `stage-guide.js` | Significant-stage grouping, connected bead/thread diagrams, layout and replay mapping |
| `thread-diagram.js` | Optional low-level single-ring diagram helper |
| `creator-app.js` | Reference editor, descriptions, service status and generation requests |
| `volume-app.js` | 3D views, replay, painting, projects and exports |
| `engine.js`, `app.js` | Flat peyote, RAW and square stitch |
| `server.mjs`, `scene-schema.json` | Server-side Responses API integration and strict scene validation |
| `connection-app.js`, `key-setup.mjs` | Local API-key wizard, verification, private persistence and sanitized errors |
| `launch.mjs`, `start.command`, `start.bat` | Local studio launchers |

Dependency-free engine/server checks: `node check-engine.cjs`, `node check-volume-engine.cjs`, `node check-generation.mjs`, `node check-connection.mjs`, and `node check-parts.cjs`. The generation check uses controlled model-response fixtures and a real local HTTP server; it makes no live model calls. It also writes the original test-subject fixtures used by the UI check.

For the canvas/DOM smoke checks, install development-only dependencies with `npm install --no-save @napi-rs/canvas sharp`, then run `node check-app.cjs` `node check-creator.cjs`, and `node check-parts-ui.cjs`. The DOM harness exercises real image sampling and SVG rasterization, but it does not replace a full browser interaction or print-layout test.

Verified during development: 84 parts configurations with closed tube/point surfaces, open panels, and peyote shaping, exact bead/thread accounting and join anchors; continuous working-line routes across part boundaries, estimated lengths, parts-map and replay interactions, parts project round-tripping and export completeness; 52 flat geometry cases, 54 legacy 3D configurations, 108 configurations using passage-aware routes and connected-part ordering, complete significant-stage coverage and continuity, custom animal/object scenes, different geometry from identically colored reference silhouettes, mask editing, thread replay, saved-state restoration, malformed input rejection, exports, print completeness, server/API contracts, secure key setup, restart persistence, connection errors, and generation resumed after the local key wizard. SVG pattern and model renders were visually inspected. No browser binary or configured API key was available, so full browser testing and live model output quality remain unverified.

## References

The server follows the official [Responses structured-output format](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses), [image-input format](https://developers.openai.com/api/docs/guides/images-vision), and [GPT-4.1 capabilities](https://developers.openai.com/api/docs/models/gpt-4.1).

Generic technique and material references: [Fire Mountain Gems — cubic RAW](https://www.firemountaingems.com/learn/categories/jewelry-medium/bead-stringing/how-tos-on-bead-stringing/J343-project-tutorial.html) and [Miyuki — approximate seed-bead sizes and shapes](https://www.miyuki-beads.co.jp/english/seed/01.html). These sources are linked for background; their diagrams and instructions are not bundled or copied.

## Peyote revision and saved projects

Parts-guide revision 8 uses different physical beads and routes from both the old angle-weave balls and the larger peyote revision. Opening an older parts project rebuilds the guide and resets replay progress, with a visible message; do not mix old bead IDs with this revision. Flat and cubic RAW projects retain their construction.

The generator now accepts up to 18 meaningful solid parts and asks for characteristic anatomy, including raised eyes, bent limbs and toes. Rounded solids compile to peyote, while tube walls retain angle weave and strands use a skip-tip return. All new diagrams, shaping schedules and example designs are original. General stitch mechanics were checked against Fire Mountain Gems’ instructional material: https://www.firemountaingems.com/learn/categories/jewelry-medium/seed-beading/how-tos-on-seed-beading/PH3A-article.html. No source illustrations or pattern instructions are copied.

The automatic checks verify each shaping stitch’s previous-round anchors, every step-up, closure, bead inventory, thread continuity and planned passage limits. They cannot establish the physical curvature, tension, or structural stability of a peyote ball. Make a compact ball sample first; a hollow form may need support. A long continuous line can be awkward to manage even when the route permits it; the displayed length is an estimate, and a tested thread-change finish is an option.

## Exploring varied shapes

Use **Explore an original example or practice shape** in the parts workspace for a butterfly, turtle, songbird, revised frog, or individual leaf, fan, point, pear and dome. These examples run locally without an API key. The shape names and proportions returned by text/image interpretation also select these constructions: wings and flippers become panels, webbed feet become fans, beaks become points, and raised eyes become domes. This mapping is an approximation and needs visual review; it is not unrestricted topology reconstruction.

The smaller frog retains its body, head, raised eyes, haunches, front arms and webbed feet. Its current route uses two explicitly marked working lengths. This avoids thread shortcuts between limbs. Thread is now visible between beads in the assembled preview, including open panels. Whole-part diagrams and movement replay remain available for every construction.

Web inspiration and technique checks (no patterns or pictures copied):
- Interweave, geometric triangle projects: https://www.interweave.com/article/beading/beaded-triangles-more-than-20-trendy-projects-to-make/
- Fire Mountain Gems, four-bead right-angle weave: https://www.firemountaingems.com/learn/categories/essential-resources/how-tos/4B05-video-tutorial-with-instructions.html

The panels, caps, peyote schedules and animal compositions are original mathematical drafts. Tests check routes and inventory; physical shaping and rigidity are still unverified.

## Compact animals and close joints

**Everyday** is the default project size, aiming for 150–200 beads. It uses 40-bead peyote bodies and 70-bead heads, 10-bead eye domes, 20-bead peyote haunches, and compact limbs. The frog has 184 beads; larger or complex references may exceed the target, which is shown explicitly. Simple subjects may naturally need fewer beads; the app does not add filler beads to reach a quota. **Expanded** keeps the larger forms.

Thread routing must return through existing parent beadwork between limbs. The path search cannot chain bare connections from one limb to another without traversing a bead. Attachment anchor centers must be within 3.8 mm in the planned geometry. If a second close attachment is unavailable, the guide uses a reinforced single flexible joint; it never stretches a second loop across the gap. A small joint adjustment may move an unbuilt part and its descendants closer to the parent. If there is no close attachment with hole space, the compiler reports the joint instead of inventing a long thread bridge.

Continuous-thread preference is secondary to close joints and passage limits. Every necessary new length has a marked start and reason. The marked lengths in the frog are deliberate; ordinary local join stitches still exist. Physical fit, tension and finishing require sampling with the stated 11/0 beads and 0.20–0.25 mm line. Old parts projects regenerate with new bead IDs and reset their guide progress on import.

## Amigurumi proportions

The frog’s separate shin sections are removed. Its tiny paws join directly to the compact haunches, producing a shorter, tucked pose. The saved bead count goes into a larger 70-bead peyote head, paired with the 40-bead body, rather than longer legs. The default frog remains at 184 beads and now uses two marked working lengths.

Other animal designs use the same amigurumi-inspired proportions: a rounded, generous head, compact body, and shorter limbs. The local compiler shortens named capsule arms, legs, shins, feet and paws to 60% of their reference length; distinctive necks, ears, wings and tails remain recognizable. The original source scene stays unchanged in saved projects. The API prompt also asks for a plush-toy silhouette and simple friendly face. This is a seed-bead interpretation of the style; it does not generate crochet instructions or guarantee the softness of a stuffed toy.

## Tiny paws and clearer peyote rounds

The frog now has tiny four-bead paw loops instead of ten-bead fan feet, keeping the tucked amigurumi silhouette at 184 beads. Its larger rounded head and compact haunches remain. The paw is a single snug four-bead angle-weave loop; its short local attachment is fully included in the route.

Peyote guides use alternating pale pink and green round bands, labelled R1, R2, etc. These are reading aids, not changes to the bead palette or inventory. Whole parts remain together, and movement replay still shows the beads being added. Same-round thread connections—including the final draw-in closure—now follow the circular round instead of cutting across earlier rounds. Bead outlines and IDs are rendered above thread casing, and exit labels stay inside the chart bounds. These changes apply to screen and SVG/print exports. No beads or closure passes are omitted.

## One body, larger eyes, optional filling

The frog now has one combined head and body rather than separate spheres. It uses a 100-bead shaped-peyote body and **two 4 mm black round through-hole eye beads**. The finished plan contains 154 size-11/0 seed beads and two eye beads, 156 physical beads total. Eyes are attached through their holes with the listed local reinforcement, not glued on or counted as multiple seed beads. The preview and diagrams draw these beads larger, and material counts and CSV exports distinguish them. The route still plans two working lengths.

Before the first decrease, the guide offers an **optional filling pause**. Tuck in a little clean, dry, soft plastic film or lightweight craft filling while the opening is accessible. Do not pack tightly or obstruct the working rim and bead holes. Then follow the remaining decreases and closure. The filling is not counted as beads and its amount is left to the maker. Use a small sample to check the actual bead holes, tension, stuffing amount and final shape.

Earlier development notes about separate heads, green eye domes or previous bead counts describe older versions; see the current design below.

## Current design: stick legs and simpler controls

The frog replaces haunches and separate paws with two four-bead stick legs. Two three-bead arms, a 100-bead peyote head/body, and two 4 mm black eyes complete the 116-bead project (114 seed beads plus two eyes). The default route uses one working line. Most named animal legs, shins and thighs now use short return strands; arms use three beads. Distinctive wings, flippers, ears and tails keep their own constructions. Flexible legs are not rigid supports.

The main screen shows short step guidance and bead progress. Expand Full instructions, Beads & colors, Thread details, or Size & supplies for the complete information. Filling pauses and required thread changes stay visible during replay. Exports retain full instructions. Older project progress resets when rebuilt with the revised geometry.

## Welcome and project gallery

The app opens with an idea/image welcome screen, then transitions into a preview and full pattern. Only complete animals appear as examples. The default fox reference is removed; silhouette tracing is an optional advanced Cubic RAW tool. The My projects gallery stores flat and 3D projects, previews, titles and stitching progress in browser localStorage. Cards support reopening, renaming, downloading and confirmed deletion. Changes auto-save after interaction and on leaving the page; storage failures are shown, never reported as saved. Data is browser/origin-specific, not a cloud account: clearing browser data removes it. Use downloaded JSON projects as backups; opening the app at another address or browser has a separate gallery. AI generation still requires the local launcher and API connection.

## Lowercase voice and anatomical attachment zones

The interface uses lowercase typography for labels, dialogs, status messages and charts, with short, casual welcome/gallery copy informed by canelatustin.com. Stored project fields, bead identifiers and API keys retain their original values. Animal limbs attach only to lower body/torso/shell anchors, on the matching side and away from the forward face area. Both initial placement and continuous-thread joint adjustments enforce these constraints. The frog’s arms are posed downward at its sides. Its 116-bead inventory and one planned working line remain unchanged. Previous guide progress resets because attachment paths have changed.

## One scrollable pattern

The complete parts pattern is visible below the overview and replay controls, with every build and attachment step in sequence. Each diagram has an assembled context view: the relevant part or attachment beads are highlighted and the rest remains visible. No pattern pages or nested diagram scrollbars are needed. Full pattern jumps down the page; Replay this step opens the existing movement controls without removing the complete guide. The static guide is cached during replay to preserve reading position and reduce unnecessary redraws.

## Automatic technique selection

New descriptions and reference images use the mixed-technique parts planner automatically. There is no construction selector: circular peyote forms the rounded body parts, angle weave forms panels and points, and return strands form simple limbs. Older saved lattice projects still reopen with their original construction. The advanced outline shortcut is no longer shown in the creation flow.

## Imported files, playful welcome and build feedback

“import project file” opens downloaded beadform JSON files; “my projects” opens the browser gallery. The welcome screen displays three photos from canelatustin.com/images/ (IMG_0936.jpeg, IMG_0938.jpeg, IMG_0900.jpeg), at the site owner’s request. They load directly from that site and require network access. Drag them or move a focused photo with arrow keys; pause stops their motion. Reduced-motion preferences start them paused and disable the decorative transitions. The photos are decoration, never training examples.

Use “i made it! + photo” on a project or “add photo” on its gallery card. Photos are resized/re-encoded as JPEG (stripping source metadata), saved with notes, outcome, and a snapshot of the pattern settings, and included in project backups. Replacing or removing a photo updates its record. Browser storage remains finite; failed saves leave the prior record intact.

Both reuse permissions default off. Inference permission allows up to two relevant completed/adjusted builds to be sent with future generation requests to the configured AI service (text-based relevance; recent eligible builds when the request has no description). Feedback is context, not a claim of guaranteed improvement. Separate training-export permission includes a build in the downloaded JSONL feedback collection. It is a curated raw dataset, not a provider-specific fine-tuning file or a trained model. Review consent, labels, quality and target schema before training. This app does not launch training jobs or pool data across users. Importing someone’s project file resets reuse permissions; reopening your own gallery preserves them. Removing permissions excludes records from subsequent inference requests/exports; copies already downloaded cannot be recalled.

Run check-finished.cjs (with the canvas runtime) and check-feedback.mjs for photo persistence, consent, deletion and API forwarding checks.

## Offline character cutouts (current)

The six welcome characters are now embedded WebP images with transparency. No image downloads or website connection are needed, including on the first offline opening. This supersedes the earlier remote-photo notes. The frog comes from IMG_3070.jpeg (the third upload); the caterpillar from IMG_3515.jpeg; the blue-and-white lizard from IMG_3145 (1).jpeg; the jellyfish, starfish and crocodile from IMG_3078.jpeg. Original uploads were not modified. These are decorative photo edits, never pattern diagrams or training records.

The built-in image editor produced the background-extraction assets with the prompt: isolate the named character, remove the entire background and cast shadows, preserve bead colors, arrangement, thread and pose, and output a transparent RGBA cutout without a border or new details. Generated alpha was retained when resizing/compressing for the web. The six final web assets are in assets/*.webp; build.py embeds them into the standalone HTML. Dragging, keyboard movement, bouncing, pause and reduced-motion behavior remain available. AI pattern generation still requires the connected service.

Welcome characters now start at randomized positions with independent random headings and speeds. Their layer sits above the idea panel on desktop and mobile; only the draggable characters receive pointer input, while the empty layer passes clicks through. Edge bouncing, pause and reduced-motion settings still apply.

## Toss and collide

Floating characters now use soft circular collision boundaries, exchanging momentum when they bump. Dragging pushes nearby characters; releasing uses recent pointer speed and direction to throw the character. Hold still before release to stop it, or drag slowly for a gentle drift. Fast throws gradually slow, edge impacts bounce, and speed is capped. Paused/reduced-motion mode keeps other characters still while allowing direct dragging. Collision boundaries approximate the cutout silhouettes.

Characters can also spin. Off-center throws create rotation, glancing collisions transfer spin, and rotation eases down over time. Use q/e on a focused character to turn it; when paused, these keys adjust its angle without starting animation.

## Cursor bumper and shape reference

The mouse cursor is a small stationary/moving collision body on the welcome screen, pushing characters and transferring momentum; it stops affecting them while paused, dragging a character, away from the welcome screen, or inside an open dialog. Touch users still drag/toss directly.

“shape reference” opens nine independent practice patterns: a shaped-peyote sphere, a 12-bead four-loop RAW sheet, a two-repeat angle-weave tube, return strand, peyote dome and pear, leaf, fan and pointed cap. Each offers a form preview, complete bead/thread diagram, movement replay, instructions and SVG download. The library does not change the current project. All are original deterministic practice swatches; physical tension and shaping still require a sample.

## Decorative-only floating characters (current)

Direct dragging and keyboard manipulation of the floating characters are removed, as are the gesture instructions. Characters pass clicks and taps through to the welcome form. Random motion, collisions with each other/cursor, spin and the pause control remain. This supersedes the earlier drag/toss instructions.

The floating arena now starts at the top of the page, adding 135 px of space above its previous boundary while preserving its bottom boundary.

## local qwen and lora (current)

Run `node launch-qwen.mjs` after installing Ollama and pulling `qwen3-vl:4b` for local text/image generation without an API key. See `qwen-and-lora.md` and `training/PLAN.md` for setup, reviewed data gates, the QLoRA pilot and the optional RunPod route. Provider checks use mocked responses; no live local model or GPU training was run in the development environment.

## interactive studio and construction contracts (current)

The default project preview now supports pointer rotation/tilt, zoom buttons, reset, keyboard arrows/+/-/home, and bead-to-part navigation. Moving the camera does not rebuild the full scrolling guide. Decorative welcome characters remain non-draggable.

The interface uses larger type, a quieter pink/green palette, pill controls, and a broad model canvas. The requested annamarialuisa.xyz reference could not be retrieved; no visual assets or layouts were copied from it.

construction-graph.js records exact part inventories, circular-peyote round counts and technique decisions, plus typed eye, strand, single-hinge and double-anchor joints. It validates graph connectivity, anchor ownership/anatomical restrictions, distinct pairs, reinforcement passes, passage budgets, and the existing 3.8 mm span limit. The construction JSON is available under construction + materials. All templates are explicitly draft, not physically certified. This metadata does not alter existing bead counts or routes.

Finished-project feedback now includes optional structured issues for loose structures, visible thread, uneven shaping, twisted tubes, weak joints and unclear instructions. These travel with consent-gated training exports. They do not automatically train a scorer or certify a joint.

### Hybrid planner groundwork (in progress)

`hybrid-planner.js` adds deterministic contracts for the hybrid approach: the exact unique-edge count for a filled CRAW cuboid, a unique-edge count and face-connected build order for voxel sets, and validation that every peyote round has an even bead count. Joint use is gated on a matching entry marked `physically-tested` in the supplied joint library, with circumference checked against the target face perimeter and tolerance. Existing draft joint templates do not satisfy this gate. This module does not yet segment arbitrary meshes, choose techniques, generate peyote tubes, color shared edges, or emit a complete hybrid build plan.

Not implemented: mesh reconstruction/segmentation, fitted arbitrary peyote tubes, a physically tested joint library, learned technique selection or outcome ranking. Those need physical samples and reviewed data. Current shaping templates and rendering are geometric approximations.

Verification: 84 construction configurations, invalid-joint negative cases, preview pointer/zoom/reset, existing replay/import/export and finished-photo consent checks. Native SVG render inspected. Full-browser responsive visual testing and physical sample builds remain outstanding.

## one continuous pattern sheet (current)

The full guide now starts with a labelled assembly overview. Numbered callouts locate each component and link to its construction step. Every step places its thread chart beside a consistent front-view locator, visible instructions, and explicit parent/child anchor IDs for joins. Join steps remain directly after making their part; continuation markers connect the sequence. The separate replay card is replaced by replay/range/next/show-all controls inside each step, so using replay does not jump to the top or replace another chart. The main model retains its interactive rotation and zoom. Existing diagrams and construction operations are unchanged.

Checked all stage charts, anchor labels, inline replay isolation, existing guide operations, save/import/export, and model controls using the DOM harness. Full-browser visual testing remains outstanding.

## explicit repositioning (current)

Each continuous run of positioning passes now has a green diagram and an exact bead-ID sequence, with its previous exit/new-thread start and next pickup/pass stated. These are derived from actual operations, not generated prose. Joint charts show the full participating parts together, labelled by name, using the same anchor IDs and traversal order. Main instructions are shortened and the original detail remains expandable. Replay remains inside each step. DOM checks verify route presence, multiple-part joins, unchanged pass order and existing guide behavior.

## fewer travel passes + quieter charts (current)

Attachment selection now strongly prioritizes shorter existing-bead routes, while retaining anchor-distance limits, reinforcement and passage budgets. The standard frog drops from 32 to 25 repositioning passes (175 to 168 total reuses), keeping 116 beads and one working line. Not every design has fewer passes: the butterfly trades four additional passes for one working thread instead of two. Stitch-forming and reinforcement passes remain intact.

Inline charts now fade completed routes and emphasize the current pass in replay, with a prominent next-action instruction. All bead locations remain visible in the overview. Parts guide version 11 resets older replay positions because traversal sequences changed. 84 construction combinations and the frog route regression are checked; physical sampling is still needed.

## visual-first guidance (current)

Chart labels are optional. A green starting dot and directional arrow point through the actual next bead's hole; a pink ring identifies that bead (dashed when adding). The target advances using the planner's operations and clears when the step finishes. Exact positioning sequences and attachment numbers remain in expandable details. Parent/new-part diagrams and full scrolling pattern remain available.

## maker tools (current)

A compact toolbar offers continue-to-first-unfinished and a supply checklist. Step checkmarks are reversible and do not hide diagrams. Supply quantities group by material and color, include 10% spare beads, distinguish 4 mm eyes from seed beads, and show existing estimated thread lengths. Download a plain-text supply list from the checklist.

Completion and packing state are included in project JSON and browser project saves. A changed construction/route/palette resets the checklist, and newly generated designs start fresh. Verified counting, finish/undo, checklist updates and export/import persistence with the DOM harness.

## attachment close-ups (current)

Every joint now includes enlarged, sequential views of the actual two anchor beads. Each panel adds one planned reinforcement pass and shows its hole direction, with the existing part and new part distinguished. Directions are derived from the operation's entrance/exit, not invented instructions. Repositioning diagrams remain before the close-up. The display explicitly notes that the enlarged gap is diagrammatic; the parts should be brought together and the loop snugged. No routes or bead counts changed. Checked all displayed close-up passes against the generated joint operations.
