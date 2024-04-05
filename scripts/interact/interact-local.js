const { parseEther } = require('ethers/lib/utils')
const { ethers } = require('hardhat')
const { hexConcat, pad, ETH, e27, e18, toBN } = require('./utils')

async function main() {
  console.log('Getting the deposit contract...')
  const CatalistAddress = '0xf2A08B9C303496f7FF99Ce2d4A6b6efb65E0e752'
  const HashConsensusAddress = '0x36C02dA8a0983159322a80FFE9F24b1acfF8B570'
  const LegacyOracleAddress = '0x89eDDde70037A68983D576a036b1DB7CdCAAb0A1'
  const NodeOperatorsRegistryAddress = '0x13765f00119e45c63004aC0587a45a889171EFcA'
  const StakingRouterAddress = '0x0E801D84Fa97b50751Dbf25036d067dCf18858bF'
  const WithdrawalQueueERC721Address = '0x95401dc811bb5740090279Ba06cfA8fcF6113778'
  const AccountingOracleAddress = '0x5eb3Bc0a489C5A8288765d2336659EbCA68FCd00'
  
  const catalist = await ethers.getContractAt('Catalist', CatalistAddress)
  const legacyOracle = await ethers.getContractAt('LegacyOracle', LegacyOracleAddress)
  const hashConsensus = await ethers.getContractAt('HashConsensus', HashConsensusAddress)
  const stakingRouter = await ethers.getContractAt('StakingRouter', StakingRouterAddress)
  const withdrawalQueueERC721 = await ethers.getContractAt('WithdrawalQueueERC721', WithdrawalQueueERC721Address)
  const accountingOracle = await ethers.getContractAt('AccountingOracle', AccountingOracleAddress)
  const nodeOperatorsRegistry = await ethers.getContractAt('NodeOperatorsRegistry', NodeOperatorsRegistryAddress)

  const [owner, ad1] = await ethers.getSigners()

  // console.log()
  // console.log('Querying resume staking...')
  // await catalist.connect(owner).resume()

  // console.log()
  // console.log('Querying grant role RESUME_ROLE to owner...')
  // await withdrawalQueueERC721.connect(owner).grantRole('0x2fc10cc8ae19568712f7a176fb4978616a610650813c9d05326c34abb62749c7', owner.address)

  // console.log()
  // console.log('Querying resume withdrawalQueueERC721...')
  // await withdrawalQueueERC721.connect(owner).resume({
  //   gasLimit: 1000000,
  //   gasPrice: 1000000000,
  // })

  // console.log()
  // console.log('Querying update initial epoch...')
  // await hashConsensus.connect(owner).updateInitialEpoch(1, {
  //   gasLimit: 1000000,
  //   gasPrice: 1000000000,
  // })

  // console.log()
  // const beforeBalance = await catalist.balanceOf(
  //   // "0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058"
  //   ad1.address
  // )
  // console.log('Before Balance of ad1: ', beforeBalance.toString())

  // console.log()
  // console.log('Staking 100ACE...')
  // await catalist.connect(ad1).submit(owner.address, {
  //   value: parseEther('100'),
  //   gasLimit: 1000000,
  //   gasPrice: 1000000000,
  // })

  // console.log()
  // const afterBalance = await catalist.balanceOf(ad1.address)
  // console.log('After Balance of ad1: ', afterBalance.toString())

  // console.log()
  // console.log('Qeurying delete owner ad1...')
  // await catalist.connect(owner).setOwner(ad1.address, false)

  // console.log()
  // console.log('Qeuerying pause by ad1...')
  // await catalist.connect(ad1).stop()

  // console.log()
  // console.log('Querying grant role to owner...')
  // await hashConsensus.connect(owner).grantRole('0x66a484cf1a3c6ef8dfd59d24824943d2853a29d96f34a01271efc55774452a51', owner.address)

  // console.log()
  // console.log('Querying add ad1 to consensus member...')
  // await hashConsensus.connect(owner).addMember(ad1.address, 1)

  // console.log()
  // console.log('Querying manage fast lane config role to ad1...')
  // await hashConsensus.connect(owner).grantRole('0x921f40f434e049d23969cbe68d9cf3ac1013fbe8945da07963af6f3142de6afe', ad1.address)
  
  // console.log()
  // console.log('Querying get member...')
  // const members = await hashConsensus.connect(owner).getMembers()
  // console.log('Members:', members)

  // console.log()
  // console.log('Querying add staking module manage role to deployer and ad1...')
  // await stakingRouter.connect(owner).grantRole('0x3105bcbf19d4417b73ae0e58d508a65ecf75665e46c2622d8521732de6080c48', owner.address)
  // await stakingRouter.connect(owner).grantRole('0x3105bcbf19d4417b73ae0e58d508a65ecf75665e46c2622d8521732de6080c48', ad1.address)

  // console.log()
  // console.log('Querying ad1 approve...')
  // await catalist.connect(ad1).approve('0x95401dc811bb5740090279Ba06cfA8fcF6113778', parseEther('10'))

  // console.log()
  // console.log('Querying allowance...')
  // const allowance = await catalist.connect(owner).allowance(ad1.address, '0x95401dc811bb5740090279Ba06cfA8fcF6113778')
  // console.log('Allowance:', allowance.toString())

  // console.log()
  // console.log('Querying request withdrawals...')
  // const withdraw = await withdrawalQueueERC721.connect(ad1).requestWithdrawals([parseEther('10')], ad1.address, {
  //   gasLimit: 1000000,
  //   gasPrice: 1000000000,
  // })
  // console.log('Withdraw requestId:', withdraw)

  // console.log()
  // console.log('Querying hashConsensus submitReport...')
  // await hashConsensus.connect(ad1).submitReport(0, '0x1234567890123456789012345678901234567890123456789012345678901234', 1)

  // console.log()
  // console.log('Querying add node operator...')
  // const operatorId = await nodeOperatorsRegistry.connect(owner).addNodeOperator('test-operator', ad1.address)
  // console.log('Operator ID:', operatorId)

  const operatorId = 0
  console.log()
  console.log('Querying add signing keys...')
  await nodeOperatorsRegistry.connect(ad1).addSigningKeys(
    operatorId,
    5,
    hexConcat(
      'b1b42665c10fddd6f312e2e0912ad7f1b1edc7ba98c7c9628ad477924e1ec565f5ac143cba08fcf8a26d591692b5371b',
      '943589a55d2a87515820b41697406d02698d51772e6762c3ad2083e966aa8b14df0186246a75f007bf9b16615d87d3c8',
      'a5a5dbbd14777ba04014485649532563f5cf6528f252c3980925eccca846e874968670253f441537066fd9797d0f55d0',
      '8ecdfe9dde0773736595c4547957413c90f5416ef122fabeeaedbb9c98b8fa630a61b0539b8809e2d449c3854bc88e2f',
      'b585fe8b5269dd7d92fe57f9d3090951d2847d1e960309188cbe58f8725b036e758c17fd9900fd2856b9e950cc231482'),
    hexConcat(
      '9711fbb89d7164069488680b3eb53618954ea3135feb5d9cf32e8a9202e6891a75ec0cf7be0593e29870fa910c06348312379052db181e2acbaa73525302f4d13680b57f30855dbfa1a1430dcc92b957f1cbb88db40848fabe61ad3c0c787b01',
      '968b05ee2482010bddc5d63419e50e1dfe209367f11eacd4a982af6d30817e27cb4e4223a87e9e5fad55fc094c1e4561078e607689cc7324795c0da991fb06efeb111546c49becea3e636dc1c1b6aa6eb2509a664cba0b46edcab5203fe57662',
      'b28d73b5ad6b61d0a83c09762cd635e8cb92dcbe8db40fd85948966af51df08b5f483b9d00647ccc96afc68b91f3442c13e1fce2be3473aef0498993c44632534467b3ac227243a2f617c1bad85c16f5ba4a087c10b27a5caadd96f0f98de1a6',
      '977daeb615afcde1bf630b7447f1bfee900febab74a37271b0e1b11997610e785f8157252e73d2b61f3bb98db605dda40cbc86547598da3a8ca4dd25a82bb4f0cc7749bb3dfb33de21e225bad5169f498ea7a63e123db71727893b38f27b7193',
      'a1d8b1a83e52c636e8e4d12c97846e9ac52b48ebc433f8ffb54e9f619974d3b1799bc0f4664366ba799147b988a69731123d2d4734d84d31e57b9ed545b09682314b54ba5d38ac50f36bf63abc7102db762c6e272a1f2f628b18b506dff5c0ed'),
    {
      gasLimit: 1000000,
      gasPrice: 100000,
    }
  );

  console.log()
  console.log('Querying get singing keys...')
  const signingKeys = await nodeOperatorsRegistry.connect(owner).getSigningKeys(operatorId, 0, 1)
  console.log('Signing Keys:', signingKeys)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
