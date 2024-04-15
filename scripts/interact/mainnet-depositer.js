const { ethers } = require('hardhat')
const fs = require('fs')
const { DSMAttestMessage } = require('../../test/helpers/signatures')

// RPC_URL=http://20.197.13.207:8545 npx hardhat run scripts/interact/mainnet-depositer.js --network ace_mainnet
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

  const STAKING_MODULE_ID = 1

  // console.log()
  // console.log('Querying getMaxDeposits()...')
  // const MAX_DEPOSITS = await depositSecurityModule.getMaxDeposits({
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })
  // console.log('- Max Deposits:', +MAX_DEPOSITS)

  // console.log()
  // console.log('Check Deposit Security Module can deposit...')
  // const STAKING_MODULE_ID = 1
  // const CAN_DEPOSIT = await depositSecurityModule.canDeposit(
  //   STAKING_MODULE_ID,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )
  // console.log('- Can Deposit:', CAN_DEPOSIT)
  // const STAKING_MODULE_STATUS = await stakingRouter.getStakingModuleIsActive(
  //   STAKING_MODULE_ID,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )
  // console.log('- Staking Module Status:', STAKING_MODULE_STATUS)

  // await depositSecurityModule.addGuardian(
  //   oracleMemberAddress,
  //   1,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )

  // console.log()
  // console.log('Get Guardian Quorum...')
  // const guardianQuorum = await depositSecurityModule.getGuardianQuorum({
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })
  // console.log('- Guardian Quorum:', guardianQuorum)

  // console.log()
  // console.log('Check deposit state...')
  // const STAKING_MODULE_IS_ACTIVE = await stakingRouter.getStakingModuleIsActive(
  //   STAKING_MODULE_ID,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )
  // console.log('- Staking Module Is Active:', STAKING_MODULE_IS_ACTIVE)

  // const CAN_DEPOSIT = await depositSecurityModule.canDeposit(
  //   STAKING_MODULE_ID,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )
  // console.log('- Can Deposit:', CAN_DEPOSIT)

  // console.log()
  // console.log('Get deposit data...')
  // const STAKING_MODULE_NONCE = await stakingRouter.getStakingModuleNonce(
  //   STAKING_MODULE_ID,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )
  // console.log('- Staking Module Nonce:', +STAKING_MODULE_NONCE)

  // const latestBlock = await ethers.provider.getBlock('latest')
  // console.log('- Latest Block Number:', latestBlock.number)
  // console.log('- Latest Block Hash:', latestBlock.hash)

  // const DEPOSIT_ROOT = await depositContract.get_deposit_root({
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })
  // console.log('- Deposit Root:', DEPOSIT_ROOT)

  // const ATTEST_MESSAGE_PREFIX = await depositSecurityModule.ATTEST_MESSAGE_PREFIX({
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })

  // DSMAttestMessage.setMessagePrefix(ATTEST_MESSAGE_PREFIX)
  // let validAttestMessage = new DSMAttestMessage(
  //   latestBlock.number, 
  //   latestBlock.hash, 
  //   DEPOSIT_ROOT, 
  //   STAKING_MODULE_ID, 
  //   +STAKING_MODULE_NONCE
  // )

  // const deployerSign = validAttestMessage.sign(deployerPrivateKey)
  // console.log('- Deployer Sign:', deployerSign)

  // console.log()
  // console.log('Trying deposit buffered ACE...')
  // await depositSecurityModule.depositBufferedAce(
  //   latestBlock.number,
  //   latestBlock.hash,
  //   DEPOSIT_ROOT,
  //   STAKING_MODULE_ID,
  //   +STAKING_MODULE_NONCE,
  //   '0x00',
  //   [deployerSign],
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )

  // console.log()
  // console.log('Complete.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
