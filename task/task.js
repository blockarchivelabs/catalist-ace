const fs = require("fs");
const path = require("path");
const { task } = require("hardhat/config");
const GAS_INFO = {
  gasLimit: 1000000,
  gasPrice: 100000,
};

const DEPLOYER = process.env.DEPLOYER;
const ARAGON_PROXY = [
  "Catalist", "NodeOperatorsRegistry", "AragonKernel", "AragonAcl"
];
const OSSIFIABLE_PROXY = [
  "StakingRouter", "AccountingOracle", "WithdrawalQueueERC721", "CatalistLocator", "ValidatorsExitBusOracle"
];
const NO_PROXY = [
  "DepositContract", "HashConsensusForAccountingOracle", "HashConsensusForValidatorsExitBusOracle", "DepositSecurityModule"
];


task("withdraw-info", "Get withdrawal info")
  .addParam("address", "The account address")
  .setAction(async (taskArgs, { ethers }) => {
    const getContracts = require("../scripts/interact/loader");
    const loader = await getContracts();
    const ACCOUNT = taskArgs.address;

    console.log();
    console.log('- address:', ACCOUNT);
    const withdrawalRequests = await loader.WithdrawalQueueERC721.contract.getWithdrawalRequests(
      ACCOUNT,
      GAS_INFO
    ); 
    const copiedWithdrawalRequests = withdrawalRequests.map((request) => {
      return +request;
    });
    const requestIds = copiedWithdrawalRequests.sort((a, b) => a - b);
    console.log('- Withdrawal Requests:', requestIds);

    const withdrawalStatus = await loader.WithdrawalQueueERC721.contract.getWithdrawalStatus(
      requestIds,
      GAS_INFO
    );
    console.log('- Withdrawal Status:', withdrawalStatus);
    });

task("withdraw-queue-info", "Get withdrawal queue info")
  .setAction(async (taskArgs, { ethers }) => {
    const getContracts = require("../scripts/interact/loader");
    const loader = await getContracts();

    const lastRequestId = await loader.WithdrawalQueueERC721.contract.getLastRequestId(GAS_INFO);
    const lastFinalizedRequestId = await loader.WithdrawalQueueERC721.contract.getLastFinalizedRequestId(GAS_INFO);
    const unfinalizedBACE = await loader.WithdrawalQueueERC721.contract.unfinalizedBACE(GAS_INFO);

    console.log();
    console.log("- last request id:", +lastRequestId);
    console.log("- last finalized request id:", +lastFinalizedRequestId);
    console.log("- unfinalized bACE:", +unfinalizedBACE);
  });

task("set-frame-config", "Set frame config")
  .addParam("epoch", "Epoch per frame")
  .setAction(async (taskArgs, { ethers }) => {
    const getContracts = require("../scripts/interact/loader");
    const loader = await getContracts();

    const EPOCH_PER_FRAME = taskArgs.epoch;
    console.log();
    console.log("- epoch per frame:", EPOCH_PER_FRAME);

    const tx = await loader.HashConsensusForAccountingOracle.contract.setFrameConfig(
      EPOCH_PER_FRAME,
      10,
      GAS_INFO
    );
    const tx2 = await loader.HashConsensusForValidatorsExitBusOracle.contract.setFrameConfig(
      EPOCH_PER_FRAME,
      10,
      GAS_INFO
    );

    console.log();
    console.log("- transaction hash:", tx.hash);
    console.log("- transaction hash:", tx2.hash);

    console.log();
    console.log("Complete.");
  });

task("get-staking-modules", "Get staking modules")
  .setAction(async (taskArgs, { ethers }) => {
    const getContracts = require("../scripts/interact/loader");
    const loader = await getContracts();

    const data = await loader.StakingRouter.contract.getStakingModules(GAS_INFO);
    console.log();
    console.log("- Staking Modules:", data);
  });

