const { parseEther } = require('ethers/lib/utils')
const { ethers } = require('hardhat')
const { hexConcat, pad, ETH, e27, e18, toBN } = require('./utils')
const fs = require('fs')

// RPC_URL=http://20.197.13.207:8545 npx hardhat run scripts/interact/interact-ace-mainnet.js --network ace_mainnet
async function main() {
  console.log('Getting the deposit contract...')
  const addresses = JSON.parse(fs.readFileSync('./deployed-ace_mainnet.json', 'utf-8'))
  const CatalistAddress = addresses['app:catalist'].proxy.address
  const HashConsensusAddress = addresses.hashConsensusForAccountingOracle.address
  const StakingRouterAddress = addresses.stakingRouter.proxy.address
  const AccountingOracleAddress = addresses.accountingOracle.proxy.address
  const WithdrawalQueueERC721Address = addresses.withdrawalQueueERC721.proxy.address
  const NodeOperatorRegistryAddress = addresses['app:node-operators-registry'].proxy.address

  const catalist = await ethers.getContractAt('Catalist', CatalistAddress)
  const hashConsensus = await ethers.getContractAt('HashConsensus', HashConsensusAddress)
  const stakingRouter = await ethers.getContractAt('StakingRouter', StakingRouterAddress)
  const accountingOracle = await ethers.getContractAt('AccountingOracle', AccountingOracleAddress)
  const withdrawalQueueERC721 = await ethers.getContractAt('WithdrawalQueueERC721', WithdrawalQueueERC721Address)
  const nodeOperatorRegistry = await ethers.getContractAt('NodeOperatorsRegistry', NodeOperatorRegistryAddress)

  const deployerAddress = '0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058'
  const oracleMemberAddress = '0xB458c332C242247C46e065Cf987a05bAf7612904'

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

  // console.log()
  // console.log('Querying add node operator...')
  // const operatorId = await nodeOperatorRegistry.addNodeOperator(
  //   'test-operator', 
  //   deployerAddress
  // )
  // console.log('Operator ID:', operatorId)

  const operatorId = 0
  // console.log()
  // console.log('Querying add signing keys...')
  // await nodeOperatorRegistry.addSigningKeys(
  //   operatorId,
  //   5,
  //   hexConcat(
  //     '9063b434700f10568b925d20ca9913005ac84e5084901517ff6a572e786bb8c2c51aee081f4046af7e697216751b179c',
  //     'b7ba13f57af0846cbc09884adb56387e2b4124cbc54ed13401c91be688020b3a9efcbadb456fd3e2991cc0dfaf538bfe',
  //     'b011f9177135ed1720000a9dc8faf6e632bce36647771166abf7b6ef3c8d2fabf06a5082a17fe837beac8c2667158ca7',
  //     'b7818959cc0abca70ab853a1e5df6fc25c5edb1b6152f316aca3bbbde8c53e5bbf3d7c4f2fe7a2a4536301f3577f28a9',
  //     'a0043c4372f8e552b211fd49cec76c7cd3ad4d5922d17cc09b1e6318f6832ac86c41cd51bc5c8a7bc7b868f6d25a9cb4'),
  //   hexConcat(
  //     '8ace7716703d8baf5c6863cdcbec7b3b3286c60ab68c29157b3c2f7ceecfefccd79d79b732932d5659886eae7162b05009c549eb42dbd4d17501c04d427801676597531bbbb6c85226420eebf0cd8189895ffffd8c2c3bd3cdda2c72a299e41c',
  //     'b80ad171cf720d85f3fe6b6a94886685848bc7508cdeb91d6347b839f79ab57afe590e19ff4c465ae27c71d4facb248307285eb93b507e2e41336cf40c0d8456879504f1dfc1681a5809decb534bdf11be4e5789aa05275ace4bf0febfc50f8b',
  //     'b611d17db6a918b8c277ba8e1951673044085aa3089c56bd1a635353c547bd933eaa17eaf7466a73ca548dfd0f425acc04ad241334f190b8a8592ebdcd7c02d65fee1f549e032e42390866d757d7dc9211f37bae48bae6747abea4efa505f0e6',
  //     '8de5c0216fcf872b780835bef9b48f2f0d8173d13fc4348f56e79f77b0335eaebdfa0219a5b6f66c4d4f04f3fbb30ed4109e5bdf85bfcc4b8fde07bdf87941a788f017db181e015ecb42131487d08fcf43dcf8d93753a5e7d5bb06797074d375',
  //     'b513f2a6a947f1c640c19a3bd6242be9801583ab187bc584130bbb8f437988e5c02e3c37e6c2293daf79238f70c2a7ec11c2aed187862efbf5b07b22b81a9f37ec97bd946b5d47310c9890b3f1fecabe853104f93a3e43ba1b329f872c1cc208'),
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // );

  // console.log()
  // console.log('Querying remove signing keys...')
  // await nodeOperatorRegistry.removeSigningKeys(
  //   operatorId, 
  //   0, 
  //   5, 
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // );

  console.log()
  console.log('Querying get singing keys...')
  const signingKeys = await nodeOperatorRegistry.getSigningKeys(operatorId, 0, 5, {
    gasLimit: 1000000,
    gasPrice: 100000,
  })
  console.log('Signing Keys:', signingKeys)

  // console.log()
  // console.log('Querying getWithdrawalRequests()...')
  // const withdrawalRequests = await withdrawalQueueERC721.getWithdrawalRequests(
  //   '0x26AC28D33EcBf947951d6B7d8a1e6569eE73d076',
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )
  // console.log('Withdrawal Requests:', withdrawalRequests)

  // console.log()
  // console.log('Querying getWithdrawalStatus()...')
  // const withdrawalStatus = await withdrawalQueueERC721.getWithdrawalStatus(
  //   [1],
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )
  // console.log('Withdrawal Status:', withdrawalStatus)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
