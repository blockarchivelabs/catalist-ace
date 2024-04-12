const { ethers } = require('hardhat')
const fs = require('fs')

// RPC_URL=http://20.197.13.207:8545 npx hardhat run scripts/interact/interact-ace-mainnet.js --network ace_mainnet
async function main() {
  console.log('Getting the deposit contract...')
  const fileName = './deployed-ace_mainnet.json'
  const addresses = JSON.parse(fs.readFileSync(fileName, 'utf-8'))
  const CatalistAddress = addresses['app:catalist'].proxy.address
  const HashConsensusAddress = addresses.hashConsensusForAccountingOracle.address
  const StakingRouterAddress = addresses.stakingRouter.proxy.address
  const AccountingOracleAddress = addresses.accountingOracle.proxy.address
  const WithdrawalQueueERC721Address = addresses.withdrawalQueueERC721.proxy.address
  const DepositSecurityModuleAddress = addresses.depositSecurityModule.address

  const catalist = await ethers.getContractAt('Catalist', CatalistAddress)
  const hashConsensus = await ethers.getContractAt('HashConsensus', HashConsensusAddress)
  const stakingRouter = await ethers.getContractAt('StakingRouter', StakingRouterAddress)
  const accountingOracle = await ethers.getContractAt('AccountingOracle', AccountingOracleAddress)
  const withdrawalQueueERC721 = await ethers.getContractAt('WithdrawalQueueERC721', WithdrawalQueueERC721Address)
  const nodeOperatorRegistry = await ethers.getContractAt('NodeOperatorsRegistry', NodeOperatorRegistryAddress)
  const depositSecurityModule = await ethers.getContractAt('DepositSecurityModule', DepositSecurityModuleAddress)

  const deployerAddress = '0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058'
  const oracleMemberAddress = '0xB458c332C242247C46e065Cf987a05bAf7612904'

  const chainSpec = JSON.parse(fs.readFileSync(fileName, 'utf-8')).chainSpec
  const GENESIS_TIME = chainSpec.genesisTime
  const SLOTS_PER_EPOCH = chainSpec.slotsPerEpoch
  const SECONDS_PER_SLOT = chainSpec.secondsPerSlot

  // 최초 배포시 초기화 코드

  // catalist 시작
  console.log()
  console.log('Resume Catalist...')
  await catalist.resume()

  // withdraw queue 권한 부여 및 시작
  console.log()
  console.log('Grant RESUME_ROLE to deployer...')
  await withdrawalQueueERC721.grantRole(
    await withdrawalQueueERC721.RESUME_ROLE(),
    deployerAddress
  )

  console.log()
  console.log('Resume withdrawalQueueERC721...')
  await withdrawalQueueERC721.resume({
    gasLimit: 1000000,
    gasPrice: 1000000,
  })

  // hash consensus 맴버 추가 및 초기 epoch 설정
  console.log()
  console.log('Grant MANAGE_MEMBERS_AND_QUORUM_ROLE to deployer')
  await hashConsensus.grantRole(
    await hashConsensus.MANAGE_MEMBERS_AND_QUORUM_ROLE(), 
    deployerAddress
  )
  
  console.log()
  console.log('Add hash consensus member...')
  await hashConsensus.addMember(
    oracleMemberAddress, 
    1, 
    {
      gasLimit: 1000000,
      gasPrice: 100000,
    }
  )

  console.log()
  console.log('Update initial epoch...')
  const latestBlockTimestamp = (await ethers.provider.getBlock('latest')).timestamp
  const initialEpoch = Math.floor((latestBlockTimestamp - GENESIS_TIME)
    / (SLOTS_PER_EPOCH * SECONDS_PER_SLOT))
  await hashConsensus.updateInitialEpoch(
    initialEpoch, 
    {
      gasLimit: 1000000,
      gasPrice: 100000,
    }
  )
  console.log('- Latest Block Timestamp:', latestBlockTimestamp)
  console.log('- Initial Epoch:', initialEpoch)

  // deposit module 시작
  console.log()
  console.log('Add deposit security module guardian...')
  await depositSecurityModule.addGuardian(
    oracleMemberAddress,
    1,
    {
      gasLimit: 1000000,
      gasPrice: 100000,
    }
  )

  console.log()
  console.log('Grant STAKING_MODULE_RESUME_ROLE to deployer...')
  await stakingRouter.grantRole(
    await stakingRouter.STAKING_MODULE_RESUME_ROLE(),
    deployerAddress
  )

  console.log()
  console.log('Resume staking module...')
  await stakingRouter.resumeStakingModule(
    1,
    {
      gasLimit: 1000000,
      gasPrice: 100000,
    }
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
