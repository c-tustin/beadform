# qwen + beadform

## run the app without a paid api

recommended starting model: Qwen/Qwen3-VL-4B-Instruct, an apache-2.0 vision-language model. this is a candidate to evaluate, not a model already trained to make bead patterns. ollama's qwen3-vl:4b is the convenient local distribution. it needs a roughly 3.3 gb download plus additional working memory; download size is not total ram required. if memory is tight, try qwen3-vl:2b. the 8b model is another candidate when resources allow.

1. install node.js 22+ and ollama: https://ollama.com/download
2. open ollama. in terminal run:

```sh
ollama pull qwen3-vl:4b
```

3. open terminal in the extracted beadform folder, then run:

```sh
node launch-qwen.mjs
```

keep both ollama and that terminal running. use the browser address the launcher opens. no api key is needed. first generation can take several minutes. this connection uses only localhost and keeps the provided images on your computer. after downloading software and model weights, inference does not need internet.

for a smaller model, download it first and use this mac/linux command:

```sh
OLLAMA_MODEL=qwen3-vl:2b node launch-qwen.mjs
```

on windows powershell:

```powershell
$env:OLLAMA_MODEL='qwen3-vl:2b'
node launch-qwen.mjs
```

normal launch.mjs retains the existing openai connection. local qwen makes no paid-service fallback. the standalone html cannot run a language model by itself; use the local server. if a model is missing, open the generation settings for setup instructions. if memory runs out, close other heavy apps or try the 2b model. this is local software without per-request api fees, not free hosted gpu capacity.

## what to teach

train the model to map an input description and optional image to the corrected scene-schema.json structure. the app compiles that into beadwork and performs its construction checks. do not train a model to invent arbitrary thread routes. the current compiler still limits what shapes and stitch constructions can be expressed; fine-tuning cannot remove those limits.

use your own original or appropriately licensed designs and explicitly approved data. for each example retain the input, corrected scene, photos of the finished build, any corrections, and actual build outcome. use the original input image for image-to-design training. using only finished beaded photos would teach a narrower reconstruction task. photos do not establish a physically valid thread route by themselves.

beadform-approved-builds.jsonl is feedback, not a ready-to-train file. its projectAtUpload may predate physical corrections. review and correct the target first. unfinished/unreviewed projects are not successful targets. the starter deliberately refuses rows without review, physical testing and training permission.

## prepare a small supervised dataset

create training/train.jsonl and training/eval.jsonl, one json object per line. fields:

- group: animal or design family, e.g. frog. every variation/photo of the same design stays in one split. reserve whole families for evaluation.
- prompt: the user's original description.
- image: optional local path relative to this jsonl file, pointing to the input image.
- scene: the complete corrected scene object, following scene-schema.json.
- training_consent, reviewed, physically_tested: true only when actually established.

training/example-unreviewed.jsonl demonstrates the format with a generated frog target. it is deliberately unapproved and is not evidence of a successful physical build. replace it with reviewed examples; do not merely flip its flags.

start with a small curated pilot, compare it with the base model and with prompted examples, and expand only when those results reveal a gap. more unverified generated examples can reinforce mistakes.

## qlora starter

training/train_lora.py uses 4-bit frozen base weights plus rank-16 lora adapters on language attention. it leaves the vision encoder frozen, uses batch size 1, gradient accumulation 8, and masks the input so loss is computed on the target answer. no tracking service or dataset upload is enabled. one epoch and learning rate 1e-4 are starting experiments, not an optimized recipe.

this recipe requires a single nvidia cuda gpu. use a gpu notebook or compatible workstation, not a mac cpu. free notebook gpus are limited and not guaranteed. memory depends on image resolution, context and model size; a free session may not fit this workload. the script limits image size and refuses excessively long examples rather than truncating image tokens.

in a fresh gpu environment with a compatible pytorch installation, from the project folder:

```sh
python -m pip install -r training/requirements.txt
python training/train_lora.py --train training/train.jsonl --eval training/eval.jsonl --check
python training/train_lora.py --train training/train.jsonl --eval training/eval.jsonl --output beadform-qwen-lora
python -m pip freeze > training-environment.txt
```

first run a tiny smoke experiment. inspect that trainable parameters are only the intended adapters, loss is finite, and held-out generations remain valid json. the adapter and processor are saved in beadform-qwen-lora. save that folder and your working environment before a notebook session expires. the model download happens on the first real training run, not --check.

this starter passed python syntax checks and the unreviewed-data rejection check, but has not been executed on a gpu. full schema validation also needs the jsonschema dependency installed. dependency ranges must be resolved and tested in your training environment. if the chat template changes, the script stops rather than silently masking the wrong tokens.

## evaluation and deployment

compare the base and tuned model on the same held-out prompts/images. measure valid scene output, recognizable silhouette, bead count, attachment placement, route/pass constraints, and actual build success. review the full rendered instructions and make physical samples. validation loss alone does not measure buildability.

the saved adapter is not a standalone model and does not automatically change ollama. load the exact base model with transformers, attach it with peft.PeftModel.from_pretrained(base_model, adapter_path), and use the saved processor for evaluation. serving that tuned model or exporting a supported merged/quantized model is a separate deployment step; do not assume any vision adapter imports directly into ollama. the included app currently connects to ollama's installed base model.

codex is useful for dataset cleanup, training scripts, evaluation tooling, and connecting your eventual inference server. actual training requires your gpu environment and reviewed data. do not share api keys in chat.

sources:
- model and license: https://huggingface.co/Qwen/Qwen3-VL-4B-Instruct
- local model variants: https://ollama.com/library/qwen3-vl
- local chat api: https://docs.ollama.com/api/chat
- qwen architecture: https://huggingface.co/docs/transformers/model_doc/qwen3_vl
- lora: https://huggingface.co/docs/peft/main/en/conceptual_guides/lora
- vision training considerations: https://huggingface.co/docs/trl/main/en/sft_trainer
- alternative guided notebooks: https://unsloth.ai/docs/models/tutorials/qwen3-how-to-run-and-fine-tune/qwen3-vl-how-to-run-and-fine-tune
- free compute limits: https://research.google.com/colaboratory/faq.html

## new: dataset review tools

see `training/dataset-research.md` for the source-by-source research, seven original review candidates, feedback-to-review conversion, and family-level splitting. `training/prepare_dataset.py` keeps finished photos separate from original input images and refuses to approve builds automatically. start the gpu experiment with `--model Qwen/Qwen3-VL-2B-Instruct` if resources are limited. no training has run yet.