task("get-staking-limit", "Get staking limit")
  .setAction(async (taskArgs, { ethers }) => {
    const getContracts = require("../scripts/interact/loader");
    const loader = await getContracts();

    const data = await loader.Catalist.contract.getStakeLimitFullInfo(GAS_INFO);
    console.log();
    console.log("- Staking Limit:", data);
  });

task("set-reward-address", "Set operator reward address")
  .addParam("operator", "The operator id")
  .addParam("address", "The new reward address")
  .setAction(async (taskArgs, { ethers }) => {
    const getContracts = require("../scripts/interact/loader");
    const loader = await getContracts();

    const NODE_OPERATOR_ID = taskArgs.operator;
    const NEW_REWARD_ADDRESS = taskArgs.address;

    console.log();
    console.log("- operator:", NODE_OPERATOR_ID);
    console.log("- address:", NEW_REWARD_ADDRESS);

    const tx = await loader.NodeOperatorsRegistry.contract.setNodeOperatorRewardAddress(
      NODE_OPERATOR_ID,
      NEW_REWARD_ADDRESS,
      GAS_INFO
    );

    console.log();
    console.log("- transaction hash:", tx.hash);

    console.log();
    console.log("Complete.");
  });

task("get-impl", "Get implementation contract address")
  .addParam("contract", "The contract name")
  .setAction(async (taskArgs, { ethers }) => {
    const getContracts = require("../scripts/interact/loader");
    const loader = await getContracts();
    const CONTRACT = taskArgs.contract;

    console.log();
    console.log("- contract:", CONTRACT);

    if (ARAGON_PROXY.includes(CONTRACT)) {
      const PROXY_IMPL = await loader[CONTRACT].proxy.implementation();
      console.log("- implementation:", PROXY_IMPL);
    }
    else if (OSSIFIABLE_PROXY.includes(CONTRACT)) {
      const PROXY_IMPL = await loader[CONTRACT].proxy.proxy__getImplementation();
      console.log("- implementation:", PROXY_IMPL);
    }
    else {
      console.log("- implementation:", loader[CONTRACT].address);
    }
  });

task("upgrade-nos", "Upgrade NodeOperatorRegistry contract")
  .addParam("address", "The new NodeOperatorRegistry contract address")
  .setAction(async (taskArgs, { ethers }) => {
    const getContracts = require("../scripts/interact/loader");
    const loader = await getContracts();

    const NOS_APP_ID = '0xcefbeb723500e7ffe797c255a6cbd66a0edb055d425ce13238ec14d2c137016a';
    const NEW_NOS_ADDRESS = taskArgs.address;

    const APP_BASES_NAMESPACE = await loader.AragonKernel.contract.APP_BASES_NAMESPACE(GAS_INFO);
    const APP_MANAGER_ROLE = await loader.AragonKernel.contract.APP_MANAGER_ROLE(GAS_INFO);

    console.log();
    console.log('Grant APP_MANAGER_ROLE to owner...');
    await loader.AragonAcl.contract.grantPermission(
      DEPLOYER,
      loader.AragonKernel.address,
      APP_MANAGER_ROLE,
      GAS_INFO
    );

    console.log();
    console.log('Set app from kernel...');
    await loader.AragonKernel.contract.setApp(
      APP_BASES_NAMESPACE,
      NOS_APP_ID,
      NEW_NOS_ADDRESS,
      GAS_INFO
    );

    console.log();
    console.log('Complete.');
  });

task("deploy-contract", "Deploy new contract")
  .addParam("contract", "The contract name")
  .setAction(async (taskArgs, { ethers }) => {
    const CONTRACT_NAME = taskArgs.contract;

    console.log()
    console.log('Deploying new contract...');
    console.log("- contract:", CONTRACT_NAME);
    
    const contractFactory = await ethers.getContractFactory(CONTRACT_NAME);
    const newContract = await contractFactory.deploy();
    await newContract.deployed();
    console.log('- data:', newContract);
  });


