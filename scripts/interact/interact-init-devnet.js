const { parseEther } = require('ethers/lib/utils')
const { ethers } = require('hardhat')
const fs = require('fs')

// RPC_URL=http://20.197.51.29:8545 npx hardhat run scripts/interact/interact-ace-devnet.js --network ace_test
async function main() {
  console.log('Getting the deposit contract...')
  const addresses = JSON.parse(fs.readFileSync('./deployed-ace_devnet.json', 'utf-8'))
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
