const { ethers } = require('hardhat')
const fs = require('fs')

async function main() {
  const deployerAddress = '0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058'
  const oracleMemberAddress = '0xB458c332C242247C46e065Cf987a05bAf7612904'
  console.log('Deploying contracts with the account:', deployerAddress);

  // console.log()
  // console.log('Upgrade DepositSecurityModuel contract...')

  // console.log()
  // console.log('Deploying DepositSecurityModule...');
  // const depositSecurityModuleFactory = await ethers.getContractFactory('DepositSecurityModule');
  // const depositSecurityModuleContract = await depositSecurityModuleFactory.deploy(
  //   "0x23bBA284db799Ca49381bEA734F1A55f14692f5c",
  //   "0xace0000000000000000000000000000000000aCe",
  //   "0x630941c45Cd3BC0B4FC843900C29c8432f4e935d",
  //   150,
  //   5,
  //   6646
  // );
  // await depositSecurityModuleContract.deployed();
  // console.log('- address:', depositSecurityModuleContract);

  // console.log()
  // console.log('Deploying CatalistLocator...')
  // const catalistLocatorFactory = await ethers.getContractFactory('CatalistLocator');
  // const catalistLocatorContract = await catalistLocatorFactory.deploy(
  //   [
  //     '0xAC9d01Fa37A9492876Ead645D95011795e07bFEE',
  //     depositSecurityModuleContract.address,
  //     '0x03b6d55847692466aFe580Dcc9750874138d6204',
  //     '0x342B3AA29a7425bcd0dB61d7c8Ca2D1D66AE7CED',
  //     '0x23bBA284db799Ca49381bEA734F1A55f14692f5c',
  //     '0x45B0AD8EE592F256bb460FA08cDc361E1e9EDa0D',
  //     '0x342B3AA29a7425bcd0dB61d7c8Ca2D1D66AE7CED',
  //     '0xb011080585D31a956a7143C668263C74A52a4502',
  //     '0x630941c45Cd3BC0B4FC843900C29c8432f4e935d',
  //     '0xAd71Ec34e9572e6550604a45dC084BcbE10af8Bc',
  //     '0xF602028fa58EBDA976C3A6ec5A8dB73AA47cb5D0',
  //     '0x9B6C9256f63a855f761A1ffEC792376346855406',
  //     '0x85fA6Eb13d4B7298aD7a7315e2E8F0FDe9d71f85',
  //     '0x8996De679fDF6311EEbE67A32bB73B6c337e80C3'
  //   ]
  // );
  // await catalistLocatorContract.deployed();
  // console.log('- address:', catalistLocatorContract);

  console.log()
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

  // console.log()
  // console.log('Upgrade CatalistLocator contract...')
  // await catalistLocatorProxy.proxy__upgradeTo(
  //   catalistLocatorContract.address,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )

  // console.log()
  // console.log('Upgrade done and init contract...')
  // console.log('Add deposit security module guardian...')
  // await depositSecurityModule.addGuardian(
  //   oracleMemberAddress,
  //   1,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )

  console.log()
  console.log('Add oracle member to deposit security module owner...')
  await depositSecurityModule.setOwner(
    oracleMemberAddress,
    {
      gasLimit: 1000000,
      gasPrice: 100000,
    }
  )

  console.log()
  console.log('Check oracle member is owner of deposit security module...')
  const isOwner = await depositSecurityModule.isOwner(
    oracleMemberAddress,
    {
      gasLimit: 1000000,
      gasPrice: 100000,
    }
  )
  console.log('- isOwner:', isOwner)

  console.log()
  console.log('Complete.')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });