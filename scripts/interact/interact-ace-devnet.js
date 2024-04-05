const { parseEther } = require('ethers/lib/utils')
const { ethers } = require('hardhat')

// RPC_URL=http://20.197.51.29:8545 npx hardhat run scripts/interact/interact-ace-devnet.js --network ace_test
async function main() {
  console.log('Getting the deposit contract...')
  const catalist = await ethers.getContractAt('Catalist', '0x72bB7806B8459337b231016e182348CD853E3106')
  const hashConsensus = await ethers.getContractAt('HashConsensus', '0x9A956d3b228C3e212D96480938003fc686f51380')
  const stakingRouter = await ethers.getContractAt('StakingRouter', '0x7b6d791175eB131f66d4E7ed732b8FE5686ED668')
  const accountingOracle = await ethers.getContractAt('AccountingOracle', '0xD908fB45e9550fA989F45bF8C661E97f9C5FAc43')
  const withdrawalQueueERC721 = await ethers.getContractAt('WithdrawalQueueERC721', '0x86c0c0b392c71c954F92eE02E63413A145B70A31')
  const nodeOperatorRegistry = await ethers.getContractAt('NodeOperatorsRegistry', '0xAE6c0F93fB6E4A87d2DA9F199f3CfEeF67AEC6B5')

  const deployerAddress = '0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058'
  const oracleMemberAddress = '0xB458c332C242247C46e065Cf987a05bAf7612904'
  const account2 = '0x0e540Fa9958f9fbE75C627442C86E8C5019C6db7'

  // --------------------최초 배포시 초기화 코드--------------------
  console.log()
  console.log('Querying resume staking...')
  await catalist.resume({
    gasLimit: 1000000,
    gasPrice: 1000000,
  })

  console.log()
  console.log('Querying grant role RESUME_ROLE to owner...')
  await withdrawalQueueERC721.grantRole(
    await withdrawalQueueERC721.RESUME_ROLE(),
    deployerAddress
  )

  console.log()
  console.log('Querying resume withdrawalQueueERC721...')
  await withdrawalQueueERC721.resume({
    gasLimit: 1000000,
    gasPrice: 1000000,
  })

  console.log()
  console.log('Querying add MANAGE_MEMBERS_AND_QUORUM_ROLE to deployer')
  await hashConsensus.grantRole(
    await hashConsensus.MANAGE_MEMBERS_AND_QUORUM_ROLE(), 
    deployerAddress
  )
  
  console.log()
  console.log('Querying add to hash consensus member...')
  await hashConsensus.addMember(
    oracleMemberAddress, 
    1, 
    {
      gasLimit: 1000000,
      gasPrice: 100000,
    }
  )

  console.log()
  console.log('Querying update initial epoch...')
  await hashConsensus.updateInitialEpoch(
    1, 
    {
      gasLimit: 1000000,
      gasPrice: 100000,
    }
  )
  // --------------------여기까지 초기화 코드--------------------

  // console.log()
  // const beforeBalance = await catalist.balanceOf(deployerAddress)
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
  // console.log('Querying get member...')
  // const members = await hashConsensus.getMembers()
  // console.log('Members:', members)

  // console.log()
  // console.log('Querying add STAKING_MODULE_MANAGE_ROLE to deployer and ad1...')
  // await stakingRouter.grantRole(
  //   await stakingRouter.STAKING_MODULE_MANAGE_ROLE(), 
  //   deployerAddress
  // )

  console.log()
  console.log('Querying add node operator...')
  const operatorId = await nodeOperatorRegistry.addNodeOperator(
    'test-operator', 
    deployerAddress
  )
  console.log('Operator ID:', operatorId)

  // const operatorId = 0
  // console.log()
  // console.log('Querying add signing keys...')
  // await nodeOperatorRegistry.addSigningKeys(
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
  // const signingKeys = await nodeOperatorRegistry.getSigningKeys(operatorId, 0, 5)
  // console.log('Signing Keys:', signingKeys)

  // console.log()
  // console.log('Querying active operators count...')
  // const activeOperators = await nodeOperatorRegistry.getActiveNodeOperatorsCount()
  // console.log('Active Operators:', activeOperators.toString())

  // console.log()
  // console.log('Querying node operator summary...')
  // const operatorSummary = await nodeOperatorRegistry.getNodeOperatorSummary(operatorId)
  // console.log('Operator Summary:', operatorSummary)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
