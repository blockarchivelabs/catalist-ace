const { parseEther } = require('ethers/lib/utils');
const { ethers } = require('hardhat');
const { hexConcat, pad, ETH, e27, e18, toBN } = require('./utils');
const fs = require('fs');
const { DSMAttestMessage } = require('../../test/helpers/signatures');

// RPC_URL=http://20.197.13.207:8545 npx hardhat run scripts/interact/mainnet-operator.js --network ace_mainnet
async function main() {
  console.log('Getting the deposit contract...')
  const FILE_NAME = './deployed-ace-mainnet-stACE.json'
  const addresses = JSON.parse(fs.readFileSync(FILE_NAME, 'utf-8'))
  const depositContractAddress = addresses.chainSpec.depositContract
  const CatalistAddress = addresses['app:catalist'].proxy.address
  const HashConsensusAddress = addresses.hashConsensusForAccountingOracle.address
  const StakingRouterAddress = addresses.stakingRouter.proxy.address
  const AccountingOracleAddress = addresses.accountingOracle.proxy.address
  const WithdrawalQueueERC721Address = addresses.withdrawalQueueERC721.proxy.address
  const NodeOperatorRegistryAddress = addresses['app:node-operators-registry'].proxy.address
  const DepositSecurityModuleAddress = addresses.depositSecurityModule.address

  const depositContract = await ethers.getContractAt('DepositContract', depositContractAddress)
  const catalist = await ethers.getContractAt('Catalist', CatalistAddress)
  const hashConsensus = await ethers.getContractAt('HashConsensus', HashConsensusAddress)
  const stakingRouter = await ethers.getContractAt('StakingRouter', StakingRouterAddress)
  const accountingOracle = await ethers.getContractAt('AccountingOracle', AccountingOracleAddress)
  const withdrawalQueueERC721 = await ethers.getContractAt('WithdrawalQueueERC721', WithdrawalQueueERC721Address)
  const nodeOperatorRegistry = await ethers.getContractAt('NodeOperatorsRegistry', NodeOperatorRegistryAddress)
  const depositSecurityModule = await ethers.getContractAt('DepositSecurityModule', DepositSecurityModuleAddress)

  const GAS_INFO = {
    gasLimit: 1000000,
    gasPrice: 100000,
  }
  
  const deployerAddress = '0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058';



  // console.log();
  // console.log('Add node operator...');
  // // 오퍼레이터 이름
  // const OPERATOR_NAME = 'test-operator'
  // //오퍼레이터 보상 수령 주소
  // const REWARD_ADDRESS = deployerAddress
  // await nodeOperatorRegistry.addNodeOperator(
  //   OPERATOR_NAME,
  //   REWARD_ADDRESS,
  //   GAS_INFO
  // );

  // console.log();
  // console.log('setNodeOperatorStakingLimit()...');
  // const stakingLimit = 1000000000;
  // await nodeOperatorRegistry.setNodeOperatorStakingLimit(
  //   OPERATOR_ID,
  //   stakingLimit,
  //   GAS_INFO
  // );

  // console.log();
  // console.log('Get node operators count...');
  // const operatorsCount = await nodeOperatorRegistry.getNodeOperatorsCount({
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // });
  // console.log('- operators count:', +operatorsCount);

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

  console.log()
  console.log('Get node operator info...')
  const OPERATOR_ID = 0
  
  const nodeOperatorInfo = await nodeOperatorRegistry.getNodeOperator(
    OPERATOR_ID,
    true,
    GAS_INFO
  )
  console.log('- Node Operator:', nodeOperatorInfo)

  const isOperatorPenalized = await nodeOperatorRegistry.isOperatorPenalized(
    OPERATOR_ID,
    GAS_INFO
  )
  console.log('- Is Operator Penalized:', isOperatorPenalized)

  console.log()
  console.log('Complete.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
