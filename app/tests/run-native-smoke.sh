#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd "$(dirname "$0")/../.." && pwd)"
source_dir="${BEADFORM_LLAMA_SOURCE:-$project_root/.local-qwen/llama.cpp}"
libraries="${BEADFORM_LLAMA_LIBRARIES:-$project_root/.local-qwen/runtime/llama-b12119}"
test_dir="$(mktemp -d /tmp/beadform-native.XXXXXX)"
trap 'rm -rf "$test_dir"' EXIT
if [[ "$(git -C "$source_dir" rev-parse HEAD)" != 6f1e6543704bc5b080c7a98e7b6f707b31f6ed51 ]]; then
    echo 'Use the pinned llama.cpp source listed in training/local-image-runtime.json.' >&2
    exit 1
fi
clang++ -std=c++17 -O2 -mmacosx-version-min=13.3 \
    -I "$source_dir/include" -I "$source_dir/ggml/include" \
    -I "$project_root/app/ios/Beadform/Native" \
    "$project_root/app/ios/Beadform/Native/BeadQwen.cpp" \
    "$project_root/app/tests/native-smoke.cpp" \
    -L "$libraries" -Wl,-rpath,"$libraries" -lllama -o "$test_dir/native-smoke"
node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1])).system)' \
    "$project_root/training/local-image-system.json" > "$test_dir/system.txt"
"$test_dir/native-smoke" \
    "$project_root/.local-qwen/models/Qwen3VL-2B-Instruct-Q8_0.gguf" \
    "$project_root/.local-qwen/models/image-stitch-v1.gguf" \
    "$test_dir/system.txt" > "$test_dir/recipe.json" 2> "$test_dir/native.log" || {
        tail -40 "$test_dir/native.log" >&2; exit 1;
    }
clang -fobjc-arc -framework Foundation -framework JavaScriptCore \
    "$project_root/app/tests/check-javascriptcore.m" -o "$test_dir/check-javascriptcore"
"$test_dir/check-javascriptcore" \
    "$project_root/app/ios/Beadform/Resources/pattern-engine.js" "$test_dir/recipe.json"
cat "$test_dir/recipe.json"
node "$project_root/app/tests/check-mobile-engine.mjs" "$test_dir/recipe.json"
echo 'Native model/adapter inference, cancellation, unload and mobile compilation passed on this Mac. iPhone testing is separate.'
