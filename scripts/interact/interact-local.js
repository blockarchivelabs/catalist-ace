const { parseEther } = require('ethers/lib/utils')
const { ethers } = require('hardhat')

async function main() {
  console.log('Getting the deposit contract...')
  const CatalistAddress = '0xf2A08B9C303496f7FF99Ce2d4A6b6efb65E0e752'
  const LegacyOracleAddress = '0x89eDDde70037A68983D576a036b1DB7CdCAAb0A1'
  
  const catalist = await ethers.getContractAt('Catalist', CatalistAddress)
  const legacyOracle = await ethers.getContractAt('LegacyOracle', LegacyOracleAddress)

  const hashConsensus = await ethers.getContractAt('HashConsensus', '0x36C02dA8a0983159322a80FFE9F24b1acfF8B570')
  const stakingRouter = await ethers.getContractAt('StakingRouter', '0x0E801D84Fa97b50751Dbf25036d067dCf18858bF')
  const withdrawalQueueERC721 = await ethers.getContractAt('WithdrawalQueueERC721', '0x95401dc811bb5740090279Ba06cfA8fcF6113778')
  const accountingOracle = await ethers.getContractAt('AccountingOracle', '0x5eb3Bc0a489C5A8288765d2336659EbCA68FCd00')

  const [owner, ad1] = await ethers.getSigners()

  console.log()
  console.log('Querying resume staking...')
  await catalist.connect(owner).resume()

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
  // console.log('Querying grant role RESUME_ROLE to owner...')
  // await withdrawalQueueERC721.connect(owner).grantRole('0x2fc10cc8ae19568712f7a176fb4978616a610650813c9d05326c34abb62749c7', owner.address)

  // console.log()
  // console.log('Querying resume withdrawalQueueERC721...')
  // await withdrawalQueueERC721.connect(owner).resume({
  //   gasLimit: 1000000,
  //   gasPrice: 1000000000,
  // })

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


  // 초기 설정 시작!

  // await hashConsensus.connect(owner).updateInitialEpoch(1, {
  //   gasLimit: 1000000,
  //   gasPrice: 1000000000,
  // })

  const wc = await stakingRouter.getWithdrawalCredentials()
  console.log('Withdrawal Credentials:', wc)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
