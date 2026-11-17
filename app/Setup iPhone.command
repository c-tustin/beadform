#!/bin/bash
set -euo pipefail
project_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$project_root"
if [[ -d /Applications/Xcode.app/Contents/Developer ]]; then
    export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
fi
if ! bash app/scripts/prepare-ios-runtime.sh; then
    echo 'Setup stopped. Resolve the message above, then run this launcher again.'
    read -r -p 'Press Return to close.'
    exit 1
fi
node app/scripts/prepare-iphone-models.mjs
open app/ios/Beadform.xcodeproj
open .local-qwen/iphone-transfer
echo 'In Xcode, choose your signing team and connected iPhone, then Run.'
echo 'AirDrop the two verified model files to Files on the phone and import them in the Model tab.'
read -r -p 'Press Return to close.'
