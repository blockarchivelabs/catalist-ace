const { parseEther } = require('ethers/lib/utils')
const { ethers } = require('hardhat')
const { hexConcat, pad, ETH, e27, e18, toBN } = require('./utils')
const { getEventArgument, ZERO_ADDRESS } = require('@aragon/contract-helpers-test')
const fs = require('fs')

// RPC_URL=http://127.0.0.1:8545 npx hardhat run scripts/interact/interact-local.js --network local
async function main() {
  console.log('Getting the deposit contract...')
  const fileName = './deployed-local.json'
  const addresses = JSON.parse(fs.readFileSync(fileName, 'utf-8'))
  const CatalistAddress = addresses['app:catalist'].proxy.address
  const CatalistTemplateAddress = addresses.catalistTemplate.address
  const HashConsensusForAccountingOracleAddress = addresses.hashConsensusForAccountingOracle.address
  const HashConsensusForValidatorsExitBusOracle = addresses.hashConsensusForValidatorsExitBusOracle.address
  const NodeOperatorRegistryAddress = addresses['app:node-operators-registry'].proxy.address
  const StakingRouterAddress = addresses.stakingRouter.proxy.address
  const AccountingOracleAddress = addresses.accountingOracle.proxy.address
  const WithdrawalQueueERC721Address = addresses.withdrawalQueueERC721.proxy.address
  const DepositSecurityModuleAddress = addresses.depositSecurityModule.address
  const ValidatorsExitBusOracleAddress = addresses.validatorsExitBusOracle.proxy.address
  const AragonKernelAddress = addresses['aragon-kernel'].proxy.address
  const AragonAclAddress = addresses['aragon-acl'].proxy.address

  const catalist = await ethers.getContractAt('Catalist', CatalistAddress)
  const catalistTemplate = await ethers.getContractAt('CatalistTemplate', CatalistTemplateAddress)
  const hashConsensusForAccountingOracle = await ethers.getContractAt('HashConsensus', HashConsensusForAccountingOracleAddress)
  const hashConsensusForValidatorsExitBusOracle = await ethers.getContractAt('HashConsensus', HashConsensusForValidatorsExitBusOracle)
  const stakingRouter = await ethers.getContractAt('StakingRouter', StakingRouterAddress)
  const accountingOracle = await ethers.getContractAt('AccountingOracle', AccountingOracleAddress)
  const withdrawalQueueERC721 = await ethers.getContractAt('WithdrawalQueueERC721', WithdrawalQueueERC721Address)
  const nodeOperatorRegistry = await ethers.getContractAt('NodeOperatorsRegistry', NodeOperatorRegistryAddress)
  const depositSecurityModule = await ethers.getContractAt('DepositSecurityModule', DepositSecurityModuleAddress)
  const validatorsExitBusOracle = await ethers.getContractAt('ValidatorsExitBusOracle', ValidatorsExitBusOracleAddress)
  const aragonKernel = await ethers.getContractAt('Kernel', AragonKernelAddress)
  const aragonKernelProxy = await ethers.getContractAt('KernelProxy', AragonKernelAddress)
  const aragonAcl = await ethers.getContractAt('ACL', AragonAclAddress)

  const chainSpec = JSON.parse(fs.readFileSync(fileName, 'utf-8')).chainSpec
  const GENESIS_TIME = chainSpec.genesisTime
  const SLOTS_PER_EPOCH = chainSpec.slotsPerEpoch
  const SECONDS_PER_SLOT = chainSpec.secondsPerSlot

  const [owner, ad1] = await ethers.getSigners()
  const deployerAddress = owner.address
  const oracleMemberAddress = ad1.address

  const CATALIST_APP_ID = '0xfe7e515193fc7331eedd97433fad4b507d16473770a68882c43677c8f27ebcd8'
  // const NEW_CATALIST_ADDRESS = '0xDF4A425efAF188E94ae443E58101C3CE44b80D9c'

  const APP_BASES_NAMESPACE = await aragonKernel.connect(owner).APP_BASES_NAMESPACE({
    gasLimit: 1000000,
    gasPrice: 100000,
  })
  console.log()
  console.log('APP_BASES_NAMESPACE:', APP_BASES_NAMESPACE)
  // const APP_ADDR_NAMESPACE = await aragonKernel.connect(owner).APP_ADDR_NAMESPACE({
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })
  // console.log('APP_ADDR_NAMESPACE:', APP_ADDR_NAMESPACE)
  const APP_MANAGER_ROLE = await aragonKernel.connect(owner).APP_MANAGER_ROLE({
    gasLimit: 1000000,
    gasPrice: 100000,
  })

  console.log()
  console.log('Get permission manager...')
  const manager = await aragonAcl.connect(owner).getPermissionManager(
    AragonKernelAddress,
    APP_MANAGER_ROLE,
    {
      gasLimit: 1000000,
      gasPrice: 100000,
    }
  )
  console.log('- manager:', manager)

  console.log()
  console.log('Grant APP_MANAGER_ROLE to owner...')
  await aragonAcl.connect(owner).grantPermissionP(
    owner.address,
    AragonKernelAddress,
    APP_MANAGER_ROLE,
    [
      APP_BASES_NAMESPACE,
      CATALIST_APP_ID,
    ],
    {
      gasLimit: 1000000,
      gasPrice: 100000,
    }
  )

  // console.log()
  // console.log('Get name from catalist...')
  // const beforeName = await catalist.connect(owner).name({
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })
  // console.log('- name:', beforeName)

  console.log()
  console.log('Deploy new Catalist.sol...')
  const catalistFactory = await ethers.getContractFactory('Catalist')
  const newCatalist = await catalistFactory.deploy()
  await newCatalist.deployed()
  console.log('- New Catalist deployed to:', newCatalist.address)

  console.log()
  console.log('Get address from kernel...')
  const beforeAddress = await aragonKernel.connect(owner).getApp(
    APP_BASES_NAMESPACE,
    CATALIST_APP_ID,
    {
      gasLimit: 1000000,
      gasPrice: 100000,
    }
  )
  console.log('- address:', beforeAddress)

  console.log()
  console.log('Set app from kernel...')
  const changedAppId = await aragonKernel.connect(owner).setApp(
    APP_BASES_NAMESPACE,
    CATALIST_APP_ID,
    newCatalist.address,
    {
      gasLimit: 1000000,
      gasPrice: 100000,
    }
  )
  console.log('- changedAppId:', changedAppId)

  console.log()
  console.log('Get address from kernel...')
  const afterAddress = await aragonKernel.connect(owner).getApp(
    APP_BASES_NAMESPACE,
    CATALIST_APP_ID,
    {
      gasLimit: 1000000,
      gasPrice: 100000,
    }
  )
  console.log('- address:', afterAddress)

  console.log()
  console.log('Get name from upgraded catalist...')
  const afterName = await catalist.connect(owner).name({
    gasLimit: 1000000,
    gasPrice: 100000,
  })
  console.log('- name:', afterName)

  // console.log()
  // console.log('Querying get member...')
  // const members = await hashConsensus.connect(owner).getMembers()
  // console.log('Members:', members)

  // console.log()
  // const beforeBalance = await catalist.connect(owner).balanceOf(owner.address)
  // console.log('Before Balance: ', beforeBalance.toString())

  // console.log()
  // console.log('Staking 100ACE...')
  // await catalist.connect(owner).submit(owner.address, {
  //   value: parseEther('100'),
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })

  // console.log()
  // const afterBalance = await catalist.connect(owner).balanceOf(owner.address)
  // console.log('After Balance: ', afterBalance.toString())

  // console.log()
  // console.log('Querying request withdrawals...')
  // const withdraw = await withdrawalQueueERC721.connect(owner).requestWithdrawals(
  //   [parseEther('9')], 
  //   owner.address, 
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 1000000000,
  //   }
  // )
  // console.log('Withdraw requestId:', withdraw)

  // console.log()
  // console.log('Querying unbACE balanceOf...')
  // const balanceOf = await withdrawalQueueERC721.connect(owner).balanceOf(owner.address)
  // console.log('wbACE Balance:', balanceOf.toString())

  // console.log()
  // console.log('Querying add node operator...')
  // const operatorId = await nodeOperatorsRegistry.connect(owner).addNodeOperator('test-operator', ad1.address)
  // console.log('Operator ID:', operatorId)

  // const operatorId = 0
  // console.log()
  // console.log('Querying add signing keys...')
  // await nodeOperatorsRegistry.connect(ad1).addSigningKeys(
  //   operatorId,
  //   5,
  //   hexConcat(
  //     'b1b42665c10fddd6f312e2e0912ad7f1b1edc7ba98c7c9628ad477924e1ec565f5ac143cba08fcf8a26d591692b5371b',
  //     '943589a55d2a87515820b41697406d02698d51772e6762c3ad2083e966aa8b14df0186246a75f007bf9b16615d87d3c8',
  //     'a5a5dbbd14777ba04014485649532563f5cf6528f252c3980925eccca846e874968670253f441537066fd9797d0f55d0',
  //     '8ecdfe9dde0773736595c4547957413c90f5416ef122fabeeaedbb9c98b8fa630a61b0539b8809e2d449c3854bc88e2f',
  //     'b585fe8b5269dd7d92fe57f9d3090951d2847d1e960309188cbe58f8725b036e758c17fd9900fd2856b9e950cc231482'),
  //   hexConcat(
  //     '9711fbb89d7164069488680b3eb53618954ea3135feb5d9cf32e8a9202e6891a75ec0cf7be0593e29870fa910c06348312379052db181e2acbaa73525302f4d13680b57f30855dbfa1a1430dcc92b957f1cbb88db40848fabe61ad3c0c787b01',
  //     '968b05ee2482010bddc5d63419e50e1dfe209367f11eacd4a982af6d30817e27cb4e4223a87e9e5fad55fc094c1e4561078e607689cc7324795c0da991fb06efeb111546c49becea3e636dc1c1b6aa6eb2509a664cba0b46edcab5203fe57662',
  //     'b28d73b5ad6b61d0a83c09762cd635e8cb92dcbe8db40fd85948966af51df08b5f483b9d00647ccc96afc68b91f3442c13e1fce2be3473aef0498993c44632534467b3ac227243a2f617c1bad85c16f5ba4a087c10b27a5caadd96f0f98de1a6',
  //     '977daeb615afcde1bf630b7447f1bfee900febab74a37271b0e1b11997610e785f8157252e73d2b61f3bb98db605dda40cbc86547598da3a8ca4dd25a82bb4f0cc7749bb3dfb33de21e225bad5169f498ea7a63e123db71727893b38f27b7193',
  //     'a1d8b1a83e52c636e8e4d12c97846e9ac52b48ebc433f8ffb54e9f619974d3b1799bc0f4664366ba799147b988a69731123d2d4734d84d31e57b9ed545b09682314b54ba5d38ac50f36bf63abc7102db762c6e272a1f2f628b18b506dff5c0ed'),
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // );

  // console.log()
  // console.log('Querying get singing keys...')
  // const signingKeys = await nodeOperatorsRegistry.connect(owner).getSigningKeys(operatorId, 0, 1)
  // console.log('Signing Keys:', signingKeys)

  // console.log()
  // console.log('Get StakingModuleStatus...')
  // const status = await stakingRouter.connect(owner).getStakingModuleStatus(1, {gasLimit: 1000000, gasPrice: 100000})
  // console.log('- Status:', status)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
