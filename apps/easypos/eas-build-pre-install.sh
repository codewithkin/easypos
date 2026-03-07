#!/bin/bash
# Install bun
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"

# Install dependencies using bun from the root
cd ../../
bun install
