const { ethers } = require('hardhat')
const fs = require("fs");
const path = require("path");
const BN = require("bn.js");
const getContracts = require('../scripts/interact/loader')

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const INITIAL_TOKEN_HOLDER = "0x000000000000000000000000000000000000dEaD";
const GAS_INFO = {
  gasLimit: 2000000,
  gasPrice: 200000,
};

let previousReportEventCount = 0;

async function main() {
  const loader = await getContracts();
  const catalist = loader.Catalist.contract;

  const dir = path.resolve(__dirname, "../lib/abi", `${loader.Catalist.name}.json`);
  const file = fs.readFileSync(dir, "utf8");
  const abi = JSON.parse(file);
  const iface = new ethers.utils.Interface(abi);

  const reportFilter = {
    address: loader.Catalist.address,
    fromBlock: 0,
    toBlock: 10000000,
    topics: [catalist.filters['TokenRebased'].topics]
  };


  const reportLogs = await ethers.provider.getLogs(reportFilter);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  if (previousReportEventCount >= reportLogs.length) {
    console.log("No Report Submitted. | ", now.toLocaleDateString(), now.toLocaleTimeString());
  }
  else {
    previousReportEventCount = reportLogs.length;
    console.log("New Report Submitted. | ", now.toLocaleDateString(), now.toLocaleTimeString());

    const filter = {
      address: loader.Catalist.address,
      fromBlock: 0,
      toBlock: 10000000,
      topics: [catalist.filters['TransferShares']().topics]
    };

    const logs = await ethers.provider.getLogs(filter);
    const sharesMap = {};

    logs.forEach((log) => {
      const decodedData = iface.decodeEventLog('TransferShares', log.data, log.topics);
      const from = decodedData.from;
      const to = decodedData.to;
      const sharesValue = new BN(decodedData.sharesValue.toString());

      if (!sharesMap[from]) {
        sharesMap[from] = {
          shares: new BN(0),
          balance: new BN(0),
        };
      }
      if (!sharesMap[to]) {
        sharesMap[to] = {
          shares: new BN(0),
          balance: new BN(0),
        };
      }

      sharesMap[from].shares = sharesMap[from].shares.sub(sharesValue);
      sharesMap[to].shares = sharesMap[to].shares.add(sharesValue);
    });

    delete sharesMap[ZERO_ADDRESS];
    delete sharesMap[INITIAL_TOKEN_HOLDER];
    
    for (const contract of Object.keys(loader)) {
      delete sharesMap[loader[contract].address];
    }

    const totalPooledAce = await catalist.getTotalPooledAce(GAS_INFO);
    const TOTAL_POOLED_ACE = new BN(totalPooledAce.toString());

    const totalShares = await catalist.getTotalShares(GAS_INFO);
    const TOTAL_SHARES = new BN(totalShares.toString());

    for (const account of Object.keys(sharesMap)) {
      if (account !== ZERO_ADDRESS && account !== INITIAL_TOKEN_HOLDER) {
        const balance = sharesMap[account].shares.mul(TOTAL_POOLED_ACE).div(TOTAL_SHARES);
        sharesMap[account].balance = +ethers.utils.formatEther(balance.toString());
        sharesMap[account].shares = sharesMap[account].shares.toString();
      }
    }

    const fileName = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}.json`;
    const filePath = path.resolve(__dirname, `./shares-image-logs/${fileName}`);
    fs.writeFileSync(filePath, JSON.stringify(sharesMap, null, 2));

    console.log("Save share image");
  }

  const delay = (60 - minutes) * 60 * 1000 - seconds * 1000;
  setTimeout(main, delay);
}

main();