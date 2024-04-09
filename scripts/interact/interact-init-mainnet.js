const { parseEther } = require('ethers/lib/utils')
const { ethers } = require('hardhat')
const { hexConcat, pad, ETH, e27, e18, toBN } = require('./utils')

// RPC_URL=http://20.197.13.207:8545 npx hardhat run scripts/interact/interact-ace-mainnet.js --network ace_mainnet
async function main() {
  console.log('Getting the deposit contract...')
  const CatalistAddress = '0x23bBA284db799Ca49381bEA734F1A55f14692f5c'
  const HashConsensusAddress = '0x23b1f732c9B20CC09b8046931407ED2A883Cca82'
  const StakingRouterAddress = '0x630941c45Cd3BC0B4FC843900C29c8432f4e935d'
  const AccountingOracleAddress = '0xAC9d01Fa37A9492876Ead645D95011795e07bFEE'
  const WithdrawalQueueERC721Address = '0x9B6C9256f63a855f761A1ffEC792376346855406'
  const NodeOperatorRegistryAddress = '0x1B731c8e3Cb936440F5298DBE548A7C9d765264C'

  const catalist = await ethers.getContractAt('Catalist', CatalistAddress)
  const hashConsensus = await ethers.getContractAt('HashConsensus', HashConsensusAddress)
  const stakingRouter = await ethers.getContractAt('StakingRouter', StakingRouterAddress)
  const accountingOracle = await ethers.getContractAt('AccountingOracle', AccountingOracleAddress)
  const withdrawalQueueERC721 = await ethers.getContractAt('WithdrawalQueueERC721', WithdrawalQueueERC721Address)
  const nodeOperatorRegistry = await ethers.getContractAt('NodeOperatorsRegistry', NodeOperatorRegistryAddress)

  const deployerAddress = '0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058'
  const oracleMemberAddress = '0xB458c332C242247C46e065Cf987a05bAf7612904'

  // 최초 배포시 초기화 코드
  console.log()
  console.log('Querying resume staking...')
  await catalist.resume()

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
  // 여기까지 초기화 코드
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
