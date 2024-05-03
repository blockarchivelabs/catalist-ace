const { ethers } = require('hardhat')
const getContracts = require('./loader')

// RPC_URL=http://20.197.13.207:8545 npx hardhat run scripts/interact/interact-ace-mainnet.js --network ace_mainnet
async function main() {
  const loader = await getContracts()
  const GAS_INFO = {
    gasLimit: 1000000,
    gasPrice: 100000,
  }

  

  console.log()
  console.log('Complete.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })