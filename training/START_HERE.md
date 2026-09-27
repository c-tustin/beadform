# Start the training dataset with no images

You can start with text prompts and generated Beadform scenes. The repository contains 21 candidates in [`candidates.jsonl`](candidates.jsonl). The approved seed has 13 examples, with fish excluded; a new batch of seven designs is awaiting your review. All examples are text-only.

## Review the starter batch

All 21 candidates pass the digital compiler check; the 13 you approved are in the seed and fish is excluded. The newest seven need your review before they can be used. You do not need to collect images for the text-to-scene path. Thirteen approved examples are still too few for a useful fine-tune. Add more distinct families before training, especially if you want image-conditioned generation.

| Candidate | Compiler beads | Decision | Current prompt |
| --- | ---: | --- | --- |
| frog | 116 | kept | a small frog bead animal with a rounded body and simple features |
| fish | 49 | excluded | a small fish bead animal with a rounded body and simple features |
| bunny | 134 | kept | a small bunny bead animal with a rounded body and simple features |
| bear | 196 | kept | a small bear bead animal with a rounded body and simple features |
| butterfly | 82 | kept | a small butterfly bead animal with a rounded body and simple features |
| turtle | 139 | kept | a small turtle bead animal with a rounded body and simple features |
| bird | 126 | kept | a small bird bead animal with a rounded body and simple features |
| flower | 109 | kept | a simple bead flower with five pink petals, a yellow center, green stem, and two leaves |
| mushroom | 65 | kept | a small red bead mushroom with a cream stem and three pale cap spots |
| cactus | 137 | kept | a small potted bead cactus with two arms and a pink flower |
| house | 49 | kept | a tiny bead cottage with a green roof, door, and two blue windows |
| rocket | 138 | kept | a small red and white bead rocket with two fins and a round blue window |
| whale | 84 | kept | a friendly blue bead whale with a tail, two flippers, and a small water spout |
| snail | 66 | kept | a tiny bead snail with a spiral shell, two eyestalks, and a green body |
| penguin | 72 | review | a little black and white bead penguin with orange feet and a tiny orange beak |
| octopus | 52 | review | a friendly purple bead octopus with a round head, four short curling arms, and two eyes |
| pear | 32 | review | a simple green bead pear with a short brown stem and one leaf |
| robot | 124 | review | a small friendly bead robot with a square head, boxy body, two arms, and blue eyes |
| sailboat | 31 | review | a simple red and blue bead sailboat with one white sail and a tall mast |
| train | 132 | review | a tiny green bead train engine with a round boiler, a chimney, and two wheels |
| cloud | 129 | review | a soft white bead cloud with three blue raindrops underneath |

Use one row per design family. Images are optional. With no images, this dataset teaches text-to-scene generation only; it does not teach the model to interpret pictures.

For any row you accept, copy it to your review file and update all of the following only after doing the corresponding work:

- `reviewed: true` after you personally inspect and approve the prompt and corrected scene.
- `training_consent: true` only if you want that example used for training.
- `scene_validated: true` only after the final corrected scene passes the Beadform compiler. Re-run the compiler after any scene edit.
- Keep `image: null` for text-only examples. If you later add an image, use an original or appropriately licensed input image and keep its path relative to the JSONL file.

To check a corrected JSONL file locally, run `node training/validate_review.cjs path/to/review-queue.jsonl` from the project folder. This reports compiler results but does not edit or approve the data. Set `scene_validated: true` only for rows that pass after your final edits.

Do not edit `candidates.jsonl` to approve examples. The dataset tools deliberately reject rows with missing or false approval flags. The 13 approved examples are still a small seed. Add distinct examples over time and keep whole design families held out for evaluation.

## Next steps

1. Use the [free Colab notebook](https://colab.research.google.com/github/c-tustin/beadform/blob/runpod-training-guide/training/colab_free.ipynb) for the base-model preview. It can copy the approved text-only seed to your Drive.
2. Add more original, reviewed examples over time; include original reference images only when you want to train image-conditioned generation.
3. Fine-tune only after the dataset has enough approved examples across families for training and held-out evaluation.

No images need to be collected or uploaded to try the text-only preview. Do not use outputs from the base-model preview as correct labels until you review and validate them yourself.
