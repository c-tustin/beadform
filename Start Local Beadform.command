#!/bin/zsh
cd -- "${0:A:h}"
export PATH="/usr/local/bin:$PATH"
node start-local-beadform.mjs
