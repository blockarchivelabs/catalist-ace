const { ethers } = require('hardhat')
const fs = require('fs')
const path = require("path")

// RPC_URL=http://20.197.13.207:8545 npx hardhat run scripts/interact/mainnet-event-log.js --network ace_mainnet
async function main() {
  console.log('Getting the deposit contract...')
  const fileName = './deployed-ace-mainnet-stACE.json'
  const addresses = JSON.parse(fs.readFileSync(fileName, 'utf-8'))
  const depositContractAddress = addresses.chainSpec.depositContract
  const CatalistAddress = addresses['app:catalist'].proxy.address
  const HashConsensusForAccountingOracleAddress = addresses.hashConsensusForAccountingOracle.address
  const HashConsensusForForValidatorsExitBusOracle = addresses.hashConsensusForValidatorsExitBusOracle.address
  const StakingRouterAddress = addresses.stakingRouter.proxy.address
  const AccountingOracleAddress = addresses.accountingOracle.proxy.address
  const WithdrawalQueueERC721Address = addresses.withdrawalQueueERC721.proxy.address
  const NodeOperatorsRegistryAddress = addresses['app:node-operators-registry'].proxy.address
  const DepositSecurityModuleAddress = addresses.depositSecurityModule.address
  const CatalistLocatorAddress = addresses.catalistLocator.proxy.address
  const ValidatorsExitBusOracleAddress = addresses.validatorsExitBusOracle.proxy.address
  const AragonKernelAddress = addresses['aragon-kernel'].proxy.address
  const AragonAclAddress = addresses['aragon-acl'].proxy.address

  const depositContract = await ethers.getContractAt('DepositContract', depositContractAddress)
  const catalist = await ethers.getContractAt('Catalist', CatalistAddress)
  const catalistProxy = await ethers.getContractAt('AppProxyUpgradeable', CatalistAddress)
  const catalistAragonApp = await ethers.getContractAt('AragonApp', CatalistAddress)
  const hashConsensusForAccountingOracle = await ethers.getContractAt('HashConsensus', HashConsensusForAccountingOracleAddress)
  const hashConsensusForValidatorsExitBusOracle = await ethers.getContractAt('HashConsensus', HashConsensusForForValidatorsExitBusOracle)
  const stakingRouter = await ethers.getContractAt('StakingRouter', StakingRouterAddress)
  const accountingOracle = await ethers.getContractAt('AccountingOracle', AccountingOracleAddress)
  const withdrawalQueueERC721 = await ethers.getContractAt('WithdrawalQueueERC721', WithdrawalQueueERC721Address)
  const nodeOperatorsRegistry = await ethers.getContractAt('NodeOperatorsRegistry', NodeOperatorsRegistryAddress)
  const depositSecurityModule = await ethers.getContractAt('DepositSecurityModule', DepositSecurityModuleAddress)
  const catalistLocator = await ethers.getContractAt('CatalistLocator', CatalistLocatorAddress)
  const validatorsExitBusOracle = await ethers.getContractAt('ValidatorsExitBusOracle', ValidatorsExitBusOracleAddress)
  const aragonKernel = await ethers.getContractAt('Kernel', AragonKernelAddress)
  const aragonKernelProxy = await ethers.getContractAt('KernelProxy', AragonKernelAddress)
  const aragonAcl = await ethers.getContractAt('ACL', AragonAclAddress)

  // 추적할 컨트랙트, 이벤트 정보 입력
  const EVENT = 'ExitedAndStuckValidatorsCountsUpdateFailed'
  const CONTRACT = stakingRouter
  const CONTRACT_NAME = 'StakingRouter'
  const CONTRACT_ADDRESS = StakingRouterAddress


  // abi 불러오기
  const dir = path.resolve(
    __dirname,
    "../../lib/abi/" + CONTRACT_NAME + ".json"
  )
  const file = fs.readFileSync(dir, "utf8")
  const abi = JSON.parse(file)
  const filter = {
    address: CONTRACT_ADDRESS,
    fromBlock: 0,
    toBlock: 10000000,
    topics: [CONTRACT.filters[EVENT]().topics]
  };
  
  const logs = await ethers.provider.getLogs(filter);
  console.log()
  console.log('event logs for', EVENT)
  console.log(logs)

  console.log()
  const iface = new ethers.utils.Interface(abi);  
  logs.forEach((log) => {
    console.log()
    console.log("decoded event index:", log.logIndex);
    console.log("- transaction hash:", log.transactionHash);
    console.log("- data:", iface.decodeEventLog(EVENT, log.data, log.topics));
  })
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