task("set-staking-limit", "Set staking limit")
  .addParam("operator", "The operator id")
  .addOptionalParam("limit", "The staking limit")
  .setAction(async (taskArgs, { ethers }) => {
    const getContracts = require("../scripts/interact/loader");
    const loader = await getContracts();
    const NODE_OPERATOR_ID = taskArgs.operator;
    const STAKING_LIMIT = taskArgs.limit || 1000000000;

    console.log();
    console.log("- operator:", NODE_OPERATOR_ID);
    console.log("- limit:", STAKING_LIMIT);

    const tx = await loader.NodeOperatorsRegistry.contract.setNodeOperatorStakingLimit(
      NODE_OPERATOR_ID,
      STAKING_LIMIT,
      GAS_INFO
    );

    console.log();
    console.log("- transaction hash:", tx.hash);

    console.log();
    console.log("Complete.");
  });

task("staking-module-summary", "Get staking module summary")
  .addParam("module", "The staking module id (>= 1)")
  .setAction(async (taskArgs, { ethers }) => {
    const getContracts = require("../scripts/interact/loader");
    const loader = await getContracts();
    const STAKING_MODULE_ID = taskArgs.id > 1? taskArgs.id : 1;

    console.log();
    console.log("- staking module id:", STAKING_MODULE_ID);

    const data = await loader.StakingRouter.contract.getStakingModuleSummary(STAKING_MODULE_ID, GAS_INFO);
    console.log();
    console.log("- Staking Module Summary:", data);
  });

task("node-operator-info", "Get node operator info")
  .addParam("operator", "The node operator id (>= 0)")
  .setAction(async (taskArgs, { ethers }) => {
    const getContracts = require("../scripts/interact/loader");
    const loader = await getContracts();
    const NODE_OPERATOR_ID = taskArgs["operator"] > 0? taskArgs["operator"] : 0;

    console.log();
    console.log("- node operator id:", NODE_OPERATOR_ID);

    const data = await loader.NodeOperatorsRegistry.contract.getNodeOperator(NODE_OPERATOR_ID, GAS_INFO);
    console.log();
    console.log("- Node Operator Info:", data);

    const isPenalized = await loader.NodeOperatorsRegistry.contract.isOperatorPenalized(NODE_OPERATOR_ID, GAS_INFO);
    console.log("- Is Penalized:", isPenalized);
  });

task("total-ace", "Get total ACE balance")
  .setAction(async (taskArgs, { ethers }) => {
    const getContracts = require("../scripts/interact/loader");
    const loader = await getContracts();
    const catalist = loader.Catalist.contract;

    const pooledACE = await catalist.getTotalPooledAce(GAS_INFO);
    console.log();
    console.log("- Total Polled ACE:", ethers.utils.formatEther(pooledACE));
  });

task("balance", "Get account balance")
  .addParam("address", "The account address")
  .setAction(async (taskArgs, { ethers }) => {
    const getContracts = require("../scripts/interact/loader");
    const loader = await getContracts();
    const ACCOUNT = taskArgs.address;

    console.log();
    console.log('- address:', ACCOUNT)

    const balance = await loader.Catalist.contract.balanceOf(ACCOUNT, GAS_INFO);
    console.log("- balance:", ethers.utils.formatEther(balance));
  });

task("add-operator", "Add validator operator")
  .addParam("name", "The operator name")
  .addParam("address", "The operator reward address")
  .setAction(async (taskArgs, { ethers }) => {
    const getContracts = require("../scripts/interact/loader");
    const loader = await getContracts();
    const OPERATOR_NAME = taskArgs.name;
    const OPERATOR_ADDRESS = taskArgs.address;

    console.log();
    console.log("- name:", OPERATOR_NAME);
    console.log("- address:", OPERATOR_ADDRESS);

    const tx = await loader.NodeOperatorsRegistry.contract.addNodeOperator(
      OPERATOR_NAME,
      OPERATOR_ADDRESS,
      GAS_INFO
    );

    await loader.NodeOperatorsRegistry.contract.setOwner(
      OPERATOR_ADDRESS,
      true,
      GAS_INFO
    );

    console.log();
    console.log("- transaction hash:", tx.hash);

    console.log();
    console.log("Complete.");
  });

