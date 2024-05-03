const { task } = require("hardhat/config");

task("add-operator", "Add validator operator")
  .addParam("name", "The operator name")
  .addParam("address", "The operator reward address")
  .setAction(async (taskArgs, { ethers }) => {
    const getContracts = require("../scripts/interact/loader");

    const GAS_INFO = {
      gasLimit: 1000000,
      gasPrice: 100000,
    };

    const OPERATOR_NAME = taskArgs.name;
    const OPERATOR_ADDRESS = taskArgs.address;

    const loader = await getContracts();

    console.log();
    console.log("- name:", OPERATOR_NAME);
    console.log("- address:", OPERATOR_ADDRESS);

    await loader.NodeOperatorsRegistry.contract.addOperator(
      OPERATOR_NAME,
      OPERATOR_ADDRESS,
      GAS_INFO
    );

    console.log();
    console.log("Complete.");
  });

task("add-key", "Add validator singing keys")
  .addParam("operator", "The operator id")
  .addParam("file", "Operator signing keys file path")
  .setAction(async (taskArgs, { ethers }) => {
    const fs = require("fs");
    const path = require("path");
    const getContracts = require("../scripts/interact/loader");
    const { hexConcat } = require('../scripts/interact/utils')

    const NODE_OPERATOR_ID = taskArgs.operator;
    const DEPOSIT_DATA_FILE = path.resolve(__dirname, "../" + taskArgs.file);

    const loader = await getContracts();

    const KEY_DATA = JSON.parse(fs.readFileSync(DEPOSIT_DATA_FILE, "utf-8"));
    const pubkeys = KEY_DATA.map((data) => data.pubkey);
    const signatures = KEY_DATA.map((data) => data.signature);
    const KEY_COUNT = pubkeys.length;

    console.log();
    console.log("Add signing keys...");
    console.log("- count:", KEY_COUNT);

    await loader.NodeOperatorsRegistry.contract.addSigningKeys(
      NODE_OPERATOR_ID,
      KEY_COUNT,
      hexConcat(...pubkeys),
      hexConcat(...signatures),
      GAS_INFO
    );

    console.log();
    console.log("Complete.");
  });

task("get-keys", "Get validator singing keys")
  .addParam("operator", "The operator id")
  .addParam("start", "The start index")
  .addParam("end", "The end index")
  .setAction(async (taskArgs, { ethers }) => {
    const getContracts = require("../scripts/interact/loader");

    const GAS_INFO = {
      gasLimit: 1000000,
      gasPrice: 100000,
    };

    const NODE_OPERATOR_ID = taskArgs.operator;
    const START = taskArgs.start;
    const END = taskArgs.end;

    const loader = await getContracts();

    console.log();
    console.log("Get validator singing keys...");
    const signingKeys = await loader.NodeOperatorsRegistry.contract.getSigningKeys(
      NODE_OPERATOR_ID,
      START,
      END,
      GAS_INFO
    );
    console.log("- Signing Keys:", signingKeys);
  });

task("event-log", "Interact with mainnet event logs")
  .addParam("event", "The event to trace")
  .addParam("contract", "The contract to trace")
  .setAction(async (taskArgs, { ethers }) => {
    const fs = require("fs");
    const path = require("path");
    const getContracts = require("../scripts/interact/loader");

    const EVENT = taskArgs.event;
    const contract = taskArgs.contract;

    console.log()
    console.log('- Event:', EVENT)
    console.log('- Contract:', contract)
    console.log()

    const loader = await getContracts();
    const CONTRACT = loader[contract].contract;
    const CONTRACT_ADDRESS = loader[contract].address;
    const CONTRACT_NAME = loader[contract].name;

    const dir = path.resolve(__dirname, "../lib/abi", `${CONTRACT_NAME}.json`);
    const file = fs.readFileSync(dir, "utf8");
    const abi = JSON.parse(file);

    const filter = {
      address: CONTRACT_ADDRESS,
      fromBlock: 0,
      toBlock: 10000000,
      topics: [CONTRACT.filters[EVENT]().topics]
    };

    const logs = await ethers.provider.getLogs(filter);

    const iface = new ethers.utils.Interface(abi);
    logs.forEach((log) => {
      console.log();
      console.log("decoded event");
      console.log("- log index:", log.logIndex);
      console.log("- transaction index:", log.transactionIndex);
      console.log("- block number:", log.blockNumber);
      console.log("- transaction hash:", log.transactionHash);
      console.log("- data:", iface.decodeEventLog(EVENT, log.data, log.topics));
    });
  });

module.exports = {};
