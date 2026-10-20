# Catalog selector development pilot

This experiment trains Qwen to select one of the **32 bundled draft subjects** or return `unknown`. Geometry, counts, stitch routes and joints remain computed by the existing planner. It does not enable a model in the app.

Data is newly authored synthetic text: **128 training prompts** (96 supported, 32 rejection) and **48 development prompts** (32 supported, 16 rejection). Each TSV row holds a subject ID, three training phrases and one development phrase. Rejection categories are fish, unsupported subjects, compositions and ambiguous requests. Fish is excluded from positive targets. The catalog must match `approved-expanded.jsonl` exactly after its existing approval filters and fish exclusion.

These semantic labels have not been reviewed by the user. No physical-success labels, outcome photos or copyrighted pattern instructions are added. The development phrases were authored alongside the training phrases; scores on them are **not independent generalization evidence**. The earlier 15-case semantic probe used a different subject catalog and must not be compared as if it were this benchmark.

## Run for free

Open [the Colab notebook](https://colab.research.google.com/github/c-tustin/beadform/blob/runpod-training-guide/training/colab_catalog_selector.ipynb). It checks for a free CUDA GPU, mounts Drive, records the repository revision and package versions, then runs a base evaluation, two-epoch QLoRA and adapter evaluation. It uses the same Qwen3-VL-2B-Instruct architecture as the prior working GPU recipe. No images or API keys are required.

Results and resumable checkpoints are saved under `MyDrive/Beadform-free-qwen/runs/catalog-selector-v1`. The base model revision and source/data hashes are recorded. A resumed run rejects configuration changes. Completed results are preserved; use a new run directory for another experiment. If the free GPU is unavailable, stop and retry later. Do not upgrade or work around quotas.

Local data check, without downloading a model:

```sh
python3 training/train_catalog_selector.py --output /tmp/beadform-catalog-check --check
```

## Read the results

Compare `base/summary.json` and `adapter/summary.json`, including every rejection category and all raw predictions. Lower training loss alone is not success. The adapter is saved but **never automatically deployed**. Even perfect development selection would only choose an existing unverified draft; it would not establish visual fidelity, physical strength, thread access or reliable generalization.

Before deployment, collect independently written requests and inspect failures, especially false acceptance of fish, composites and unsupported designs. Review the synthetic labels and physically sample the draft patterns separately.

Sources checked October 20, 2026: [official Qwen model card and Apache 2.0 license](https://huggingface.co/Qwen/Qwen3-VL-2B-Instruct), [Colab free-resource limitations](https://research.google.com/colaboratory/faq.html).
