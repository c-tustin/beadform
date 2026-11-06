# Run the trained Beadform model locally

The local studio uses Qwen3-VL-2B-Instruct and the **image-stitch-v1 adapter from Colab**. Everything runs on your computer. There is no paid service or cloud fallback.

Choose **3D animal or object** for a rotatable CRAW sculpture, or **Flat stitch sample** for brick, peyote, ladder, RAW or square stitch. Beadform computes the physical bead inventory and assembly route.

The 32 saved 3D starters work without model generation. **New design with local Qwen** accepts text and optional images, proposes overlapping geometric parts, then validates and voxelizes them. The flat-trained adapter is disabled for that individual geometry request; it remains active for flat stitch requests. This does not retrain the adapter for 3D. New-shape accuracy is experimental, thin details may disappear, and a single image does not reconstruct unseen anatomy. Collapsed or disconnected proposals are rejected. Mixed-stitch 3D planning is not implemented in this local studio; 3D output uses CRAW.

## Start

On this Mac, double-click **Start Local Beadform.command** to start the model and open its local page. Leave its Terminal window open while using the model.

- Drag the 3D view to rotate it, or use the arrow keys. Scroll to zoom.
- Use the step and movement sliders, **Play thread**, or the arrow buttons to follow the route.
- Click a bead to find its pickup step and assembly passage count.
- Read instructions on the page, save a chart or text guide, or print the guide. Raw JSON is kept out of the interface.

Or start both from Terminal:

```sh
node start-local-beadform.mjs
```

The page is at `http://127.0.0.1:8198`. The model API is at `http://127.0.0.1:8197`.

### Command-line generation

Once the private model files are installed in `.local-qwen/`, open Terminal in this folder:

```sh
node local-image-qwen.mjs --serve
```

Leave that running. In another Terminal:

```sh
node local-image-qwen.mjs --image reference.png --prompt "Make a flat triangle, foundation 6 beads, 4 rows."
```

Omit `--image` for text only. Add `--scene` for a new 3D geometry proposal using the base model. The output folder contains `pattern.json` and, for a supported recipe, `bead-chart.svg`. An `unknown` flat result means the model needs a supported design or clearer dimensions. Flat inference verifies that the trained adapter is active; 3D requests explicitly use the base model without that adapter.

On an Intel Mac, inference uses the CPU and may take several minutes. Keep the server bound to its default `127.0.0.1`; the local API has no account login.

## Private adapter setup

Download the final `adapter_model.safetensors` and `adapter_config.json` from the Colab run's `image-stitch-v1/adapter` folder into Downloads. Import and convert with:

```sh
node import-local-image-adapter.mjs
```

The importer preserves the Downloads originals and stores a private copy in the ignored `.local-qwen/adapter/` folder. You can give it a different source folder as an argument. The converter accepts only the previously audited adapter checksum and checks that every tensor survives conversion unchanged. It requires NumPy, safetensors and the GGUF Python package from the matching llama.cpp source. The local installation uses llama.cpp build 12119, commit `6f1e6543704bc5b080c7a98e7b6f707b31f6ed51`.

The official Qwen GGUF files come from revision `52d6c8ffea26cc873ac5ad116f8631268d7eb503` of `Qwen/Qwen3-VL-2B-Instruct-GGUF`: `Qwen3VL-2B-Instruct-Q8_0.gguf` and `mmproj-Qwen3VL-2B-Instruct-F16.gguf`. Quantization and the local runtime can change model behavior; the Colab evaluation scores do not establish local accuracy.

Patterns use 11/0 round seed beads and 0.20 mm thread, preferring at most five assembly passages per bead. The ledger excludes unplanned finishing and reinforcement. Test a physical sample before relying on a pattern.

The 3D planner starts another working thread section if needed to avoid extra travel through a bead. Those starts and finishes still require a tested physical method. Digital route checks do not establish hole capacity, tension, needle access, strength or a stable finished sculpture.

Developer check: `node check-local-studio.mjs` walks every starter's route independently to check pickup order, hole-to-hole continuity, exact bead inventory, face attachments and recomputed assembly passage counts.
