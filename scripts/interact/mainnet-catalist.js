const { parseEther } = require('ethers/lib/utils')
const { ethers } = require('hardhat')
const { hexConcat, pad, ETH, e27, e18, toBN } = require('./utils')
const fs = require('fs')
const { DSMAttestMessage } = require('../../test/helpers/signatures')

// RPC_URL=http://20.197.13.207:8545 npx hardhat run scripts/interact/mainnet-catalist.js --network ace_mainnet
async function main() {
  console.log('Getting the deposit contract...')
  const addresses = JSON.parse(fs.readFileSync('./deployed-ace-mainnet-stACE.json', 'utf-8'))
  const fileName = './deployed-ace-mainnet-stACE.json'
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
  const OracleReportSanityCheckerAddress = addresses.oracleReportSanityChecker.address

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
  const catalistLocatorProxy = await ethers.getContractAt('OssifiableProxy', CatalistLocatorAddress)
  const validatorsExitBusOracle = await ethers.getContractAt('ValidatorsExitBusOracle', ValidatorsExitBusOracle)
  const aragonKernel = await ethers.getContractAt('Kernel', AragonKernelAddress)
  const aragonKernelProxy = await ethers.getContractAt('KernelProxy', AragonKernelAddress)
  const aragonAcl = await ethers.getContractAt('ACL', AragonAclAddress)
  const oracleReportSanityChecker = await ethers.getContractAt('OracleReportSanityChecker', OracleReportSanityCheckerAddress)

  const deployerAddress = '0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058'
  const deployerPrivateKey = 'f11a771308f235a1331b098d0212db69ac049e56c9f1e0da739a39e8b743363c'
  const oracleMemberAddress = '0xB458c332C242247C46e065Cf987a05bAf7612904'
  const testerAddress = '0x26AC28D33EcBf947951d6B7d8a1e6569eE73d076'

  // console.log()
  // console.log('Get tester balance...')
  // const testerBalance = await catalist.balanceOf(
  //   testerAddress,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )
  // const decimals = await catalist.decimals({
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })
  // console.log('- Tester Balance:', +testerBalance / (10 ** +decimals))

  // console.log()
  // console.log('Get current stake limit...')
  // const stakeLimit = await catalist.getCurrentStakeLimit({
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })
  // console.log('- Current Stake Limit:', +stakeLimit)

  // console.log()
  // console.log('Get depositable ace...')
  // const depositableAce = await catalist.getDepositableAce({
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })
  // console.log('- Depositable Ace:', +depositableAce)

  // console.log()
  // console.log('handleOracleReport()...')
  // await catalist.handleOracleReport(
  //   1713835092, 3840, 2, '32000743484000000000', 0, 0, 191887321477412, [], 0,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )

  // console.log()
  // console.log('Get oracle report components for catalist...')
  // const oracleReportComponents = await catalistLocator.oracleReportComponentsForCatalist({
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })
  // console.log('- Oracle Report Components:', oracleReportComponents)

  console.log()
  console.log('Get beacon stat...')
  const beaconStat = await catalist.getBeaconStat({
    gasLimit: 1000000,
    gasPrice: 100000,
  })
  console.log('- Beacon Stat:', beaconStat)

  console.log()
  console.log('Get oracle report limits...')
  const oracleReportLimits = await oracleReportSanityChecker.getOracleReportLimits({
    gasLimit: 1000000,
    gasPrice: 100000,
  })
  console.log('- Oracle Report Limits:', oracleReportLimits)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
