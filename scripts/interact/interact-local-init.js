const { parseEther } = require('ethers/lib/utils')
const { ethers } = require('hardhat')

async function main() {
  console.log('Getting the deposit contract...')
  const CatalistAddress = '0xf2A08B9C303496f7FF99Ce2d4A6b6efb65E0e752'
  const LegacyOracleAddress = '0x89eDDde70037A68983D576a036b1DB7CdCAAb0A1'
  const HashConsensusAddress = '0x36C02dA8a0983159322a80FFE9F24b1acfF8B570'
  const StakingRouterAddress = '0xCA8c8688914e0F7096c920146cd0Ad85cD7Ae8b9'
  const WithdrawalQueueERC721Address = '0x95401dc811bb5740090279Ba06cfA8fcF6113778'
  const AccountingOracleAddress = '0x5eb3Bc0a489C5A8288765d2336659EbCA68FCd00'
  
  const catalist = await ethers.getContractAt('Catalist', CatalistAddress)
  const legacyOracle = await ethers.getContractAt('LegacyOracle', LegacyOracleAddress)

  const hashConsensus = await ethers.getContractAt('HashConsensus', HashConsensusAddress)
  const stakingRouter = await ethers.getContractAt('StakingRouter', StakingRouterAddress)
  const withdrawalQueueERC721 = await ethers.getContractAt('WithdrawalQueueERC721', WithdrawalQueueERC721Address)
  const accountingOracle = await ethers.getContractAt('AccountingOracle', AccountingOracleAddress)

  const [owner, ad1] = await ethers.getSigners()

  console.log()
  console.log('Catalist.resume()')
  await catalist.connect(owner).resume()

  console.log()
  console.log('WithdrawalQueueERC721.grantRole(RESUME_ROLE, owner.address)')
  await withdrawalQueueERC721.connect(owner).grantRole('0x2fc10cc8ae19568712f7a176fb4978616a610650813c9d05326c34abb62749c7', owner.address)

  console.log()
  console.log('WithdrawalQueueERC721.resume()')
  await withdrawalQueueERC721.connect(owner).resume({
    gasLimit: 1000000,
    gasPrice: 1000000000,
  })

  console.log()
  console.log('HashConsensus.grantRole(MANAGE_MEMBERS_AND_QUORUM_ROLE, owner.address)')
  await hashConsensus.connect(owner).grantRole('0x66a484cf1a3c6ef8dfd59d24824943d2853a29d96f34a01271efc55774452a51', owner.address)

  // const latestBlockTimestamp = (await ethers.provider.getBlock('latest')).timestamp
  // const initialEpoch = Math.floor((latestBlockTimestamp - chainSpec.genesisTime)
  //   / (chainSpec.slotsPerEpoch * chainSpec.secondsPerSlot))
  await hashConsensus.connect(owner).updateInitialEpoch(1, {
    gasLimit: 1000000,
    gasPrice: 1000000000,
  })
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
