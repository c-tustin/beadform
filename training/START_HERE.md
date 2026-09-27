# Start the training dataset with no images

You can start with text prompts and generated Beadform scenes. The repository already contains seven original candidates in [`candidates.jsonl`](candidates.jsonl): frog, fish, bunny, bear, butterfly, turtle, and bird. Each row includes a prompt, a target scene, and the result of a Beadform compiler check. They are still drafts: none is marked as reviewed or approved for training.

## Review the starter batch

Review each candidate in `candidates.jsonl` and decide whether its prompt describes the target scene clearly and whether the design is one you would want the model to produce. Correct scene details or prompt wording that you do not approve. Keep the original candidate unchanged and save corrections as a separate review file.

| Candidate | Compiler beads | Current prompt |
| --- | ---: | --- |
| frog | 116 | a small frog bead animal with a rounded body and simple features |
| fish | 49 | a small fish bead animal with a rounded body and simple features |
| bunny | 134 | a small bunny bead animal with a rounded body and simple features |
| bear | 196 | a small bear bead animal with a rounded body and simple features |
| butterfly | 82 | a small butterfly bead animal with a rounded body and simple features |
| turtle | 139 | a small turtle bead animal with a rounded body and simple features |
| bird | 126 | a small bird bead animal with a rounded body and simple features |

Use one row per design family. For the first pass, you can review only a few candidates; you do not need to accept all seven. Images are optional. With no images, this dataset teaches text-to-scene generation only; it does not teach the model to interpret pictures.

For any row you accept, copy it to your review file and update all of the following only after doing the corresponding work:

- `reviewed: true` after you personally inspect and approve the prompt and corrected scene.
- `training_consent: true` only if you want that example used for training.
- `scene_validated: true` only after the final corrected scene passes the Beadform compiler. Re-run the compiler after any scene edit.
- Keep `image: null` for text-only examples. If you later add an image, use an original or appropriately licensed input image and keep its path relative to the JSONL file.

To check a corrected JSONL file locally, run `node training/validate_review.cjs path/to/review-queue.jsonl` from the project folder. This reports compiler results but does not edit or approve the data. Set `scene_validated: true` only for rows that pass after your final edits.

Do not edit `candidates.jsonl` to approve examples. The dataset tools deliberately reject rows with missing or false approval flags. The current seven examples are enough to begin review and prompt experiments, but are far too few to expect a useful fine-tuned model. Add distinct, reviewed examples over time and keep whole design families held out for evaluation.

## Next steps

1. Inspect and correct the candidates you want to keep.
2. Save approved rows and any original input images in your own Google Drive.
3. Use the [free Colab notebook](https://colab.research.google.com/github/c-tustin/beadform/blob/runpod-training-guide/training/colab_free.ipynb) for the base-model preview first. The notebook does not use the repository candidates as training labels.
4. Fine-tune only after you have enough approved examples across families for both training and held-out evaluation.

No images need to be collected or uploaded to try the text-only preview. Do not use outputs from the base-model preview as correct labels until you review and validate them yourself.
