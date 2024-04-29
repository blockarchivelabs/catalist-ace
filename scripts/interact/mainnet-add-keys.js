const { parseEther } = require('ethers/lib/utils')
const { ethers } = require('hardhat')
const { hexConcat, pad, ETH, e27, e18, toBN } = require('./utils')
const fs = require('fs')
const { DSMAttestMessage } = require('../../test/helpers/signatures')

// RPC_URL=http://20.197.13.207:8545 npx hardhat run scripts/interact/mainnet-add-keys.js --network ace_mainnet
async function main() {
  console.log('Getting the deposit contract...')
  const FILE_NAME = './deployed-ace-mainnet-stACE.json'
  const addresses = JSON.parse(fs.readFileSync(FILE_NAME, 'utf-8'))
  const depositContractAddress = addresses.chainSpec.depositContract
  const CatalistAddress = addresses['app:catalist'].proxy.address
  const HashConsensusAddress = addresses.hashConsensusForAccountingOracle.address
  const StakingRouterAddress = addresses.stakingRouter.proxy.address
  const AccountingOracleAddress = addresses.accountingOracle.proxy.address
  const WithdrawalQueueERC721Address = addresses.withdrawalQueueERC721.proxy.address
  const NodeOperatorRegistryAddress = addresses['app:node-operators-registry'].proxy.address
  const DepositSecurityModuleAddress = addresses.depositSecurityModule.address

  const depositContract = await ethers.getContractAt('DepositContract', depositContractAddress)
  const catalist = await ethers.getContractAt('Catalist', CatalistAddress)
  const hashConsensus = await ethers.getContractAt('HashConsensus', HashConsensusAddress)
  const stakingRouter = await ethers.getContractAt('StakingRouter', StakingRouterAddress)
  const accountingOracle = await ethers.getContractAt('AccountingOracle', AccountingOracleAddress)
  const withdrawalQueueERC721 = await ethers.getContractAt('WithdrawalQueueERC721', WithdrawalQueueERC721Address)
  const nodeOperatorRegistry = await ethers.getContractAt('NodeOperatorsRegistry', NodeOperatorRegistryAddress)
  const depositSecurityModule = await ethers.getContractAt('DepositSecurityModule', DepositSecurityModuleAddress)

  const GAS_INFO = {
    gasLimit: 1000000,
    gasPrice: 100000,
  }


  
  // 키 관리할 오퍼레이터 지정하기
  const NODE_OPERATOR_ID = 0

  // validator key 파일 이름 입력
  const DEPOSIT_DATA_FILE = './deposit_data-1712068080.json'
  
  
  console.log()
  console.log('Add signing keys...')
  
  const KEY_DATA = JSON.parse(fs.readFileSync(DEPOSIT_DATA_FILE, 'utf-8'))
  const pubkeys = KEY_DATA.map(data => data.pubkey)
  const signatures = KEY_DATA.map(data => data.signature)
  const KEY_COUNT = pubkeys.length
  
  console.log('- count:', KEY_COUNT)

  await nodeOperatorRegistry.addSigningKeys(
    NODE_OPERATOR_ID,
    KEY_COUNT,
    hexConcat(...pubkeys),
    hexConcat(...signatures),
    GAS_INFO
  )

  console.log()
  console.log('Complete.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
