# Image-to-recipe training pilot

Continue the completed text stitch adapter on **140 original synthetic images plus 88 training-only text examples**. Preserve the parent adapter and save a new `image-stitch-v1` adapter in Drive. Use an eligible free Colab GPU only.

The five supported families remain flat peyote, brick, ladder, RAW and square stitch. References depict a simple outline or bead arrangement. Width and row count come from the user's text. Images are illustrative, not scaled diagrams to count. Ambiguous rectangles, circles, whole frogs, multiple parts, unimplemented textures, missing dimensions and incompatible dimensions should request clarification. These examples do not teach whole 3D subjects or arbitrary photo-to-pattern conversion.

## What is included

- 100 positive image training rows and 40 rejection rows; 88 text-retention rows drawn only from the previous training split.
- 28 development image rows and 40 frozen challenge image rows. Positive recipe groups, image seeds and pixel hashes do not cross splits. Train uses filled/outlined charts; development uses a pen-like style; challenge uses another background, jitter and triangle orientation. Some drawing structures are intentionally shared, so this remains a synthetic generalization check.
- A separately reported, previously debugged green-triangle regression. It is not an unseen challenge, and its recipe overlaps existing text training.
- Before/after exact recipe and stitch accuracy; actual compiler success and assembly pass counts; unsupported-case rejection; 22 unchanged text development requests for retention.
- Identical-text/different-image counterfactuals and blank-image ablation. Blank accuracy against original targets is only a reliance diagnostic, not a valid blank-image recipe label.
- Every positive training/evaluation target is compiled before training and must stay within five assembly passages. No start/finish or physical beadability labels are invented.

`examples.jsonl` contains render specifications and RGB pixel hashes. `image_stitch_data.py` creates each image deterministically; no copied photos, tutorials or external design licenses are needed. The contact sheet is regenerated locally by that script for visual review. Do not automatically add user uploads or model generations to this dataset.

The new LoRA continues the previous language-attention adapter using actual image tokens plus text, assistant-only loss, two fixed epochs, seed 43 and a 5e-5 learning rate. The vision tower remains frozen. Model, parent-weight, source, data and environment hashes are recorded. Checkpoints permit an identical run to resume; completed runs are protected. Challenge scores do not choose epochs or promote deployment.

**Completed:** development images improved from 15/28 to 24/28 exact recipes; held-out synthetic images improved from 12/40 to 26/40. Unsupported-input rejection worsened from 9/10 to 6/10, and text retention stayed 21/22. [Full audited results and failures](../results/image-stitch-v1/README.md). The old adapter is preserved and this experiment is not the app default. Neither valid JSON, a lower training loss nor a five-pass assembly ledger proves image accuracy or physical beadability. Inspect failure cases, then try real references separately. The old text model remains available.

[Open the free Colab training notebook](https://colab.research.google.com/github/c-tustin/beadform/blob/main/training/colab_image_stitch.ipynb).

## Try the evaluated adapter

After this run's `comparison.json` exists, use `training/generate_image_stitch.py` with `--adapter /content/drive/MyDrive/Beadform-free-qwen/runs/image-stitch-v1/adapter`, `--image /content/reference.png`, `--prompt "Choose a suitable stitch for this flat reference. Target width 8, total rows 5."`, and a fresh `--output` folder in your Drive. This uses the trained image adapter directly with the same image/text system as evaluation, rather than the earlier vision-description handoff. It refuses the old adapter and refuses an evaluation that has not finished. It does not automatically replace the app model.

Source image uploads remain private to the Colab run and your chosen output folder. A normalized reference, exact model recipe, compiler draft, chart and provenance are saved. No upload is published or added to training automatically. A resized image and generated draft are not physical-success evidence.

## Audit saved evaluation

After completion, `python training/audit_image_stitch_results.py --run /content/drive/MyDrive/Beadform-free-qwen/runs/image-stitch-v1` checks frozen source/data hashes, every saved input and raw prediction, all summaries and comparison bindings, two completed epochs, changed adapter weights, and actual compilation of every distinct predicted recipe. It writes `audit.json` only if these checks pass. The report also counts unique positive targets so repeated image styles are not mistaken for independent pattern specifications. This verifies the experiment's records, not real-world beadability.

## Image-upload interface after evaluation

The notebook's final cell audits every saved prediction, pins the result-tool revision, and opens `colab_image_stitch_try.py`. The interface requires completed evaluation and an audit matching the actual new adapter hash. It displays measured synthetic before/after scores, accepts an image plus explicit bead dimensions, and uses the new image adapter directly. The original adapter and earlier interface remain available. This is an experimental Colab interface, not an automatic app deployment.

The compatible interface includes **Use sample triangle** and a reset that supports Colab ipywidgets 7 as well as 8. The sample generated a verified 18-bead brick draft with at most three assembly passages; it is a known regression, not new held-out evidence. Manual uploads remain supported by the standard upload component; automated native file-picker interaction was not verified.
