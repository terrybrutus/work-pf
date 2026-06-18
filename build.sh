#!/usr/bin/env bash
set -euo pipefail

MOC="/home/ubuntu/.motoko/moc/0.16.3-caffeine-4/bin/moc"
BASE="/home/ubuntu/.motoko/base/0.16.0"

if [ ! -x "$MOC" ]; then
  echo "Error: Motoko compiler not found at $MOC" >&2
  exit 1
fi

if [ ! -d "$BASE" ]; then
  echo "Error: Motoko base library not found at $BASE" >&2
  exit 1
fi

corepack pnpm install --no-frozen-lockfile --prefer-offline --child-concurrency 2 --network-concurrency 6
mkdir -p src/backend/dist

"$MOC" \
  -c \
  --idl \
  --stable-types \
  --default-persistent-actors \
  -no-check-ir \
  --actor-idl src/backend/system-idl \
  --package base "$BASE" \
  src/backend/main.mo \
  -o src/backend/dist/backend.wasm \
  --public-metadata candid:service \
  --public-metadata candid:args

corepack pnpm --filter "@caffeine/template-frontend" build:skip-bindings

mkdir -p /workdir/src/frontend/
mkdir -p /workdir/src/backend/
mkdir -p /workdir/.dfx/

cp -rf src/frontend/dist/ /workdir/src/frontend/ 2>/dev/null || echo "No frontend dist to copy"
cp -rf src/backend/dist/ /workdir/src/backend/ 2>/dev/null || echo "No backend dist to copy"
cp -rf .dfx/ /workdir/ 2>/dev/null || echo "No .dfx to copy"
