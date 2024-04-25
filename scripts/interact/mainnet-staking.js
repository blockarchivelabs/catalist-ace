const { parseEther } = require('ethers/lib/utils')
const { ethers } = require('hardhat')
const { hexConcat, pad, ETH, e27, e18, toBN } = require('./utils')
const fs = require('fs')
const { DSMAttestMessage } = require('../../test/helpers/signatures')

// RPC_URL=http://20.197.13.207:8545 npx hardhat run scripts/interact/mainnet-staking.js --network ace_mainnet
async function main() {
  console.log('Getting the deposit contract...')
  const addresses = JSON.parse(fs.readFileSync('./deployed-ace-mainnet-stACE.json', 'utf-8'))
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

  const deployerAddress = '0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058'
  const deployerPrivateKey = 'f11a771308f235a1331b098d0212db69ac049e56c9f1e0da739a39e8b743363c'
  const oracleMemberAddress = '0xB458c332C242247C46e065Cf987a05bAf7612904'
  const testerAddress = '0x26AC28D33EcBf947951d6B7d8a1e6569eE73d076'

  const GAS_INFO = {
    gasLimit: 1000000,
    gasPrice: 100000,
  }

  const STAKING_MODULE_ID = 1
  const NODE_OPERATOR_ID = 0

  console.log()
  console.log('StakingRouter.getStakingModuleMaxDepositsCount()...')
  const depositableACE = await catalist.getDepositableAce(GAS_INFO)
  console.log('- Depositable ACE:', +depositableACE)
  const maxDepositsCount = await stakingRouter.getStakingModuleMaxDepositsCount(
    STAKING_MODULE_ID,
    depositableACE,
    GAS_INFO
  )
  console.log('- Max Deposits Count:', +maxDepositsCount)

  console.log()
  console.log('Get staking module summary...')
  const stakingModuleSummary = await stakingRouter.getStakingModuleSummary(
    STAKING_MODULE_ID,
    GAS_INFO
  )
  console.log('- Staking Module Summary:', stakingModuleSummary)

  console.log()
  console.log('Get node operator summary...')
  const nodeOperatorSummary = await stakingRouter.getNodeOperatorSummary(
    STAKING_MODULE_ID,
    NODE_OPERATOR_ID,
    GAS_INFO
  )
  console.log('- Node Operator Summary:', nodeOperatorSummary)

  console.log()
  console.log('Get node operator...')
  const nodeOperator = await nodeOperatorRegistry.getNodeOperator(
    NODE_OPERATOR_ID,
    true,
    GAS_INFO
  )
  console.log('- Node Operator:', nodeOperator)

  console.log()
  console.log('Get deposits allocation...')
  const depositsAllocation = await stakingRouter.getDepositsAllocation(
    depositableACE,
    GAS_INFO
  )
  console.log('- Deposits Allocation:', depositsAllocation)

  console.log()
  console.log('Is operator penalized...')
  const isOperatorPenalized = await nodeOperatorRegistry.isOperatorPenalized(
    NODE_OPERATOR_ID,
    GAS_INFO
  )
  console.log('- Is Operator Penalized:', isOperatorPenalized)

  console.log()
  console.log('Get stuck penalty delay...')
  const stuckPenaltyDelay = await nodeOperatorRegistry.getStuckPenaltyDelay(GAS_INFO)
  console.log('- Stuck Penalty Delay:', stuckPenaltyDelay)

  // console.log()
  // console.log('Clear node operator penalty...')
  // const cleared = await nodeOperatorRegistry.clearNodeOperatorPenalty(
  //   NODE_OPERATOR_ID,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )
  // console.log('- Cleared:', cleared)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
