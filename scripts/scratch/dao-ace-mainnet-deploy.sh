#!/bin/bash
set -e +u
set -o pipefail

source ../../.env
# bash scripts/scratch/dao-ace-mainnet-deploy.sh

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

export NETWORK_STATE_FILE="deployed-${NETWORK}.json"

bash ./dao-deploy.sh

npx hardhat run ../interact/interact-init-mainnet.js