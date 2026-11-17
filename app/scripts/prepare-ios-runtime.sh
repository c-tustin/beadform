#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd "$(dirname "$0")/../.." && pwd)"
runtime_revision=6f1e6543704bc5b080c7a98e7b6f707b31f6ed51
source_dir="${BEADFORM_LLAMA_SOURCE:-$project_root/.local-qwen/iphone-llama}"
framework_dir="$project_root/app/ios/Frameworks"
if ! xcrun --sdk iphoneos --show-sdk-path >/dev/null 2>&1; then
    echo 'Full Xcode with the iOS SDK is required. Install Xcode, open it once, then run:' >&2
    echo '  DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer bash app/scripts/prepare-ios-runtime.sh' >&2
    exit 1
fi
for tool in git cmake; do
    command -v "$tool" >/dev/null || { echo "Install $tool before building the runtime." >&2; exit 1; }
done
if [[ ! -d "$source_dir/.git" ]]; then
    git clone --no-checkout https://github.com/ggml-org/llama.cpp.git "$source_dir"
    git -C "$source_dir" checkout --detach "$runtime_revision"
fi
if [[ "$(git -C "$source_dir" rev-parse HEAD)" != "$runtime_revision" ]]; then
    echo "Runtime source must be pinned to $runtime_revision; no checkout was changed." >&2
    exit 1
fi
if [[ -n "$(git -C "$source_dir" status --porcelain --untracked-files=no)" ]]; then
    echo 'Runtime source has tracked changes. Use a clean pinned checkout.' >&2
    exit 1
fi
(cd "$source_dir" && bash build-xcframework.sh ios-device ios-sim)
mkdir -p "$framework_dir"
# ditto merges directories; remove only our generated output first to avoid stale slices.
if [[ -e "$framework_dir/llama.xcframework" ]]; then
    mv "$framework_dir/llama.xcframework" "$framework_dir/llama.previous.$(date +%s).xcframework"
fi
ditto "$source_dir/build-apple/llama.xcframework" "$framework_dir/llama.xcframework"
node "$project_root/app/scripts/bundle-pattern-engine.mjs"
echo 'Runtime and compiler resources prepared. Open app/ios/Beadform.xcodeproj in Xcode.'
