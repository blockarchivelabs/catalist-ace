const { ethers } = require('hardhat')
const fs = require('fs')
const DEPLOYER = process.env.DEPLOYER
const ORACLE_MEMBER_ADDRESS = process.env.ORACLE_MEMBER_ADDRESS

// RPC_URL=http://20.197.13.207:8545 npx hardhat run scripts/interact/interact-init-mainnet.js --network ace_mainnet
async function main() {
  console.log('Getting the deposit contract...')
  const fileName = './deployed-ace_mainnet.json'
  const addresses = JSON.parse(fs.readFileSync(fileName, 'utf-8'))
  const CatalistAddress = addresses['app:catalist'].proxy.address
  const HashConsensusForAccountingOracleAddress = addresses.hashConsensusForAccountingOracle.address
  const HashConsensusForValidatorsExitBusOracle = addresses.hashConsensusForValidatorsExitBusOracle.address
  const NodeOperatorsRegistryAddress = addresses['app:node-operators-registry'].proxy.address
  const StakingRouterAddress = addresses.stakingRouter.proxy.address
  const AccountingOracleAddress = addresses.accountingOracle.proxy.address
  const WithdrawalQueueERC721Address = addresses.withdrawalQueueERC721.proxy.address
  const DepositSecurityModuleAddress = addresses.depositSecurityModule.address
  const ValidatorsExitBusOracle = addresses.validatorsExitBusOracle.proxy.address

  const catalist = await ethers.getContractAt('Catalist', CatalistAddress)
  const hashConsensusForAccountingOracle = await ethers.getContractAt('HashConsensus', HashConsensusForAccountingOracleAddress)
  const hashConsensusForValidatorsExitBusOracle = await ethers.getContractAt('HashConsensus', HashConsensusForValidatorsExitBusOracle)
  const stakingRouter = await ethers.getContractAt('StakingRouter', StakingRouterAddress)
  const accountingOracle = await ethers.getContractAt('AccountingOracle', AccountingOracleAddress)
  const withdrawalQueueERC721 = await ethers.getContractAt('WithdrawalQueueERC721', WithdrawalQueueERC721Address)
  const nodeOperatorsRegistry = await ethers.getContractAt('NodeOperatorsRegistry', NodeOperatorsRegistryAddress)
  const depositSecurityModule = await ethers.getContractAt('DepositSecurityModule', DepositSecurityModuleAddress)
  const validatorsExitBusOracle = await ethers.getContractAt('ValidatorsExitBusOracle', ValidatorsExitBusOracle)

  const GAS_INFO = {
    gasLimit: 1000000,
    gasPrice: 100000,
  }

  const chainSpec = JSON.parse(fs.readFileSync(fileName, 'utf-8')).chainSpec
  const GENESIS_TIME = chainSpec.genesisTime
  const SLOTS_PER_EPOCH = chainSpec.slotsPerEpoch
  const SECONDS_PER_SLOT = chainSpec.secondsPerSlot

  const deployerAddress = DEPLOYER
  const oracleMemberAddress = ORACLE_MEMBER_ADDRESS

  // 최초 배포시 초기화 코드

  // catalist 
  console.log()
  console.log('Grant RESUME_ROLE to owner in Catalist...')
  const RESUME_ROLE = await catalist.RESUME_ROLE(GAS_INFO)
  await aragonAcl.grantPermission(
    deployerAddress,
    CatalistAddress,
    RESUME_ROLE,
    GAS_INFO
  )

  console.log()
  console.log('Grant STAKING_CONTROL_ROLE to owner in Catalist...')
  const STAKING_CONTROL_ROLE = await catalist.STAKING_CONTROL_ROLE(GAS_INFO)
  await aragonAcl.grantPermission(
    deployerAddress,
    CatalistAddress,
    STAKING_CONTROL_ROLE,
    GAS_INFO
  )

  console.log()
  console.log('Resume Catalist...')
  await catalist.resume(GAS_INFO)

  // withdraw queue 권한 부여 및 시작
  console.log()
  console.log('Grant RESUME_ROLE to deployer in WithdrawalQueue...')
  await withdrawalQueueERC721.grantRole(
    await withdrawalQueueERC721.RESUME_ROLE(GAS_INFO),
    deployerAddress,
    GAS_INFO
  )

  console.log()
  console.log('Resume withdrawalQueueERC721...')
  await withdrawalQueueERC721.resume(GAS_INFO)

  // hash consensus 맴버 추가 및 초기 epoch 설정
  console.log()
  console.log('Grant MANAGE_MEMBERS_AND_QUORUM_ROLE to deployer in HashConsensus...')
  await hashConsensusForAccountingOracle.grantRole(
    await hashConsensusForAccountingOracle.MANAGE_MEMBERS_AND_QUORUM_ROLE(GAS_INFO), 
    deployerAddress,
    GAS_INFO
  )
  await hashConsensusForValidatorsExitBusOracle.grantRole(
    await hashConsensusForValidatorsExitBusOracle.MANAGE_MEMBERS_AND_QUORUM_ROLE(GAS_INFO), 
    deployerAddress,
    GAS_INFO
  )
  
  console.log()
  console.log('Add hash consensus member...')
  await hashConsensusForAccountingOracle.addMember(
    oracleMemberAddress, 
    1,
    GAS_INFO
  )
  await hashConsensusForValidatorsExitBusOracle.addMember(
    oracleMemberAddress, 
    1, 
    GAS_INFO
  )

  console.log()
  console.log('Update initial epoch...')
  const latestBlockTimestamp = (await ethers.provider.getBlock('latest')).timestamp
  let initialEpoch = Math.floor((latestBlockTimestamp - GENESIS_TIME)
    / (SLOTS_PER_EPOCH * SECONDS_PER_SLOT))
  initialEpoch = 12824 // 2024-04-30 06:00:00 (UTC)
  
  await hashConsensusForAccountingOracle.updateInitialEpoch(
    initialEpoch, 
    GAS_INFO
  )
  await hashConsensusForValidatorsExitBusOracle.updateInitialEpoch(
    initialEpoch, 
    GAS_INFO
  )
  console.log('- Latest Block Timestamp:', latestBlockTimestamp)
  console.log('- Initial Epoch:', initialEpoch)

  console.log()
  console.log('Grant RESUME_ROLE to deployer in ValidatorsExitBusOracle...')
  await validatorsExitBusOracle.grantRole(
    await validatorsExitBusOracle.RESUME_ROLE(GAS_INFO),
    deployerAddress,
    GAS_INFO
  )

  console.log()
  console.log('Resume ValidatorsExitBusOracle...')
  await validatorsExitBusOracle.resume(GAS_INFO)

  // deposit module 시작
  console.log()
  console.log('Add deposit security module guardian...')
  await depositSecurityModule.addGuardian(
    oracleMemberAddress,
    1,
    GAS_INFO
  )

  console.log()
  console.log('Grant STAKING_MODULE_RESUME_ROLE to deployer...')
  await stakingRouter.grantRole(
    await stakingRouter.STAKING_MODULE_RESUME_ROLE(GAS_INFO),
    deployerAddress,
    GAS_INFO
  )

  console.log()
  console.log('Resume staking module...')
  const STAKING_MODULE_ID = 1
  await stakingRouter.resumeStakingModule(
    STAKING_MODULE_ID,
    GAS_INFO
  )

  console.log()
  console.log('Check staking module status...')
  const stakingModuleStatus = await stakingRouter.getStakingModuleStatus(
    STAKING_MODULE_ID,
    GAS_INFO
  )
  console.log('- status:', stakingModuleStatus)

  console.log()
  console.log('Grant MANAGE_NODE_OPERATOR_ROLE to owner in NodeOperatorsRegistry...')
  const MANAGE_NODE_OPERATOR_ROLE = await nodeOperatorsRegistry.MANAGE_NODE_OPERATOR_ROLE(GAS_INFO)
  await aragonAcl.grantPermission(
    deployerAddress,
    NodeOperatorsRegistryAddress,
    MANAGE_NODE_OPERATOR_ROLE,
    GAS_INFO
  )

  console.log()
  console.log('Complete.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
