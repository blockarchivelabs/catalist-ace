const { parseEther } = require('ethers/lib/utils')
const { ethers } = require('hardhat')
const { hexConcat, pad, ETH, e27, e18, toBN } = require('./utils')
const fs = require('fs')
const { DSMAttestMessage } = require('../../test/helpers/signatures')

// RPC_URL=http://20.197.13.207:8545 npx hardhat run scripts/interact/mainnet-hash-consensus.js --network ace_mainnet
async function main() {
  console.log('Getting the deposit contract...')
  const fileName = './deployed-ace_mainnet.json'
  const addresses = JSON.parse(fs.readFileSync(fileName, 'utf-8'))
  const depositContractAddress = addresses.chainSpec.depositContract
  const CatalistAddress = addresses['app:catalist'].proxy.address
  const HashConsensusForAccountingOracleAddress = addresses.hashConsensusForAccountingOracle.address
  const HashConsensusForForValidatorsExitBusOracle = addresses.hashConsensusForValidatorsExitBusOracle.address
  const StakingRouterAddress = addresses.stakingRouter.proxy.address
  const AccountingOracleAddress = addresses.accountingOracle.proxy.address
  const WithdrawalQueueERC721Address = addresses.withdrawalQueueERC721.proxy.address
  const NodeOperatorRegistryAddress = addresses['app:node-operators-registry'].proxy.address
  const DepositSecurityModuleAddress = addresses.depositSecurityModule.address
  const CatalistLocatorAddress = addresses.catalistLocator.proxy.address
  const ValidatorsExitBusOracle = addresses.validatorsExitBusOracle.proxy.address

  const depositContract = await ethers.getContractAt('DepositContract', depositContractAddress)
  const catalist = await ethers.getContractAt('Catalist', CatalistAddress)
  const hashConsensusForAccountingOracle = await ethers.getContractAt('HashConsensus', HashConsensusForAccountingOracleAddress)
  const hashConsensusForValidatorsExitBusOracle = await ethers.getContractAt('HashConsensus', HashConsensusForForValidatorsExitBusOracle)
  const stakingRouter = await ethers.getContractAt('StakingRouter', StakingRouterAddress)
  const accountingOracle = await ethers.getContractAt('AccountingOracle', AccountingOracleAddress)
  const withdrawalQueueERC721 = await ethers.getContractAt('WithdrawalQueueERC721', WithdrawalQueueERC721Address)
  const nodeOperatorRegistry = await ethers.getContractAt('NodeOperatorsRegistry', NodeOperatorRegistryAddress)
  const depositSecurityModule = await ethers.getContractAt('DepositSecurityModule', DepositSecurityModuleAddress)
  const catalistLocator = await ethers.getContractAt('CatalistLocator', CatalistLocatorAddress)
  const validatorsExitBusOracle = await ethers.getContractAt('ValidatorsExitBusOracle', ValidatorsExitBusOracle)

  const deployerAddress = '0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058'
  const deployerPrivateKey = 'f11a771308f235a1331b098d0212db69ac049e56c9f1e0da739a39e8b743363c'
  const oracleMemberAddress = '0xB458c332C242247C46e065Cf987a05bAf7612904'
  const testerAddress = '0x26AC28D33EcBf947951d6B7d8a1e6569eE73d076'

  const chainSpec = JSON.parse(fs.readFileSync(fileName, 'utf-8')).chainSpec
  const GENESIS_TIME = chainSpec.genesisTime
  const SLOTS_PER_EPOCH = chainSpec.slotsPerEpoch
  const SECONDS_PER_SLOT = chainSpec.secondsPerSlot

  console.log()
  console.log('HashConsensusForAccountingOracle Address:', HashConsensusForAccountingOracleAddress)

  // --------------------------------------------------------------------------------
  // 초기화 코드
  // --------------------------------------------------------------------------------
  // console.log()
  // console.log('Grant MANAGE_MEMBERS_AND_QUORUM_ROLE to deployer in HashConsensus...')
  // await hashConsensusForAccountingOracle.grantRole(
  //   await hashConsensusForAccountingOracle.MANAGE_MEMBERS_AND_QUORUM_ROLE({gasLimit: 1000000, gasPrice: 100000}), 
  //   deployerAddress
  // )
  // await hashConsensusForValidatorsExitBusOracle.grantRole(
  //   await hashConsensusForValidatorsExitBusOracle.MANAGE_MEMBERS_AND_QUORUM_ROLE({gasLimit: 1000000, gasPrice: 100000}), 
  //   deployerAddress
  // )
  
  // console.log()
  // console.log('Add hash consensus member...')
  // await hashConsensusForAccountingOracle.addMember(
  //   oracleMemberAddress, 
  //   1, 
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )
  // await hashConsensusForValidatorsExitBusOracle.addMember(
  //   oracleMemberAddress, 
  //   1, 
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )

  // console.log()
  // console.log('Update initial epoch...')
  // const latestBlockTimestamp = (await ethers.provider.getBlock('latest')).timestamp
  // const initialEpoch = Math.floor((latestBlockTimestamp - GENESIS_TIME)
  //   / (SLOTS_PER_EPOCH * SECONDS_PER_SLOT))
  // await hashConsensusForAccountingOracle.updateInitialEpoch(
  //   initialEpoch, 
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )
  // await hashConsensusForValidatorsExitBusOracle.updateInitialEpoch(
  //   initialEpoch, 
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )
  // console.log('- Latest Block Timestamp:', latestBlockTimestamp)
  // console.log('- Initial Epoch:', initialEpoch)
  // --------------------------------------------------------------------------------
  // 초기화 코드 끝
  // --------------------------------------------------------------------------------

  // console.log()
  // console.log('Grant MANAGE_FRAME_CONFIG_ROLE to deployer in HashConsensusForAccountingOracle...')
  // await hashConsensusForAccountingOracle.grantRole(
  //   await hashConsensusForAccountingOracle.MANAGE_FRAME_CONFIG_ROLE({
  //     gasLimit: 1000000,
  //     gasPrice: 100000
  //   }),
  //   deployerAddress,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000
  //   }
  // )

  // console.log()
  // console.log('Change HashConsensusForAccountingOracle epochs per frame...')
  // await hashConsensusForAccountingOracle.setFrameConfig(
  //   5,
  //   10,
  //   {
  //     gasLimit: 1000000, 
  //     gasPrice: 100000
  //   }
  // )

  // console.log()
  // console.log('Get HashConsensusForAccountingOracle frame config...')
  // const frameConfig = await hashConsensusForAccountingOracle.getFrameConfig({
  //   gasLimit: 1000000,
  //   gasPrice: 100000
  // })
  // console.log('- frame config:', frameConfig)

  // console.log()
  // console.log('Complete.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
