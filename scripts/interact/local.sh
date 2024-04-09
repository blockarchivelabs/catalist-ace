#!/bin/bash
set -e +u
set -o pipefail

export RPC_URL=http://127.0.0.1:8545
# export RPC_URL=https://rpc-endurance-devnet.cmonnode.com/

yarn hardhat run scripts/interact/interact-local.js --network local