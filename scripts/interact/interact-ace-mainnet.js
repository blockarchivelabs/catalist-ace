const { parseEther } = require('ethers/lib/utils')
const { ethers } = require('hardhat')

async function main() {
  console.log('Getting the deposit contract...')
  const contractAddress = '0xE6B301375048844bFBdD3e6e98f5bC00f9C982e5'
  const catalist = await ethers.getContractAt('Catalist', contractAddress)
  const hashConsensus = await ethers.getContractAt('HashConsensus', '0x4984e89950CeCCbc72132a038fA808f5624C2b69')
  const stakingRouter = await ethers.getContractAt('StakingRouter', '0x11927dc1Fa1a7F02f8799d3354E2D11b3640b681')
  const accountingOracle = await ethers.getContractAt('AccountingOracle', '0x39Dccfc10D468C279b294c16C362D51BC1dB0E2B')
  const withdrawalQueueERC721 = await ethers.getContractAt('WithdrawalQueueERC721', '0x3E84638DbF1E592DD2DEe9A64912f1B1f53D6454')

  console.log()
  console.log('Querying resume staking...')
  await catalist.resume()

  console.log()
  console.log('Querying grant role RESUME_ROLE to owner...')
  await withdrawalQueueERC721.grantRole('0x2fc10cc8ae19568712f7a176fb4978616a610650813c9d05326c34abb62749c7', '0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058')

  console.log()
  console.log('Querying resume withdrawalQueueERC721...')
  await withdrawalQueueERC721.resume({
    gasLimit: 1000000,
    gasPrice: 1000000,
  })

  // console.log()
  // const beforeBalance = await catalist.balanceOf(
  //   "0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058"
  // )
  // console.log('Before Balance: ', beforeBalance.toString())

  // console.log()
  // console.log('Staking 1ACE...')
  // await catalist.submit('0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058', {
  //   value: parseEther('1'),
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })

  // console.log()
  // const afterBalance = await catalist.balanceOf(
  //   "0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058"
  // )
  // console.log('After Balance: ', afterBalance.toString())

  // console.log()
  // console.log('Querying add MANAGE_MEMBERS_AND_QUORUM_ROLE to deployer')
  // await hashConsensus
  //   .grantRole(
  //     '0x66a484cf1a3c6ef8dfd59d24824943d2853a29d96f34a01271efc55774452a51', 
  //     '0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058')
  
  // console.log()
  // console.log('Querying add to hash consensus member...')
  // await hashConsensus.addMember('0xB458c332C242247C46e065Cf987a05bAf7612904', 1, {
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })
  
  // console.log()
  // console.log('Querying get member...')
  // const members = await hashConsensus.getMembers()
  // console.log('Members:', members)

  // console.log()
  // console.log('Querying add staking module manage role to deployer and ad1...')
  // await stakingRouter.grantRole('0x3105bcbf19d4417b73ae0e58d508a65ecf75665e46c2622d8521732de6080c48', '0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058')

  // await hashConsensus.updateInitialEpoch(1, {
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })

  // const status = await accountingOracle.getProcessingState()
  // console.log('Status:', status)

  const wc = await stakingRouter.getWithdrawalCredentials()
  console.log('Withdrawal Credentials:', wc)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
