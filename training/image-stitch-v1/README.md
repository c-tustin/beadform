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

**Results are pending until `comparison.json` exists.** Neither valid JSON, a lower training loss nor a five-pass assembly ledger proves image accuracy or physical beadability. Inspect failure cases, then try real references separately. The old text model remains available.

[Open the free Colab training notebook](https://colab.research.google.com/github/c-tustin/beadform/blob/main/training/colab_image_stitch.ipynb).
