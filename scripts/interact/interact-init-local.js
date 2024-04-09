const { parseEther } = require('ethers/lib/utils')
const { ethers } = require('hardhat')
const { hexConcat, pad, ETH, e27, e18, toBN } = require('./utils')
const { getEventArgument, ZERO_ADDRESS } = require('@aragon/contract-helpers-test')
const fs = require('fs')

async function main() {
  console.log('Getting the deposit contract...')
  const addresses = JSON.parse(fs.readFileSync('./deployed-local.json', 'utf-8'))
  const CatalistAddress = addresses['app:catalist'].proxy.address
  const HashConsensusAddress = addresses.hashConsensusForAccountingOracle.address
  const StakingRouterAddress = addresses.stakingRouter.proxy.address
  const AccountingOracleAddress = addresses.accountingOracle.proxy.address
  const WithdrawalQueueERC721Address = addresses.withdrawalQueueERC721.proxy.address
  const NodeOperatorRegistryAddress = addresses['app:node-operators-registry'].proxy.address
  
  const catalist = await ethers.getContractAt('Catalist', CatalistAddress)
  const hashConsensus = await ethers.getContractAt('HashConsensus', HashConsensusAddress)
  const stakingRouter = await ethers.getContractAt('StakingRouter', StakingRouterAddress)
  const withdrawalQueueERC721 = await ethers.getContractAt('WithdrawalQueueERC721', WithdrawalQueueERC721Address)
  const accountingOracle = await ethers.getContractAt('AccountingOracle', AccountingOracleAddress)
  const nodeOperatorsRegistry = await ethers.getContractAt('NodeOperatorsRegistry', NodeOperatorRegistryAddress)

  const [owner, ad1] = await ethers.getSigners()

  console.log()
  console.log('Querying resume staking...')
  await catalist.connect(owner).resume({
    gasLimit: 1000000,
    gasPrice: 1000000000,
  })

  console.log()
  console.log('Querying grant role RESUME_ROLE to owner...')
  await withdrawalQueueERC721.connect(owner).grantRole(
    await withdrawalQueueERC721.connect(owner).RESUME_ROLE(), 
    owner.address
  )

  console.log()
  console.log('Querying resume withdrawalQueueERC721...')
  await withdrawalQueueERC721.connect(owner).resume({
    gasLimit: 1000000,
    gasPrice: 1000000000,
  })

  console.log()
  console.log('Querying update initial epoch...')
  await hashConsensus.connect(owner).updateInitialEpoch(1, {
    gasLimit: 1000000,
    gasPrice: 1000000000,
  })

  console.log()
  console.log('Querying grant role to owner...')
  await hashConsensus.connect(owner).grantRole(
    await hashConsensus.connect(owner).MANAGE_MEMBERS_AND_QUORUM_ROLE(), 
    owner.address
  )

  console.log()
  console.log('Querying add ad1 to consensus member...')
  await hashConsensus.connect(owner).addMember(owner.address, 1)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
