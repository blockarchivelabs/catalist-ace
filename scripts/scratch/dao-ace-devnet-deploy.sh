#!/bin/bash
set -e +u
set -o pipefail

source ../../.env.dev

if [[ -z "$DEPLOYER" ]]; then
    echo "Must set DEPLOYER env variable" 1>&2
    exit 1
fi
if [[ -z "$RPC_URL" ]]; then
    echo "Must set RPC_URL env variable" 1>&2
    exit 1
fi
if [[ -z "$GATE_SEAL_FACTORY" ]]; then
    echo "Must set GATE_SEAL_FACTORY env variable" 1>&2
    exit 1
fi

bash scripts/scratch/dao-deploy.sh

npx hardhat run scripts/interact/interact-init-devnet.js