const { parseEther } = require('ethers/lib/utils')
const { ethers } = require('hardhat')
const { hexConcat, pad, ETH, e27, e18, toBN } = require('./utils')
const { getEventArgument, ZERO_ADDRESS } = require('@aragon/contract-helpers-test')

async function main() {
  console.log('Getting the deposit contract...')
  const CatalistAddress = '0xc00c0beC9F5C6b245A5c232598b3A2cc1558C3c7'
  const HashConsensusAddress = '0x99bbA657f2BbC93c02D617f8bA121cB8Fc104Acf'
  const LegacyOracleAddress = '0x3b2eA4DC3E52f79F3050f30312A14D019B16F3A9'
  const NodeOperatorsRegistryAddress = '0x5C3A16AE3fCbc7B81e6cE87d8e47dE59a6Ab6140'
  const StakingRouterAddress = '0x95401dc811bb5740090279Ba06cfA8fcF6113778'
  const WithdrawalQueueERC721Address = '0x9E545E3C0baAB3E08CdfD552C960A1050f373042'
  const AccountingOracleAddress = '0x4826533B4897376654Bb4d4AD88B7faFD0C98528'
  // const WbACEAddress = '0x851356ae760d987E095750cCeb3bC6014560891C'
  
  const catalist = await ethers.getContractAt('Catalist', CatalistAddress)
  const legacyOracle = await ethers.getContractAt('LegacyOracle', LegacyOracleAddress)
  const hashConsensus = await ethers.getContractAt('HashConsensus', HashConsensusAddress)
  const stakingRouter = await ethers.getContractAt('StakingRouter', StakingRouterAddress)
  const withdrawalQueueERC721 = await ethers.getContractAt('WithdrawalQueueERC721', WithdrawalQueueERC721Address)
  const accountingOracle = await ethers.getContractAt('AccountingOracle', AccountingOracleAddress)
  const nodeOperatorsRegistry = await ethers.getContractAt('NodeOperatorsRegistry', NodeOperatorsRegistryAddress)
  // const wbACE = await ethers.getContractAt('WbACE', WbACEAddress)

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
    await withdrawalQueueERC721.RESUME_ROLE(), 
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
    await hashConsensus.MANAGE_MEMBERS_AND_QUORUM_ROLE(), 
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
