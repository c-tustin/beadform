# Beadform: free Qwen workflow

## Start here

- [Run the free schema benchmark in Colab](https://colab.research.google.com/github/c-tustin/beadform/blob/runpod-training-guide/training/colab_schema_benchmark.ipynb): no Google Drive or API key needed.
- [Compare saved adapters in Colab](https://colab.research.google.com/github/c-tustin/beadform/blob/runpod-training-guide/training/colab_compare_adapters.ipynb): mounts your own Drive and compares the existing pilot adapters.
- [Training notebook](https://colab.research.google.com/github/c-tustin/beadform/blob/runpod-training-guide/training/colab_free.ipynb): use reviewed targets and save checkpoints to your own Drive.

Choose a GPU only when Colab offers it on the free tier. If unavailable, stop and retry later with the same account. These workflows do not purchase compute or provision RunPod.

## Current evidence

Base `Qwen/Qwen3-VL-2B-Instruct` with 4-bit loading, greedy generation, a 4096-token budget and **bounded schema decoding** produced 12/12 valid responses on twelve fresh original prompts. An offline whole-response JSON audit also passed 12/12. No repairs or new training were needed for this result.

This is a small structural benchmark. Some outputs omit requested features or have overlapping geometry. A schema-valid scene is not automatically a recognizable subject, a compiler-valid plan, or a physically tested bead pattern. Predictions in the results folder are evaluation evidence, not approved training targets.

See [experiment report](results/2026-10-16-schema-experiments.md), [strict JSON audit](results/2026-10-17-strict-json-audit.md), and [raw predictions](results/2026-10-16-fresh-12-bounded-base.jsonl).

## Reuse the configuration for your own text prompts

Create a JSONL file with one original prompt per line:

```json
{"id":"my-example-01","group":"my-design-family","prompt":"Describe the subject, major parts and colors."}
```

Inside the notebook's configured GPU environment:

```sh
python training/evaluate_lora.py --data my-prompts.jsonl --prompts-only --bounded --output my-run/predictions.jsonl --summary my-run/summary.json --resume
```

Use a new output folder when changing data, model, adapter, schema, prompt, or decoding settings. Add `--adapter /content/drive/MyDrive/path/to/adapter` to evaluate a saved LoRA. The evaluator records raw output and separate raw, strict, and repaired scores.

- `schema_pass_rate`: the first extracted outer JSON object passes the original scene schema.
- `strict_schema_pass_rate`: the complete response is one valid JSON object with unique keys and finite numbers, and passes the same schema.
- `repaired_schema_pass_rate`: a separately recorded conservative postprocessor passes the schema. This must not be presented as a raw model score.

Keep development prompts separate from training labels. Reserve new families before tuning. Download results or save them to Drive before the free runtime ends.

## Completed adapter comparison

Both saved adapters completed all twelve prompts before the old runtime expired. Their Drive summaries each report **12/12 strict-schema-valid, zero repairs**, tying the bounded base model. The browser's progress display stopped updating at eight prompts; it did not prove that generation stopped at eight. No restart is needed for this completed comparison.

See [comparison results](results/2026-10-19-bounded-adapter-comparison.md) and [summary data](results/2026-10-19-bounded-adapter-summaries.json). Use the bounded base model as the simplest configuration for the measured schema task; the adapters have no measured schema advantage on these twelve prompts. This does not rank visual quality or physical buildability.

The [pinned resume notebook](https://colab.research.google.com/github/c-tustin/beadform/blob/runpod-training-guide/training/colab_resume_adapter_comparison.ipynb) is retained for recovery reference, and is unnecessary for the completed run.
