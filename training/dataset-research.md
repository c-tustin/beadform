# training data shortlist

reviewed september 21, 2026. no third-party patterns or images were downloaded into this project. this search did not establish a public-domain/cc0 corpus of modern 3d bead-animal instructions paired with successful builds.

| source | what it supplies | decision |
| --- | --- | --- |
| [objaverse, allen institute](https://huggingface.co/datasets/allenai/objaverse/resolve/main/README.md) | 3d objects; metadata identifies each object's license. dataset-wide license is odc-by; individual assets have different terms, including a cc0 subset. | candidate source of animal shapes only. filter individual assets to cc0 and retain provenance before downloading; no bead instructions or validated target plans. |
| [smithsonian open access](https://github.com/Smithsonian/OpenAccess) | cc0 metadata repository with natural-history collections; repository points to its newer aws distribution. | candidate discovery source. metadata licensing alone does not establish the rights of every linked image: check each media item. animal photos need original, reviewed target scenes. |
| [quick, draw!, google creative lab](https://github.com/googlecreativelab/quickdraw-dataset) | labeled hand-drawn sketches across 345 categories | not a bead-pattern dataset. not included under the request to avoid copyrighted source materials; do not treat an open license as public-domain status. |
| [international beading week, beadworkers guild and credited designers](https://beadworkersguild.com/ibw-3d-designs/) | free-to-read 3d beading patterns | excluded: the page retains designer copyright and restricts use to personal use. free access is not permission to build a training corpus. |
| original beadform candidates | seven generated animal scenes and computed construction statistics | included as a review queue, not proven successes. generated targets can reproduce existing planner weaknesses. |

## actual data included

`candidates.jsonl`: frog, fish, bunny, bear, butterfly, turtle and bird. seven examples, seven families, no synthetic count inflation from recolors. fields retain source, scene, compiler statistics and approval flags. these are text-only candidates; they do not yet teach reference-image interpretation. regenerate with `node training/make_candidates.cjs` from the project root.

## collect the missing supervision

for each original design retain the original prompt/reference image, corrected scene, actual build photos, materials, changes and outcome. a finished photograph is evidence to review, not a substitute for the original input or proof of every thread move. collect failures too, but keep them out of successful-target supervised training; they can later support a separate outcome scorer.

start by physically reviewing the seven families and adding independently designed examples. a seven-example set is a workflow pilot, not enough evidence of general animal-design skill. hold entire families out of training, including their photos, recolors and paraphrases. compare the unchanged base model against the adapter on identical held-out inputs. report schema validity, compiler validity, recognizable shape, joint placement, bead count, thread sections, max passes, and physical build results separately.

## prepare exports

from the project folder:

```sh
python training/prepare_dataset.py queue beadform-approved-builds.jsonl --output training/review-queue.jsonl
```

this retains opted-in finished photos for review, preserves consent, and leaves review/scene-validation flags false. fill in the family and original prompt, correct the target scene, and attach the original reference image as `image`. Approval requires real human review and a passing compiler check; do not just flip flags to get past validation. A physical build is separate evidence, not a prerequisite for the scene-generation target.

once each target is reviewed and passes the Beadform compiler, mark `training_consent`, `reviewed`, and `scene_validated` true. `physically_tested` and `outcome` describe separate real-world evidence and are not required for this scene-generation task. Keep unbuilt, failed, and successful outcomes distinct for later analysis; do not label a digitally valid plan a physical success.

once the rows are actually approved:

```sh
python -m pip install jsonschema
python training/prepare_dataset.py split training/review-queue.jsonl --holdout turtle bird --output training/ready
python training/train_lora.py --train training/ready/train.jsonl --eval training/ready/eval.jsonl --check
```

split refuses missing consent, review or scene validation, invalid scenes, duplicate target scenes, missing images and empty splits. use consistent family names. it writes absolute image paths; run the split after the data and images are on the target machine so those paths resolve there. no tool here uploads data or starts training automatically.

## model experiment

use the existing qlora starter with [qwen3-vl-2b-instruct](https://huggingface.co/Qwen/Qwen3-VL-2B-Instruct) first:

```sh
python training/train_lora.py --train training/ready/train.jsonl --eval training/ready/eval.jsonl --model Qwen/Qwen3-VL-2B-Instruct --output beadform-qwen-lora
```

run in the free Colab notebook in `training/colab_free.ipynb`; its GPU access and runtime duration depend on current availability and usage. your intel mac can prepare data and run slow local inference; this QLoRA recipe needs CUDA. the starter has not been GPU-tested and no adapter has been trained or deployed. keep the base-model identifier, resolved package versions and dataset version alongside every adapter. see `../qwen-and-lora.md` for setup and deployment limitations. Do not create another account or use keep-alive workarounds to get around free-tier limits.
