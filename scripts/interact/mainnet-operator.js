const { parseEther } = require('ethers/lib/utils');
const { ethers } = require('hardhat');
const { hexConcat, pad, ETH, e27, e18, toBN } = require('./utils');
const fs = require('fs');
const { DSMAttestMessage } = require('../../test/helpers/signatures');

// RPC_URL=http://20.197.13.207:8545 npx hardhat run scripts/interact/mainnet-operator.js --network ace_mainnet
async function main() {
  console.log('Getting the deposit contract...');
  const addresses = JSON.parse(
    fs.readFileSync('./deployed-ace_mainnet.json', 'utf-8')
  );
  const depositContractAddress = addresses.chainSpec.depositContract;
  const CatalistAddress = addresses['app:catalist'].proxy.address;
  const HashConsensusAddress =
    addresses.hashConsensusForAccountingOracle.address;
  const StakingRouterAddress = addresses.stakingRouter.proxy.address;
  const AccountingOracleAddress = addresses.accountingOracle.proxy.address;
  const WithdrawalQueueERC721Address =
    addresses.withdrawalQueueERC721.proxy.address;
  const NodeOperatorRegistryAddress =
    addresses['app:node-operators-registry'].proxy.address;
  const DepositSecurityModuleAddress = addresses.depositSecurityModule.address;

  const depositContract = await ethers.getContractAt(
    'DepositContract',
    depositContractAddress
  );
  const catalist = await ethers.getContractAt('Catalist', CatalistAddress);
  const hashConsensus = await ethers.getContractAt(
    'HashConsensus',
    HashConsensusAddress
  );
  const stakingRouter = await ethers.getContractAt(
    'StakingRouter',
    StakingRouterAddress
  );
  const accountingOracle = await ethers.getContractAt(
    'AccountingOracle',
    AccountingOracleAddress
  );
  const withdrawalQueueERC721 = await ethers.getContractAt(
    'WithdrawalQueueERC721',
    WithdrawalQueueERC721Address
  );
  const nodeOperatorRegistry = await ethers.getContractAt(
    'NodeOperatorsRegistry',
    NodeOperatorRegistryAddress
  );
  const depositSecurityModule = await ethers.getContractAt(
    'DepositSecurityModule',
    DepositSecurityModuleAddress
  );

  const deployerAddress = '0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058';
  const deployerPrivateKey =
    'f11a771308f235a1331b098d0212db69ac049e56c9f1e0da739a39e8b743363c';
  const oracleMemberAddress = '0xB458c332C242247C46e065Cf987a05bAf7612904';
  const testerAddress = '0x26AC28D33EcBf947951d6B7d8a1e6569eE73d076';

  const GAS_INFO = {
    gasLimit: 1000000,
    gasPrice: 100000,
  }

  console.log();
  console.log('Add node operator...');
  const OPERATOR_NAME = 'test-operator'
  const REWARD_ADDRESS = deployerAddress
  const operatorId = await nodeOperatorRegistry.addNodeOperator(
    OPERATOR_NAME,
    REWARD_ADDRESS,
    GAS_INFO
  );
  console.log('Operator ID:', operatorId);

  console.log();
  console.log('setNodeOperatorStakingLimit()...');
  const stakingLimit = 1000000000;
  await nodeOperatorRegistry.setNodeOperatorStakingLimit(
    operatorId,
    stakingLimit,
    GAS_INFO
  );

  // console.log();
  // console.log('Get active node operators count...');
  // const activeOperatorsCount = await nodeOperatorRegistry.getActiveNodeOperatorsCount({
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // });
  // console.log('Active operators count:', +activeOperatorsCount);

  // console.log();
  // console.log('Set node operator reward address...');
  // const operatorId = 0
  // await nodeOperatorRegistry.setNodeOperatorRewardAddress(
  //   operatorId,
  //   testerAddress,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )

  // console.log()
  // console.log('Get node operator info...')
  // const operatorId = 0
  // const operatorInfo = await nodeOperatorRegistry.getNodeOperator(
  //   operatorId,
  //   true,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )
  // console.log(operatorInfo)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
