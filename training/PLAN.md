# Beadform model training plan

This plan trains a local vision-language model to propose a Beadform scene from a text description and optional reference image. The deterministic Beadform compiler remains responsible for voxelization, CRAW bead inventory, peyote round counts, routes, joints, and validation. The model must not invent exact bead counts or thread paths.

## Model and scope

- Pilot: `Qwen/Qwen3-VL-2B-Instruct` with QLoRA. The model card lists Apache-2.0. The included trainer adapts language attention and leaves the vision encoder frozen; this is a low-cost first test of structured scene output, not a guarantee that image interpretation will improve.
- Compare: the unchanged base model first, then the LoRA model on the same family-held-out cases. Try the 4B model only if the 2B pilot identifies a clear quality gap and the available GPU fits it.
- Do not train a diffusion model for pattern instructions. Beadform needs structured scene data; the current compiler turns that representation into beadwork.
- Keep technique selection and physical-outcome scoring as later tasks. The current `scene-schema.json` target does not yet represent the complete hybrid plan.

## Data gates

Each supervised scene row needs:

- `training_consent: true`: the data owner approved training use.
- `reviewed: true`: a person corrected and approved the prompt/target pair.
- `scene_validated: true`: the corrected scene passed the current Beadform compiler, not just JSON Schema.
- `group`: a stable design family used for leakage-resistant train/evaluation splits.
- `prompt`, `scene`, and optionally `image`: the original input and corrected scene target.

Record `physically_tested` and `outcome` separately. A digitally valid scene is eligible to teach scene interpretation, but is not proof of a buildable physical pattern. Keep failure/success outcomes for later analysis and a separate scorer. Never include finished photos as the input image in place of the original reference image.

The seven generated candidate scenes are useful fixtures for code paths only. They are not reviewed physical successes and must not be promoted by changing flags. A practical pilot target is about 20–30 independently reviewed designs across several families, with at least two complete families held out; this is a workflow checkpoint, not a promise of generalization. Keep the first physical samples small and use them to define what “successful” means.

## Baseline and training sequence

1. Build a small fixed prompt/image evaluation set, grouped by design family. Include both text-only and reference-image examples if image input matters.
2. Run base Qwen 2B before any training. Save prompts, model revision, raw output, JSON validity, schema validity, compiler result, human edits, and rendered previews.
3. Review and correct training rows; run compiler validation; split whole families into training and evaluation files with `prepare_dataset.py`.
4. Run `train_lora.py --check`, then a short 2B QLoRA smoke run. Save the adapter, processor, package versions, model revision, dataset manifest, and logs.
5. Compare base and tuned model on identical held-out examples. Report schema/compiler pass rates and human edit distance separately. Inspect every output; sample physical builds before claiming the planner works.
6. Stop if the adapter does not beat the base model on held-out families. Add reviewed examples aimed at observed errors instead of generating many unverified synthetic rows.

## Free GPU option: Colab

Use the free tier only if a CUDA GPU is offered and the runtime fits. Its availability, GPU type, quotas, and lifetime are not guaranteed. Upload only the approved training data needed for the run, save outputs before the runtime ends, and do not use it as a persistent web service.

## RunPod option: short paid experiments

RunPod is a practical alternative when a predictable CUDA session is worth a small charge; it is not a free GPU service. As checked 2026-09-26, RunPod lists RTX 4090 Pod rates starting around `$0.34/hour` on Community Cloud and `$0.74/hour` on Secure Cloud. At those listed rates, a two-hour run is about `$0.68` or `$1.48` for compute, before storage, taxes, startup time, or rate/availability changes. Verify the selected GPU and final price in the RunPod console before deploying. RunPod requires at least one hour of credits for an on-demand Pod and bills compute and storage by the second.

Suggested first run:

1. Create a Pod from a current PyTorch/CUDA template and choose one 24 GB GPU (for example, an RTX 4090). Use the 2B model first. The 4B model and long image sequences may exceed the available memory; smoke-test before committing to a full run.
2. Attach a small network volume if you need checkpoints to survive Pod deletion or move between machines. It is persistent and billed separately; the current standard rate is `$0.07/GB/month` below 1 TB. Container disk is temporary and is erased when the Pod stops. Volume-disk and network-volume storage can continue to accrue charges while stopped, so export the adapter to your own machine and delete storage you no longer need.
3. Clone the public Beadform repo. Put the approved review JSONL and its original input images under the Pod's `/workspace` path. Run `prepare_dataset.py split` there so its generated absolute image paths point to the Pod, not your Mac.
4. Use the same check/train commands as the Colab route:

   ```sh
   python training/prepare_dataset.py split training/review-queue.jsonl \
     --output training/ready --holdout turtle bird
   python training/train_lora.py --train training/ready/train.jsonl \
     --eval training/ready/eval.jsonl --model Qwen/Qwen3-VL-2B-Instruct \
     --check
   python training/train_lora.py --train training/ready/train.jsonl \
     --eval training/ready/eval.jsonl --model Qwen/Qwen3-VL-2B-Instruct \
     --output /workspace/beadform-qwen-lora
   ```

5. Copy the adapter, processor, frozen environment, dataset manifest, and evaluation results back to your own storage. Confirm the files are present before stopping or deleting the Pod. Stop/delete the Pod and remove unused persistent volumes to end storage charges.

RunPod receives any prompts and images copied to that Pod. Do not upload non-consented or private material. No account, Pod, credit purchase, or cloud data transfer is created by this repository guide.

## Serving after training

The adapter is not a standalone model and the current app's Ollama connection loads an installed base model. First evaluate the adapter with the exact base model and saved processor. Wiring the adapter into Beadform is a separate step; do not assume it can be loaded directly by Ollama. Keep inference local if the goal is to avoid per-request API charges.

## Sources checked 2026-09-26

- [Qwen3-VL-2B-Instruct model card and license](https://huggingface.co/Qwen/Qwen3-VL-2B-Instruct)
- [Qwen3-VL Transformers documentation](https://huggingface.co/docs/transformers/model_doc/qwen3_vl)
- [RunPod GPU pricing](https://www.runpod.io/pricing) and [RTX 4090 rates](https://www.runpod.io/gpu-models/rtx-4090)
- [RunPod Pod billing and storage rates](https://docs.runpod.io/pods/pricing)
- [RunPod network volume behavior](https://docs.runpod.io/pods/troubleshooting/zero-gpus)
- [Colab resource limits](https://research.google.com/colaboratory/faq.html)
