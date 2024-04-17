const { parseEther } = require('ethers/lib/utils')
const { ethers } = require('hardhat')
const { hexConcat, pad, ETH, e27, e18, toBN } = require('./utils')
const fs = require('fs')
const { DSMAttestMessage } = require('../../test/helpers/signatures')
const namehash = require('eth-ens-namehash').hash

// RPC_URL=http://20.197.13.207:8545 npx hardhat run scripts/interact/interact-ace-mainnet.js --network ace_mainnet
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
  const AragonKernelAddress = addresses['aragon-kernel'].proxy.address
  const AragonAclAddress = addresses['aragon-acl'].proxy.address

  const depositContract = await ethers.getContractAt('DepositContract', depositContractAddress)
  const catalist = await ethers.getContractAt('Catalist', CatalistAddress)
  const catalistProxy = await ethers.getContractAt('AppProxyUpgradeable', CatalistAddress)
  const catalistAragonApp = await ethers.getContractAt('AragonApp', CatalistAddress)
  const hashConsensusForAccountingOracle = await ethers.getContractAt('HashConsensus', HashConsensusForAccountingOracleAddress)
  const hashConsensusForValidatorsExitBusOracle = await ethers.getContractAt('HashConsensus', HashConsensusForForValidatorsExitBusOracle)
  const stakingRouter = await ethers.getContractAt('StakingRouter', StakingRouterAddress)
  const accountingOracle = await ethers.getContractAt('AccountingOracle', AccountingOracleAddress)
  const withdrawalQueueERC721 = await ethers.getContractAt('WithdrawalQueueERC721', WithdrawalQueueERC721Address)
  const nodeOperatorRegistry = await ethers.getContractAt('NodeOperatorsRegistry', NodeOperatorRegistryAddress)
  const depositSecurityModule = await ethers.getContractAt('DepositSecurityModule', DepositSecurityModuleAddress)
  const catalistLocator = await ethers.getContractAt('CatalistLocator', CatalistLocatorAddress)
  // const catalistLocator = await ethers.getContractAt('CatalistLocator', '0x8f744ECF16293801cFB28B4f063D7267cD7541F1')
  const validatorsExitBusOracle = await ethers.getContractAt('ValidatorsExitBusOracle', ValidatorsExitBusOracle)
  const aragonKernel = await ethers.getContractAt('Kernel', AragonKernelAddress)
  const aragonKernelProxy = await ethers.getContractAt('KernelProxy', AragonKernelAddress)
  const aragonAcl = await ethers.getContractAt('ACL', AragonAclAddress)

  const deployerAddress = '0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058'
  const deployerPrivateKey = 'f11a771308f235a1331b098d0212db69ac049e56c9f1e0da739a39e8b743363c'
  const oracleMemberAddress = '0xB458c332C242247C46e065Cf987a05bAf7612904'
  const testerAddress = '0x26AC28D33EcBf947951d6B7d8a1e6569eE73d076'

  const chainSpec = JSON.parse(fs.readFileSync(fileName, 'utf-8')).chainSpec
  const GENESIS_TIME = chainSpec.genesisTime
  const SLOTS_PER_EPOCH = chainSpec.slotsPerEpoch
  const SECONDS_PER_SLOT = chainSpec.secondsPerSlot

  const CATALIST_APP_ID = '0xfe7e515193fc7331eedd97433fad4b507d16473770a68882c43677c8f27ebcd8'
  const NEW_CATALIST_ADDRESS = '0xDF4A425efAF188E94ae443E58101C3CE44b80D9c'

  const APP_BASES_NAMESPACE = await aragonKernel.APP_BASES_NAMESPACE({
    gasLimit: 1000000,
    gasPrice: 100000,
  })
  console.log()
  console.log('APP_BASES_NAMESPACE:', APP_BASES_NAMESPACE)
  const APP_ADDR_NAMESPACE = await aragonKernel.APP_ADDR_NAMESPACE({
    gasLimit: 1000000,
    gasPrice: 100000,
  })
  console.log('APP_ADDR_NAMESPACE:', APP_ADDR_NAMESPACE)

  console.log()
  console.log('Get address from kernel...')
  const beforeAddress = await aragonKernel.getApp(
    APP_BASES_NAMESPACE,
    CATALIST_APP_ID,
    {
      gasLimit: 1000000,
      gasPrice: 100000,
    }
  )
  console.log('- address:', beforeAddress)


  // console.log()
  // console.log('Get implementation of catalist...')
  // const latestRepo = await catalistProxy.implementation({
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })
  // console.log('- implementation:', latestRepo)

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

  // console.log()
  // console.log('Get Current Frame...')
  // const currentFrame = await hashConsensusForAccountingOracle.getFrameConfig({
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })
  // console.log('- Frame Config:', currentFrame.toString())

  // console.log()
  // const beforeBalance = await catalist.balanceOf(
  //   testerAddress,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )
  // console.log('Before Balance: ', beforeBalance.toString())

  // console.log()
  // console.log('Staking 1ACE...')
  // await catalist.submit(deployerAddress, {
  //   value: parseEther('1'),
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })

  // console.log()
  // const afterBalance = await catalist.balanceOf(deployerAddress)
  // console.log('After Balance: ', afterBalance.toString())

  // console.log()
  // console.log('Querying addGuardian()...')
  // await depositSecurityModule.addGuardian(
  //   deployerAddress,
  //   1,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )

  // console.log()
  // console.log('Querying getGuardians()...')
  // const guardians = await depositSecurityModule.getGuardians({
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })
  // console.log('Guardians:', guardians)

  // console.log()
  // console.log('Querying getGuardianQuorum()...')
  // const guardianQuorum = await depositSecurityModule.getGuardianQuorum({
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })
  // console.log('Guardian Quorum:', guardianQuorum.toString())

  // console.log()
  // console.log('Querying coreComponents()...')
  // const depositSecurityModuleLocator = await catalistLocator.depositSecurityModule({
  //   gasLimit: 1000000,
  //   gasPrice: 100000
  // })
  // console.log('Deposit Security Module Locator:', depositSecurityModuleLocator)

  // console.log()
  // console.log('Change owner of DepositSecurityModule...')
  // await depositSecurityModule.setOwner(
  //   oracleMemberAddress,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )

  // console.log()
  // console.log('Get owner of DepositSecurityModule...')
  // const owner = await depositSecurityModule.getOwner({
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })
  // console.log('Owner:', owner)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
