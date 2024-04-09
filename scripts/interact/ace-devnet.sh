#!/bin/bash
set -e +u
set -o pipefail

export RPC_URL=http://20.197.51.29:8545
# export RPC_URL=https://rpc-endurance-devnet.cmonnode.com/

yarn hardhat run scripts/interact/interact-ace-devnet.js --network ace_test