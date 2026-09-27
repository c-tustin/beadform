#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Install Node.js 22 or newer from https://nodejs.org/en/download, then open this launcher again."
  open "https://nodejs.org/en/download"
  read -r -p "Press Return to close this window. " beadform_answer
  exit 1
fi
node launch.mjs
