const { parseEther } = require('ethers/lib/utils')
const { ethers } = require('hardhat')
const { hexConcat, pad, ETH, e27, e18, toBN } = require('./utils')
const { getEventArgument, ZERO_ADDRESS } = require('@aragon/contract-helpers-test')
const fs = require('fs')

async function main() {
  console.log('Getting the deposit contract...')
  const fileName = './deployed-local.json'
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
  const ValidatorsExitBusOracleAddress = addresses.validatorsExitBusOracle.proxy.address
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
  const validatorsExitBusOracle = await ethers.getContractAt('ValidatorsExitBusOracle', ValidatorsExitBusOracleAddress)
  const aragonKernel = await ethers.getContractAt('Kernel', AragonKernelAddress)
  const aragonKernelProxy = await ethers.getContractAt('KernelProxy', AragonKernelAddress)
  const aragonAcl = await ethers.getContractAt('ACL', AragonAclAddress)
  const oracleReportSanityChecker = await ethers.getContractAt('OracleReportSanityChecker', OracleReportSanityCheckerAddress)

  const chainSpec = JSON.parse(fs.readFileSync(fileName, 'utf-8')).chainSpec
  const GENESIS_TIME = chainSpec.genesisTime
  const SLOTS_PER_EPOCH = chainSpec.slotsPerEpoch
  const SECONDS_PER_SLOT = chainSpec.secondsPerSlot

  const [owner, ad1] = await ethers.getSigners()
  const deployerAddress = owner.address
  const oracleMemberAddress = ad1.address

  console.log()
  console.log('Grant RESUME_ROLE to owner...')
  const RESUME_ROLE = await catalist.RESUME_ROLE({
    gasLimit: 1000000,
    gasPrice: 100000,
  })
  await aragonAcl.connect(owner).grantPermission(
    owner.address,
    CatalistAddress,
    RESUME_ROLE,
    {
      gasLimit: 1000000, 
      gasPrice: 100000
    }
  )

  console.log()
  console.log('Querying resume staking...')
  await catalist.connect(owner).resume({
    gasLimit: 1000000,
    gasPrice: 1000000000,
  })

  console.log()
  console.log('Querying grant role RESUME_ROLE to owner...')
  await withdrawalQueueERC721.connect(owner).grantRole(
    await withdrawalQueueERC721.connect(owner).RESUME_ROLE({gasLimit: 1000000, gasPrice: 100000}), 
    owner.address
  )

  console.log()
  console.log('Querying resume withdrawalQueueERC721...')
  await withdrawalQueueERC721.connect(owner).resume({
    gasLimit: 1000000,
    gasPrice: 1000000000,
  })

  console.log()
  console.log('Querying grant role to owner...')
  await hashConsensusForAccountingOracle.connect(owner).grantRole(
    await hashConsensusForAccountingOracle.connect(owner).MANAGE_MEMBERS_AND_QUORUM_ROLE({gasLimit: 1000000, gasPrice: 100000}), 
    owner.address
  )
  await hashConsensusForValidatorsExitBusOracle.connect(owner).grantRole(
    await hashConsensusForValidatorsExitBusOracle.connect(owner).MANAGE_MEMBERS_AND_QUORUM_ROLE({gasLimit: 1000000, gasPrice: 100000}), 
    owner.address
  )

  console.log()
  console.log('Querying add ad1 to consensus member...')
  await hashConsensusForAccountingOracle.connect(owner).addMember(owner.address, 1, {gasLimit: 1000000, gasPrice: 100000})
  await hashConsensusForValidatorsExitBusOracle.connect(owner).addMember(owner.address, 1, {gasLimit: 1000000, gasPrice: 100000})

  console.log()
  console.log('Querying update initial epoch...')
  const latestBlockTimestamp = (await ethers.provider.getBlock('latest')).timestamp
  const initialEpoch = Math.floor((latestBlockTimestamp - GENESIS_TIME)
    / (SLOTS_PER_EPOCH * SECONDS_PER_SLOT))
  await hashConsensusForAccountingOracle.connect(owner).updateInitialEpoch(initialEpoch, {
    gasLimit: 1000000,
    gasPrice: 1000000000,
  })
  await hashConsensusForValidatorsExitBusOracle.connect(owner).updateInitialEpoch(initialEpoch, {
    gasLimit: 1000000,
    gasPrice: 1000000000,
  })
  console.log('- Latest Block Timestamp:', latestBlockTimestamp)
  console.log('- Initial Epoch:', initialEpoch)

  console.log()
  console.log('ValidatorsExitBusOracle Address:', ValidatorsExitBusOracleAddress)

  console.log()
  console.log('Grant RESUME_ROLE to deployer in ValidatorsExitBusOracle...')
  await validatorsExitBusOracle.connect(owner).grantRole(
    await validatorsExitBusOracle.connect(owner).RESUME_ROLE({gasLimit: 1000000, gasPrice: 100000}),
    deployerAddress,
    {
      gasLimit: 1000000,
      gasPrice: 100000,
    }
  )

  console.log()
  console.log('Resume ValidatorsExitBusOracle...')
  await validatorsExitBusOracle.connect(owner).resume({
    gasLimit: 1000000,
    gasPrice: 100000,
  })

  // deposit module 시작
  console.log()
  console.log('Add deposit security module guardian...')
  await depositSecurityModule.connect(owner).addGuardian(
    oracleMemberAddress,
    1,
    {
      gasLimit: 1000000,
      gasPrice: 100000,
    }
  )

  console.log()
  console.log('Grant STAKING_MODULE_RESUME_ROLE to deployer...')
  await stakingRouter.connect(owner).grantRole(
    await stakingRouter.connect(owner).STAKING_MODULE_RESUME_ROLE({gasLimit: 1000000, gasPrice: 100000}),
    deployerAddress,
    {
      gasLimit: 1000000, 
      gasPrice: 100000
    }
  )

  // console.log()
  // console.log('Resume staking module...')
  // await stakingRouter.connect(owner).resumeStakingModule(
  //   1,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )

  console.log()
  console.log('Grant MANAGE_NODE_OPERATOR_ROLE to owner...')
  const MANAGE_NODE_OPERATOR_ROLE = await nodeOperatorRegistry.connect(owner).MANAGE_NODE_OPERATOR_ROLE({
    gasLimit: 1000000, 
    gasPrice: 100000
  })
  await aragonAcl.connect(owner).grantPermission(
    owner.address,
    NodeOperatorRegistryAddress,
    MANAGE_NODE_OPERATOR_ROLE,
    {
      gasLimit: 1000000, 
      gasPrice: 100000
    }
  )
  
  console.log()
  console.log('Create test operator...')
  const operatorId = await nodeOperatorRegistry.connect(owner).addNodeOperator(
    'test-operator',
    owner.address,
    {
      gasLimit: 1000000, 
      gasPrice: 100000
    }
  );
  console.log('- Operator ID:', operatorId);


  console.log()
  console.log('Complete.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