task("remove-keys", "Remove validator singing keys")
  .addParam("operator", "The operator id")
  .addParam("index", "The key index")
  .addParam("count", "The key count")
  .addOptionalParam("iter", "Recursive remove keys")
  .setAction(async (taskArgs, { ethers }) => {
    const getContracts = require("../scripts/interact/loader");
    const loader = await getContracts();
    const NODE_OPERATOR_ID = taskArgs.operator;
    const KEY_INDEX = +taskArgs.index;
    const KEY_COUNT = +taskArgs.count;
    const ITER = +taskArgs.iter || 1;
    let iter = 0;

    console.log("- operator:", NODE_OPERATOR_ID);

    while(iter < ITER) {
      const INDEX = KEY_INDEX + KEY_COUNT * iter;
      console.log();
      console.log("- index:", INDEX);
      console.log("- count:", KEY_COUNT);

      const tx = await loader.NodeOperatorsRegistry.contract.removeSigningKeys(
        NODE_OPERATOR_ID,
        KEY_INDEX,
        KEY_COUNT,
        GAS_INFO
      );

      console.log();
      console.log("- transaction hash:", tx.hash);
      iter++;
    }

    console.log();
    console.log("Complete.");
  });

task("add-keys", "Add validator singing keys")
  .addParam("operator", "The operator id")
  .addParam("file", "Operator signing keys file path")
  .addOptionalParam("start", "The start signing key index")
  .addOptionalParam("count", "The number of signing keys to add")
  .setAction(async (taskArgs, { ethers }) => {
    const { hexConcat } = require('../scripts/interact/utils')
    const getContracts = require("../scripts/interact/loader");
    const loader = await getContracts();
    const NODE_OPERATOR_ID = taskArgs.operator;
    const DEPOSIT_DATA_FILE = path.resolve(__dirname, "../" + taskArgs.file);
    const START = taskArgs.start || 0;
    const COUNT = taskArgs.count || 0;

    console.log()
    console.log("- operator:", NODE_OPERATOR_ID);
    console.log("- file:", DEPOSIT_DATA_FILE);

    const KEY_DATA = JSON.parse(fs.readFileSync(DEPOSIT_DATA_FILE, "utf-8"));
    let pubkeys = KEY_DATA.map((data) => data.pubkey);
    let signatures = KEY_DATA.map((data) => data.signature);

    if (START != 0 || COUNT != 0) {
      pubkeys = pubkeys.splice(START, COUNT);
      signatures = signatures.splice(START, COUNT);
    }

    const KEY_COUNT = COUNT || pubkeys.length;

    console.log();
    console.log("Add signing keys...");
    console.log("- start:", START);
    console.log("- count:", KEY_COUNT);

    const tx = await loader.NodeOperatorsRegistry.contract.addSigningKeys(
      NODE_OPERATOR_ID,
      KEY_COUNT,
      hexConcat(...pubkeys),
      hexConcat(...signatures),
      GAS_INFO
    );

    console.log();
    console.log("- transaction hash:", tx.hash);

    console.log();
    console.log("Complete.");
  });

task("get-keys", "Get validator singing keys")
  .addParam("operator", "The operator id")
  .addParam("start", "The start index")
  .addParam("end", "The end index")
  .setAction(async (taskArgs, { ethers }) => {
    const getContracts = require("../scripts/interact/loader");
    const loader = await getContracts();
    const NODE_OPERATOR_ID = taskArgs.operator;
    const START = taskArgs.start;
    const END = taskArgs.end;


    console.log();
    console.log("- operator:", NODE_OPERATOR_ID);
    console.log("- start:", START);
    console.log("- end:", END);
    console.log();

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
    const getContracts = require("../scripts/interact/loader");
    const loader = await getContracts();
    const EVENT = taskArgs.event;
    const contract = taskArgs.contract;

    console.log()
    console.log('- Event:', EVENT)
    console.log('- Contract:', contract)
    console.log()
    
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
