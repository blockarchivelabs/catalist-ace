const { parseEther } = require('ethers/lib/utils')
const { ethers } = require('hardhat')

async function main() {
  console.log('Getting the deposit contract...')
  const contractAddress = '0x8431072b7C2EA9F3317e9C5c1778C6c23847EDE7'
  const catalist = await ethers.getContractAt('Catalist', contractAddress)
  const hashConsensus = await ethers.getContractAt('HashConsensus', '0xd7E3460FE84fbe140eBa976c80A14E1A8fdfD5fD')
  const stakingRouter = await ethers.getContractAt('StakingRouter', '0xF0F6B704fB7FD3e5f322f01e3C2D3c5b26cE7C01')

  // console.log()
  // console.log('Querying token name...')
  // const name = await catalist.name()
  // console.log('Token name:', name)

  // console.log()
  // console.log('Querying token symbol...')
  // const symbol = await catalist.symbol()
  // console.log('Token symbol:', symbol)

  // console.log()
  // console.log('Querying token decimals...')
  // const decimals = await catalist.decimals()
  // console.log('Token decimals:', decimals.toString())

  // console.log()
  // console.log('Querying token total supply...')
  // const totalSupply = await catalist.totalSupply()
  // console.log('Token total supply:', totalSupply.toString())

  // console.log()
  // console.log('Querying get buffered ace...')
  // const bufferedAce = await catalist.getBufferedAce()
  // console.log('Buffered ACE:', bufferedAce.toString())

  // console.log()
  // console.log('Querying get total staked ace...')
  // const totalStakedAce = await catalist.getTotalPooledAce()
  // console.log('Total staked ACE:', totalStakedAce.toString())

  // console.log()
  // console.log('Querying add owner...')
  // await catalist.setOwner(ad1.address, true)

  // console.log()
  // console.log('Querying resume staking...')
  // await catalist.resume()

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
  // console.log('Qeurying delete owner ad1...')
  // await catalist.connect(owner).setOwner(ad1.address, false)

  // console.log()
  // console.log('Qeuerying pause by ad1...')
  // await catalist.connect(ad1).stop()

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
  
  console.log()
  console.log('Querying get member...')
  const members = await hashConsensus.getMembers()
  console.log('Members:', members)

  // console.log()
  // console.log('Querying add staking module manage role to deployer and ad1...')
  // await stakingRouter.grantRole('0x3105bcbf19d4417b73ae0e58d508a65ecf75665e46c2622d8521732de6080c48', '0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
