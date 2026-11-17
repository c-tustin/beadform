# Beadform on iPhone

The SwiftUI app now has a native Qwen inference path: a pinned llama.cpp C++ bridge, the existing trained Beadform adapter at scale 1, grammar-constrained recipe output, and the shared flat-pattern compiler and independent checker running locally in JavaScriptCore. No server, API key or Mac connection is used by the app.

Target baseline: **iPhone 14 Pro and newer, iOS 17 or later**. This is an implementation target, not a verified device-support claim. The native inference bridge was tested on the development Mac; an iPhone build, Metal performance, peak memory use and compatibility with individual phones have not yet been tested. Full Xcode is not installed on this Mac, so the app cannot yet be built or installed here. Its command-line Swift compiler is 5.3 and cannot type-check the new Swift concurrency code; use Xcode 15 or newer with the iOS SDK.

## Install on your iPhone

1. Install **full Xcode**, open it once, and install its iOS platform support. The Command Line Tools package alone is insufficient.
2. Double-click **app/Setup iPhone.command** to build the runtime, prepare verified model files, and open Xcode. Alternatively, in the Beadform project folder, run:

   ```sh
   DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer bash app/scripts/prepare-ios-runtime.sh
   ```

   This requires Git, CMake and Node. It checks out llama.cpp at `6f1e6543704bc5b080c7a98e7b6f707b31f6ed51`, builds its iPhone and simulator XCFramework slices, and regenerates compiler resources. Build products stay in ignored directories. To reuse a clean existing checkout at that exact revision, set `BEADFORM_LLAMA_SOURCE` to its absolute path. The Xcode project already links the generated `app/ios/Frameworks/llama.xcframework`.

3. Open `app/ios/Beadform.xcodeproj` in Xcode. Choose your signing team under **Signing & Capabilities**, connect and select the iPhone, then Run. Follow any iPhone trust/Developer Mode prompts. A simulator can exercise the interface, but cannot establish phone memory or GPU behavior.
4. Prepare the model files already installed on this Mac:

   ```sh
   node app/scripts/prepare-iphone-models.mjs
   ```

   The script verifies both SHA-256 hashes and prepares `.local-qwen/iphone-transfer`. AirDrop the two files in that folder to the phone and save them in Files. Do not upload model weights to GitHub.
5. Open the app's **Model** tab. Import the Qwen model and Beadform adapter, then tap **Load Qwen on this iPhone**. Import copies files off the main thread, checks their SHA-256 hashes, preserves an existing file if verification fails, and excludes imported weights from backup. Model loading verifies the files again.
6. In **Create**, enter `A flat brick stitch triangle`, set width **6**, rows **4**, then generate. The expected draft has **18 beads**. Save it under **Patterns**. Enable airplane mode and repeat with a new prompt to verify inference on the phone.

The two input files are:

| File | Purpose |
| --- | --- |
| `Qwen3VL-2B-Instruct-Q8_0.gguf` | Exact audited Qwen base, approximately 1.7 GB |
| `image-stitch-v1.gguf` | Exact matching trained adapter, approximately 12 MB |

The current phone path is **text only**. It does not load the approximately 781 MB vision projector. Images and 3D generation remain outside this implementation. A smaller quantized model must be evaluated with the adapter before changing the pinned manifest; arbitrary GGUF files are intentionally rejected.

## Memory and behavior

- Context is limited to 2,048 tokens, prompt batches to 128 tokens and output to 128 tokens. Requests are independent; previous prompt state is cleared.
- Device builds request Metal offload. The simulator uses CPU; the app also has a **Use CPU only** setting for diagnosis before loading. CPU mode may be slower and is not guaranteed to solve memory limits.
- The disk size is not the runtime memory requirement. Device memory limits are not yet measured; iOS can terminate a process under memory pressure. Close other large apps before the first test.
- Load/import/generation run outside the main actor. Cancel stops work and unloads the model. Backgrounding or a memory warning also cancels and releases model memory; return to Model to load again.
- A generated pattern appears only after complete recipe decoding, exact requested-dimension matching, compilation and digital checks. Unknown and unsupported recipes report a message. The compiler never asks the model to invent thread movements.
- Starting, finishing, tension, needle access and physical strength require separate physical sampling. Digital checks are not physical validation.

## Checks performed

- Compiled and executed the **same C++ bridge** against the pinned runtime and real local Qwen model/adapter on the Mac, without an HTTP server. It returned `{"stitch":"brick","shape":"triangle","width":6,"rows":4}`. That output compiled to an 18-bead, four-step mobile guide.
- Verified unloaded-runtime rejection, cancellation before and during generation, recovery for a subsequent request, and unload behavior.
- Ran the bundled compiler in Apple JavaScriptCore on the Mac against the native Qwen recipe: 18 beads and four steps.
- Compared the generated portable bundle with the production compiler for brick triangles/rectangles, peyote, RAW, square and ladder: inventory, positions, step counts and bead/bridge traversal order match. Invalid dimensions, extra keys and unknown recipes are rejected.
- Xcode project property-list validation, C++ compilation and shell/JavaScript syntax checks pass. **The SwiftUI target has not been built or type-checked with a modern Swift compiler or device-tested.**

To repeat the Mac native test with the existing pinned local libraries:

```sh
bash app/tests/run-native-smoke.sh
```

To regenerate and test the portable compiler after changes to shared modules:

```sh
node app/scripts/bundle-pattern-engine.mjs
node app/tests/check-mobile-engine.mjs
```

Before claiming phone support: build with Xcode, test on the 14 Pro in airplane mode, measure peak memory and latency, test cancel/background/reload, verify saved-pattern persistence and repeat on newer target devices.

## Browser design preview

`node mobile-preview.mjs` serves the earlier interaction preview at `http://127.0.0.1:8199`. It is a browser mockup; its Generate button stays disabled. It does not execute the native app or reflect native runtime status.

Reference: [official llama.cpp iPhone example and XCFramework build instructions](https://github.com/ggml-org/llama.cpp/tree/6f1e6543704bc5b080c7a98e7b6f707b31f6ed51/examples/llama.swiftui).
