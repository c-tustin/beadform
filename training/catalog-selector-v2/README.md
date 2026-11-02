> **Completed October 22, 2026.** V2 scored 47/48 on development and 77/80 on the separate synthetic set (the same challenge score as v1). [Results and remaining mistakes](../results/2026-10-22-catalog-selector-v2/README.md). The adapter is not deployed.

# Beadform expanded free Qwen run (v2)

1. Choose **Runtime → Change runtime type → T4 GPU** using the free tier.
2. Run **setup** and connect the same Google Drive if requested.
3. Run **training**. Leave the notebook open while it runs.

This run uses **320 synthetic training requests**, the original **48 development requests**, and a frozen **80-request synthetic challenge**. It selects one of 32 existing draft subjects or `unknown`; fish stays excluded. It does not generate new bead geometry.

The challenge is not used for training or choosing epochs. Compare the base model, the preserved v1 adapter, and the new v2 adapter on the same requests. These authored examples are not an independent user benchmark or proof of beadability.

Saves separately to `MyDrive/Beadform-free-qwen/runs/catalog-selector-v2`; v1 is preserved. Same frozen Qwen model revision, fixed two epochs, language-attention QLoRA only, no automatic deployment. No images, physical-success labels, paid services or quota workarounds. Free GPU availability varies; stop if no GPU is available.

## Data provenance

`extra-train.jsonl` adds 160 supported phrases (five per existing subject) and 32 rejection phrases to the original 128 rows. `challenge.jsonl` contains 64 supported and 16 rejection requests. The loader rejects duplicate IDs or normalized prompts across all three splits and checks label provenance. All new requests are authored synthetic, not individually user reviewed, with physical success unset.

The v1 failures informed the new training phrases and the unchanged development set is therefore a diagnostic, not an unbiased test. The challenge was authored and frozen before v2 training; repeated templates limit what its score can establish. No hyperparameter search or automatic adapter promotion.

`train_catalog_selector_v2.py` records source/data hashes and hashes the preserved v1 adapter, pins base revision `89644892e4d85e24eaac8bacfd4f463576704203`, and saves every prediction. It refuses changed configuration on resume. Known working package versions are pinned separately; Colab's installed PyTorch is retained. A changed environment stops resumption for inspection.
