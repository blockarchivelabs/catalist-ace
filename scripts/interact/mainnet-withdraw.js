const { ethers } = require('hardhat')
const { hexConcat, pad, ETH, e27, e18, toBN } = require('./utils')
const fs = require('fs')

// RPC_URL=http://20.197.13.207:8545 npx hardhat run scripts/interact/mainnet-withdraw.js --network ace_mainnet
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
  const testerAddress1 = '0x20a22E6579f6Ed3ffd8DFDe526DF1A967edd0007'

  // console.log()
  // console.log('unfinalizedBACE...')
  // const unfinalizedBACE = await withdrawalQueueERC721.unfinalizedStACE({
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })
  // console.log('- Unfinalized BACE:', +unfinalizedBACE)

  console.log()
  console.log('Querying getWithdrawalRequests()...')
  const account = testerAddress
  const withdrawalRequests = await withdrawalQueueERC721.getWithdrawalRequests(
    account,
    {
      gasLimit: 1000000,
      gasPrice: 100000,
    }
  )  
  const copiedWithdrawalRequests = withdrawalRequests.map((request) => {
    return +request;
  });
  const requestIds = copiedWithdrawalRequests.sort((a, b) => a - b);
  console.log('- Withdrawal Requests:', requestIds)

  console.log()
  console.log('Querying getWithdrawalStatus()...')
  const withdrawalStatus = await withdrawalQueueERC721.getWithdrawalStatus(
    requestIds,
    {
      gasLimit: 1000000,
      gasPrice: 100000,
    }
  )
  console.log('- Withdrawal Status:', withdrawalStatus)

  // console.log()
  // console.log('Querying getLastCheckpointIndex()...')
  // const lastCheckpointIndex = await withdrawalQueueERC721.getLastCheckpointIndex({
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })
  // console.log('- Last Checkpoint Index:', +lastCheckpointIndex)

  // console.log()
  // console.log('Querying findCheckpointHints()...')
  // const firstIdx = lastCheckpointIndex - 1
  // const checkpointHints = await withdrawalQueueERC721.findCheckpointHints(
  //   requestIds,
  //   firstIdx,
  //   +lastCheckpointIndex,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )
  // console.log('- Checkpoint Hints:', checkpointHints)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
