const { ethers } = require('hardhat')
const fs = require('fs')

// RPC_URL=http://20.197.13.207:8545 npx hardhat run scripts/interact/mainnet-upgradable.js --network ace_mainnet
async function main() {
  console.log('Getting the deposit contract...')
  const addresses = JSON.parse(fs.readFileSync('./deployed-ace_mainnet.json', 'utf-8'))
  const depositContractAddress = addresses.chainSpec.depositContract
  const CatalistAddress = addresses['app:catalist'].proxy.address
  const HashConsensusAddress = addresses.hashConsensusForAccountingOracle.address
  const StakingRouterAddress = addresses.stakingRouter.proxy.address
  const AccountingOracleAddress = addresses.accountingOracle.proxy.address
  const WithdrawalQueueERC721Address = addresses.withdrawalQueueERC721.proxy.address
  const NodeOperatorRegistryAddress = addresses['app:node-operators-registry'].proxy.address
  const DepositSecurityModuleAddress = addresses.depositSecurityModule.address
  const CatalistLocatorAddress = addresses.catalistLocator.proxy.address
  const withdrawalVaultAddress = addresses.withdrawalVault.proxy.address

  const depositContract = await ethers.getContractAt('DepositContract', depositContractAddress)
  const catalist = await ethers.getContractAt('Catalist', CatalistAddress)
  const hashConsensus = await ethers.getContractAt('HashConsensus', HashConsensusAddress)
  const stakingRouter = await ethers.getContractAt('StakingRouter', StakingRouterAddress)
  const stakingRouterProxy = await ethers.getContractAt('OssifiableProxy', StakingRouterAddress)
  const accountingOracle = await ethers.getContractAt('AccountingOracle', AccountingOracleAddress)
  const accountingOracleProxy = await ethers.getContractAt('OssifiableProxy', AccountingOracleAddress)
  const withdrawalQueueERC721 = await ethers.getContractAt('WithdrawalQueueERC721', WithdrawalQueueERC721Address)
  const WithdrawalQueueERC721Proxy = await ethers.getContractAt('OssifiableProxy', WithdrawalQueueERC721Address)
  const nodeOperatorRegistry = await ethers.getContractAt('NodeOperatorsRegistry', NodeOperatorRegistryAddress)
  const depositSecurityModule = await ethers.getContractAt('DepositSecurityModule', DepositSecurityModuleAddress)
  const catalistLocator = await ethers.getContractAt('CatalistLocator', CatalistLocatorAddress)
  const catalistLocatorProxy = await ethers.getContractAt('OssifiableProxy', CatalistLocatorAddress)
  const withdrawalVault = await ethers.getContractAt('WithdrawalVault', withdrawalVaultAddress)
  const withdrawalVaultProxy = await ethers.getContractAt('WithdrawalsManagerProxy', withdrawalVaultAddress)

  const GAS_INFO = {
    gasLimit: 1000000,
    gasPrice: 100000,
  }

  console.log()
  console.log('AccountingOracle Proxy Info')
  const accountingOracleAdmin = await accountingOracleProxy.proxy__getAdmin(GAS_INFO)
  console.log('- admin:', accountingOracleAdmin)

  const accountingOracleImpl = await accountingOracleProxy.proxy__getImplementation(GAS_INFO)
  console.log('- impl:', accountingOracleImpl)

  console.log()
  console.log('CatalistLocator Proxy Info')
  const catalistLocatorAdmin = await catalistLocatorProxy.proxy__getAdmin(GAS_INFO)
  console.log('- admin:', catalistLocatorAdmin)

  const catalistLocatorImpl = await catalistLocatorProxy.proxy__getImplementation(GAS_INFO)
  console.log('- impl:', catalistLocatorImpl)

  console.log()
  console.log('StakingRouter Proxy Info')
  const stakingRouterAdmin = await stakingRouterProxy.proxy__getAdmin(GAS_INFO)
  console.log('- admin:', stakingRouterAdmin)

  const stakingRouterImpl = await stakingRouterProxy.proxy__getImplementation(GAS_INFO)
  console.log('- impl:', stakingRouterImpl)

  console.log()
  console.log('WithdrawalQueueERC721 Proxy Info')
  const withdrawalQueueERC721Admin = await WithdrawalQueueERC721Proxy.proxy__getAdmin(GAS_INFO)
  console.log('- admin:', withdrawalQueueERC721Admin)

  const withdrawalQueueERC721Impl = await WithdrawalQueueERC721Proxy.proxy__getImplementation(GAS_INFO)
  console.log('- impl:', withdrawalQueueERC721Impl)

  console.log()
  console.log('WithdrawalVault Proxy Info')
  const withdrawalVaultAdmin = await withdrawalVaultProxy.proxy_getAdmin(GAS_INFO)
  console.log('- admin:', withdrawalVaultAdmin)

  const withdrawalVaultImpl = await withdrawalVaultProxy.implementation(GAS_INFO)
  console.log('- impl:', withdrawalVaultImpl)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
