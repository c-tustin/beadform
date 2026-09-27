# Beadform Qwen training plan: free Colab only

This plan fine-tunes a vision-language model to propose a Beadform scene from a text description and optional reference image. The deterministic Beadform compiler remains responsible for geometry, bead inventory, thread routes, joints, and construction validation. The model must not invent exact bead counts or thread paths.

All hosted GPU work in this plan uses only the Colab free tier when Google offers an eligible GPU runtime. There is no paid GPU, paid Colab plan, cloud VM, or storage purchase in this workflow. GPU access and runtime limits vary and are not guaranteed. If a free GPU is unavailable or cannot fit the pilot, pause and retry later with the same account; never work around Colab's usage limits.

## Model and scope

- Pilot only: `Qwen/Qwen3-VL-2B-Instruct` with 4-bit QLoRA. Its model card lists Apache-2.0. The trainer adapts language attention and freezes the vision encoder. This tests structured scene output; it does not guarantee better image interpretation.
- Keep technique selection and physical-outcome scoring as later tasks. The current scene schema does not encode the full hybrid plan.
- `candidates.jsonl` contains 14 synthetic text-only drafts. The user approved all except fish; `approved-seed.jsonl` contains the 13 accepted rows. All pass digital compiler validation, but none has been physically built.

## Data gates

Every training and evaluation row must have:

- `training_consent: true`: the data owner approved use for training.
- `reviewed: true`: a person corrected and approved the original input and target scene.
- `scene_validated: true`: the corrected scene passed the Beadform compiler, not only JSON Schema.
- `group`: a stable design family, so every version of a family stays in one split.
- `prompt`, `scene`, and optionally `image`: the original input and corrected scene target.

Keep `physically_tested` and `outcome` as separate real-world evidence. A digitally validated scene is not a proven physical pattern. Finished photos may help document an outcome but must not replace the original reference image as the model input. Do not change approval flags just to make the notebook run.

The approved seed now has 13 examples across 13 families. That is enough to prepare the workflow and run a base-model preview, but still too small for a useful fine-tune. Add distinct approved examples before training, and reserve at least two full families for evaluation. The notebook copies the approved seed to Drive only if no user-provided review queue exists; it never promotes the excluded fish candidate.

## Free Colab workflow

Open [`colab_free.ipynb`](colab_free.ipynb) in Colab and select a free GPU runtime manually. The notebook checks for CUDA and stops if none is available. It does not upgrade an account, buy compute, create another account, or provision any other resource.

Colab's free resources are dynamic. Google currently documents runtimes of up to 12 hours, depending on availability and usage; GPU type, access, idle timeout, and actual lifetime can vary. Use the notebook interactively, save artifacts to your own Drive, and resume from the latest checkpoint in a later eligible session. Do not use keep-alive tricks, extra accounts, or a notebook-hosted web service to bypass these limits.

The notebook has two independent paths:

1. **Base-model preview:** load the 2B model in 4-bit and save a few exploratory text outputs to Drive. These are for inspection only; they are not approved labels, evaluation results, or training data.
2. **Training:** mount Drive yourself, extend the approved seed in `review-queue.jsonl` with more reviewed examples and any original input images, choose held-out families, split and preflight the data, then run QLoRA. Checkpoints save after every optimizer step to the Drive output folder, and `--resume` continues from the newest one.

The notebook installs Python packages into its temporary Colab runtime but leaves Colab's provided PyTorch/CUDA build in place. A fresh runtime may need to download the Qwen base weights again. Images and datasets are not uploaded by this repository; you choose what to put in Drive and what to run.

## Baseline, training, and review sequence

1. Run the exploratory base preview to make sure the free GPU can load Qwen 2B and produce schema-like text.
2. Add more consented, reviewed rows to the 13-example approved seed; run the Beadform compiler on each corrected target and mark `scene_validated` only after it passes.
3. Keep complete design families out of training. Run the notebook's dataset split and `train_lora.py --check` before downloading training weights.
4. Run the short QLoRA pilot. Save the adapter, optimizer checkpoints, processor, frozen package list, model identifier, dataset version, and logs on Drive. If a runtime ends, reconnect later and resume from the same output folder.
5. Compare tuned outputs with the unchanged base outputs on the same held-out families. Inspect JSON/schema validity, compiler validity, human edits, and physical outcomes separately.
6. Stop if the adapter does not improve held-out results. Add reviewed examples aimed at observed errors rather than expanding with unverified generated targets.

## Serving after training

The adapter is not a standalone model and does not automatically change Beadform's current Ollama setup. Evaluate it with the exact base model and saved processor first. Wiring it into Beadform is a separate step; keep inference local if avoiding per-request API charges is a goal.

## Sources

- [Qwen3-VL-2B-Instruct model card and license](https://huggingface.co/Qwen/Qwen3-VL-2B-Instruct)
- [Qwen3-VL Transformers documentation](https://huggingface.co/docs/transformers/model_doc/qwen3_vl)
- [Google Colab resource limits, free-tier policies, and runtime behavior](https://research.google.com/colaboratory/faq.html) (checked 2026-09-27)
