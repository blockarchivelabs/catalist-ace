#! /bin/bash

CURRENT_TIME=$(date +"%T")

cd /home/seokwns/workspace/uncommon-project/ace-lido

npx hardhat shares-image --network ace_mainnet >> /home/seokwns/workspace/uncommon-project/ace-lido/task/shares-image-logs/$CURRENT_TIME.txt
