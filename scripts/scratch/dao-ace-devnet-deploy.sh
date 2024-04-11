#!/bin/bash
set -e +u
set -o pipefail

export DEPLOYER=0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058
export RPC_URL=http://20.197.51.29:8545
# export RPC_URL=https://rpc-endurance-devnet.cmonnode.com/
export GATE_SEAL_FACTORY=0x0000000000000000000000000000000000000000

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

export NETWORK="ace_devnet"
export NETWORK_STATE_FILE="deployed-${NETWORK}.json"
export NETWORK_STATE_DEFAULTS_FILE="deployed-testnet-defaults.json"

# Holesky params: https://github.com/eth-clients/holesky/blob/main/README.md
export GENESIS_TIME=1705568400
export DEPOSIT_CONTRACT=0x6f22fFbC56eFF051aECF839396DD1eD9aD6BBA9D

# export WITHDRAWAL_QUEUE_BASE_URI="<< SET IF REQUIED >>"

export GAS_PRIORITY_FEE="${GAS_PRIORITY_FEE:=1}"
export GAS_MAX_FEE="${GAS_MAX_FEE:=100}"

bash scripts/scratch/dao-deploy.sh
