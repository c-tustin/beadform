# Beadform for iPhone — native app draft

This is a SwiftUI source draft for an iPhone app that eventually runs Qwen on the device. It does not connect to the Mac server or any cloud service. The sample guide, local model-file import and saved-pattern library are implemented. Qwen inference is deliberately disabled until its native runtime is integrated and tested.

## Open the draft

Open `ios/Beadform.xcodeproj` in Xcode. Choose an iPhone simulator, then Run. To run on your phone, select your signing team and connected iPhone. Deployment target: iOS 17. No third-party dependencies are required for the draft screens.

Use **Open 18-bead sample**, follow the four steps, then **Save on this iPhone**. The Patterns tab reloads saved drafts after restart. The Model tab imports GGUF files through Files and stores them in Application Support; file presence is not reported as successful model loading. Importing large files is a draft implementation and still needs background copy/progress and storage checks before release.

## On-device Qwen implementation plan

- Integrate a pinned llama.cpp iOS XCFramework, or use a native React Native binding if the app is later ported. The current SwiftUI draft does not include either runtime.
- Reuse the exact base-model, vision projector and trained adapter pairing; verify hashes before loading. Do not silently replace the trained stitch selector with the base model.
- Benchmark the current Qwen3-VL 2B Q8 model on a physical iPhone first. Current model assets total approximately 2.5 GB on disk; runtime memory is additional and has not been measured on iPhone. Smaller quantization requires a fresh adapter-compatibility and quality evaluation.
- Port the shared `stitch-programs.mjs` compiler and independent `pattern-checker.mjs` to a portable module or local JavaScriptCore context. The Swift brick sample mirrors a single existing recipe; it is not a replacement checker for arbitrary AI output.
- Constrain the output to the existing recipe schema and reject unsupported shapes, invalid dimensions and inconsistent thread routes before showing a pattern.
- Enable the Generate button only after model loading and a local inference smoke test succeed. Include cancel, memory-failure recovery, background interruption and unload behavior.
- Implement a verified, resumable one-time download, or import pre-downloaded assets using Files. All requests, photos, patterns and model inference stay on the device after setup.
- Add photo input only after projector compatibility and memory use have been tested. Keep 3D experimental; begin with flat samples.

## Acceptance checks before calling this an offline Qwen app

On a physical iPhone: install/import the model, enable airplane mode, cold-launch, generate a new supported design, independently check it, save it, force-quit, reopen and resume. Verify no network requests or Mac connection, record peak memory and latency, test backgrounding/cancellation, corrupt model files and low storage. Make physical bead samples separately.

## Verification in this workspace

The development machine has no full Xcode installation. Swift syntax and the Xcode project format pass validation. The Swift sample executes, and its 18-bead inventory plus all bead/bridge movement sequences match the existing compiler. The browser preview’s navigation, guide and saved-pattern persistence were checked. The native target has not been built or device-tested. Run `node mobile-preview.mjs` from the project root, then open `http://127.0.0.1:8199` for a browser preview; it only demonstrates the mobile interaction and sample and never simulates successful Qwen generation.

Reference: [llama.cpp mobile example](https://github.com/ggml-org/llama.cpp/tree/master/examples/llama.swiftui), [native binding capabilities](https://github.com/mybigday/llama.rn).
