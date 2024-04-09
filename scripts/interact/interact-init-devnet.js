const { parseEther } = require('ethers/lib/utils')
const { ethers } = require('hardhat')

// RPC_URL=http://20.197.51.29:8545 npx hardhat run scripts/interact/interact-ace-devnet.js --network ace_test
async function main() {
  console.log('Getting the deposit contract...')
  const CatalistAddress = '0x72bB7806B8459337b231016e182348CD853E3106'
  const HashConsensusAddress = '0x9A956d3b228C3e212D96480938003fc686f51380'
  const StakingRouterAddress = '0x7b6d791175eB131f66d4E7ed732b8FE5686ED668'
  const AccountingOracleAddress = '0xD908fB45e9550fA989F45bF8C661E97f9C5FAc43'
  const WithdrawalQueueERC721Address = '0x86c0c0b392c71c954F92eE02E63413A145B70A31'
  const NodeOperatorRegistryAddress = '0xAE6c0F93fB6E4A87d2DA9F199f3CfEeF67AEC6B5'

  const catalist = await ethers.getContractAt('Catalist', CatalistAddress)
  const hashConsensus = await ethers.getContractAt('HashConsensus', HashConsensusAddress)
  const stakingRouter = await ethers.getContractAt('StakingRouter', StakingRouterAddress)
  const accountingOracle = await ethers.getContractAt('AccountingOracle', AccountingOracleAddress)
  const withdrawalQueueERC721 = await ethers.getContractAt('WithdrawalQueueERC721', WithdrawalQueueERC721Address)
  const nodeOperatorRegistry = await ethers.getContractAt('NodeOperatorsRegistry', NodeOperatorRegistryAddress)

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
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
