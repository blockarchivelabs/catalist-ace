#!/bin/bash
set -e +u
set -o pipefail

export RPC_URL=http://20.197.13.207:8545

yarn hardhat run scripts/interact/interact-ace-mainnet.js --network ace_mainnet