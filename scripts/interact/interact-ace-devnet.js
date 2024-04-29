const { parseEther } = require('ethers/lib/utils')
const { ethers } = require('hardhat')
const fs = require('fs')

function dangerouslyCastUintArrayToBytes(input) {
  // Calculate the byte length of the array
  let byteLength = input.length * 32;
  // Create a new Uint8Array with the calculated byte length
  let output = new Uint8Array(byteLength);
  // Copy the elements of the input array into the output array
  for (let i = 0; i < input.length; i++) {
      // Get the current uint256 value from the input array
      let value = input[i];
      // Convert the uint256 value into bytes and copy it into the output array
      for (let j = 0; j < 32; j++) {
          // Calculate the byte offset for the current value
          let byteOffset = i * 32 + j;
          // Extract the byte at the current position
          let byte = (value / (2 ** (8 * (31 - j)))) & 0xff;
          // Set the byte in the output array
          output[byteOffset] = byte;
      }
  }
  return output;
}

function dangerouslyCastBytesToUintArray(input) {
  // Calculate the number of uint256 values in the bytes array
  let intsLength = input.length / 32;
  // Ensure that the length of the bytes array is a multiple of 32
  if (input.length !== intsLength * 32) {
      throw new Error("Improper length");
  }
  // Create a new Uint256 array with the calculated length
  let output = new Array(intsLength);
  // Copy the bytes array into the uint256 array
  for (let i = 0; i < intsLength; i++) {
      // Calculate the byte offset for the current uint256 value
      let byteOffset = i * 32;
      // Extract the bytes from the bytes array and convert them into a uint256 value
      let value = 0;
      for (let j = 0; j < 32; j++) {
          // Shift the current byte to its appropriate position in the uint256 value
          value += input[byteOffset + j] * (2 ** (8 * (31 - j)));
      }
      // Store the uint256 value in the output array
      output[i] = value;
  }
  return output;
}


// RPC_URL=http://20.197.51.29:8545 npx hardhat run scripts/interact/interact-ace-devnet.js --network ace_devnet
async function main() {
  console.log('Getting the deposit contract...')
  const addresses = JSON.parse(fs.readFileSync('./deployed-ace_devnet.json', 'utf-8'))
  const CatalistAddress = addresses['app:catalist'].proxy.address
  const HashConsensusForAccountingOracleAddress = addresses.hashConsensusForAccountingOracle.address
  const HashConsensusForValidatorsExitBusOracle = addresses.hashConsensusForValidatorsExitBusOracle.address
  const NodeOperatorRegistryAddress = addresses['app:node-operators-registry'].proxy.address
  const StakingRouterAddress = addresses.stakingRouter.proxy.address
  const AccountingOracleAddress = addresses.accountingOracle.proxy.address
  const WithdrawalQueueERC721Address = addresses.withdrawalQueueERC721.proxy.address
  const DepositSecurityModuleAddress = addresses.depositSecurityModule.address
  const ValidatorsExitBusOracleAddress = addresses.validatorsExitBusOracle.proxy.address
  const AragonKernelAddress = addresses['aragon-kernel'].proxy.address
  const AragonAclAddress = addresses['aragon-acl'].proxy.address
  const VotingAddress = addresses['app:aragon-voting'].proxy.address

  const catalist = await ethers.getContractAt('Catalist', CatalistAddress)
  const catalistProxy = await ethers.getContractAt('AppProxyUpgradeable', CatalistAddress)
  const hashConsensusForAccountingOracle = await ethers.getContractAt('HashConsensus', HashConsensusForAccountingOracleAddress)
  const hashConsensusForValidatorsExitBusOracle = await ethers.getContractAt('HashConsensus', HashConsensusForValidatorsExitBusOracle)
  const stakingRouter = await ethers.getContractAt('StakingRouter', StakingRouterAddress)
  const accountingOracle = await ethers.getContractAt('AccountingOracle', AccountingOracleAddress)
  const withdrawalQueueERC721 = await ethers.getContractAt('WithdrawalQueueERC721', WithdrawalQueueERC721Address)
  const nodeOperatorRegistry = await ethers.getContractAt('NodeOperatorsRegistry', NodeOperatorRegistryAddress)
  const depositSecurityModule = await ethers.getContractAt('DepositSecurityModule', DepositSecurityModuleAddress)
  const validatorsExitBusOracle = await ethers.getContractAt('ValidatorsExitBusOracle', ValidatorsExitBusOracleAddress)
  const aragonKernel = await ethers.getContractAt('Kernel', AragonKernelAddress)
  const aragonKernelProxy = await ethers.getContractAt('KernelProxy', AragonKernelAddress)
  const aragonAcl = await ethers.getContractAt('ACL', AragonAclAddress)
  const voting = await ethers.getContractAt('Voting', VotingAddress)

  const deployerAddress = '0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058'
  const oracleMemberAddress = '0xB458c332C242247C46e065Cf987a05bAf7612904'
  const account2 = '0x0e540Fa9958f9fbE75C627442C86E8C5019C6db7'

  const chainSpec = JSON.parse(fs.readFileSync('./deployed-testnet-defaults.json', 'utf-8')).chainSpec
  const GENESIS_TIME = 1705568400
  const SLOTS_PER_EPOCH = chainSpec.slotsPerEpoch
  const SECONDS_PER_SLOT = chainSpec.secondsPerSlot

  const CATALIST_APP_ID = '0xfe7e515193fc7331eedd97433fad4b507d16473770a68882c43677c8f27ebcd8'
  const ORIGIN_CATALIST_ADDRESS = '0x528f4b1a0B36dD7E5C7f553fEE00a8F21E736b48'
  const NEW_CATALIST_ADDRESS = '0x3B14B746e9d66e652D241fe04BBdDA46C76A4bB0'

  const APP_BASES_NAMESPACE = await aragonKernel.APP_BASES_NAMESPACE({
    gasLimit: 1000000,
    gasPrice: 100000,
  })
  console.log()
  console.log('APP_BASES_NAMESPACE:', APP_BASES_NAMESPACE)

  const APP_MANAGER_ROLE = await aragonKernel.APP_MANAGER_ROLE({
    gasLimit: 1000000,
    gasPrice: 100000,
  })
  console.log('APP_MANAGER_ROLE:', APP_MANAGER_ROLE)

  console.log()
  console.log('RESUME_ROLE...')
  const RESUME_ROLE = await catalist.RESUME_ROLE({
    gasLimit: 1000000,
    gasPrice: 100000,
  })
  const canPerform = await catalist.canPerform(
    deployerAddress,
    RESUME_ROLE,
    [],
    {
      gasLimit: 1000000,
      gasPrice: 100000,
    }
  )
  console.log('- Can perform:', canPerform)

  console.log()
  console.log('MANAGE_NODE_OPERATOR_ROLE...')
  const MANAGE_NODE_OPERATOR_ROLE = await nodeOperatorRegistry.MANAGE_NODE_OPERATOR_ROLE({
    gasLimit: 1000000,
    gasPrice: 100000,
  })
  const canPerform2 = await nodeOperatorRegistry.canPerform(
    deployerAddress,
    MANAGE_NODE_OPERATOR_ROLE,
    [],
    {
      gasLimit: 1000000,
      gasPrice: 100000,
    }
  )
  console.log('- Can perform:', canPerform2)

  console.log()
  console.log('MODIFY_QUORUM_ROLE...')
  const MODIFY_QUORUM_ROLE = await voting.MODIFY_QUORUM_ROLE({
    gasLimit: 1000000,
    gasPrice: 100000,
  })
  const canPerform3 = await voting.canPerform(
    deployerAddress,
    MODIFY_QUORUM_ROLE,
    [],
    {
      gasLimit: 1000000,
      gasPrice: 100000,
    }
  )
  console.log('- Can perform:', canPerform3)

  // console.log()
  // console.log('Grant APP_MANAGER_ROLE to owner...')
  // await aragonAcl.grantPermission(
  //   deployerAddress,
  //   AragonKernelAddress,
  //   APP_MANAGER_ROLE,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )

  // console.log()
  // console.log('Check permission...')
  // const paramBytes = dangerouslyCastUintArrayToBytes([
  //   APP_BASES_NAMESPACE,
  //   CATALIST_APP_ID,
  // ])
  // const permission = await aragonKernel.hasPermission(
  //   deployerAddress,
  //   AragonKernelAddress,
  //   APP_MANAGER_ROLE,
  //   paramBytes,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )
  // console.log('- permission:', permission)

  // console.log()
  // console.log('Get name from catalist...')
  // const beforeName = await catalist.name()
  // console.log('- name:', beforeName)

  // console.log()
  // console.log('Get address from kernel...')
  // const beforeAddress = await aragonKernel.getApp(
  //   APP_BASES_NAMESPACE,
  //   CATALIST_APP_ID,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )
  // console.log('- address:', beforeAddress)

  // console.log()
  // console.log('Deploy new Catalist...')
  // const Catalist = await ethers.getContractFactory('Catalist')
  // const newCatalist = await Catalist.deploy()
  // await newCatalist.deployed()
  // console.log('New Catalist deployed to:', newCatalist.address)

  // console.log()
  // console.log('Set app from kernel...')
  // await aragonKernel.setApp(
  //   APP_BASES_NAMESPACE,
  //   CATALIST_APP_ID,
  //   NEW_CATALIST_ADDRESS,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )

  // console.log()
  // console.log('Get address from kernel...')
  // const afterAddress = await aragonKernel.getApp(
  //   APP_BASES_NAMESPACE,
  //   CATALIST_APP_ID,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )
  // console.log('- address:', afterAddress)

  // console.log()
  // console.log('Get name from upgraded catalist...')
  // const afterName = await catalist.name()
  // console.log('- name:', afterName)

  // console.log()
  // console.log('Get Catalist implementation address...')
  // const appAddress = await aragonKernelProxy.apps(
  //   APP_BASES_NAMESPACE,
  //   CATALIST_APP_ID,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )
  // console.log('- apps:', appAddress)

  // console.log()
  // console.log('Get implementation address from kernel proxy...')
  // const implementationAddress = await aragonKernelProxy.implementation({
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })
  // console.log('- Implementation address:', implementationAddress)

  // console.log()
  // console.log('Querying update initial epoch...')
  // const latestBlockTimestamp = (await ethers.provider.getBlock('latest')).timestamp
  // const initialEpoch = Math.floor((latestBlockTimestamp - GENESIS_TIME)
  //   / (SLOTS_PER_EPOCH * SECONDS_PER_SLOT))
  // await hashConsensus.updateInitialEpoch(
  //   initialEpoch, 
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )
  // console.log('Latest Block Timestamp:', latestBlockTimestamp)
  // console.log('Initial Epoch:', initialEpoch)
  
  // console.log()
  // const beforeBalance = await catalist.balanceOf(deployerAddress)
  // console.log('Before Balance: ', beforeBalance.toString())

  // console.log()
  // console.log('Staking 0.01ACE...')
  // await catalist.submit(deployerAddress, {
  //   value: parseEther('0.01'),
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })

  // console.log()
  // const decimal = await catalist.decimals()
  // const fix = 10 ** decimal
  // const afterBalance = await catalist.balanceOf(deployerAddress)
  // console.log('After Balance: ', +afterBalance / fix)
  
  // console.log()
  // console.log('Querying get member...')
  // const members = await hashConsensus.getMembers({
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })
  // console.log('Members:', members)

  // console.log()
  // console.log('Querying add STAKING_MODULE_MANAGE_ROLE to deployer and ad1...')
  // await stakingRouter.grantRole(
  //   await stakingRouter.STAKING_MODULE_MANAGE_ROLE(), 
  //   deployerAddress
  // )

  // console.log()
  // console.log('Querying add node operator...')
  // const operatorId = await nodeOperatorRegistry.addNodeOperator(
  //   'test-operator', 
  //   deployerAddress
  // )
  // console.log('Operator ID:', operatorId)

  // const operatorId = 0
  // console.log()
  // console.log('Querying add signing keys...')
  // await nodeOperatorRegistry.addSigningKeys(
  //   operatorId,
  //   5,
  //   hexConcat(
  //     'b1b42665c10fddd6f312e2e0912ad7f1b1edc7ba98c7c9628ad477924e1ec565f5ac143cba08fcf8a26d591692b5371b',
  //     '943589a55d2a87515820b41697406d02698d51772e6762c3ad2083e966aa8b14df0186246a75f007bf9b16615d87d3c8',
  //     'a5a5dbbd14777ba04014485649532563f5cf6528f252c3980925eccca846e874968670253f441537066fd9797d0f55d0',
  //     '8ecdfe9dde0773736595c4547957413c90f5416ef122fabeeaedbb9c98b8fa630a61b0539b8809e2d449c3854bc88e2f',
  //     'b585fe8b5269dd7d92fe57f9d3090951d2847d1e960309188cbe58f8725b036e758c17fd9900fd2856b9e950cc231482'),
  //   hexConcat(
  //     '9711fbb89d7164069488680b3eb53618954ea3135feb5d9cf32e8a9202e6891a75ec0cf7be0593e29870fa910c06348312379052db181e2acbaa73525302f4d13680b57f30855dbfa1a1430dcc92b957f1cbb88db40848fabe61ad3c0c787b01',
  //     '968b05ee2482010bddc5d63419e50e1dfe209367f11eacd4a982af6d30817e27cb4e4223a87e9e5fad55fc094c1e4561078e607689cc7324795c0da991fb06efeb111546c49becea3e636dc1c1b6aa6eb2509a664cba0b46edcab5203fe57662',
  //     'b28d73b5ad6b61d0a83c09762cd635e8cb92dcbe8db40fd85948966af51df08b5f483b9d00647ccc96afc68b91f3442c13e1fce2be3473aef0498993c44632534467b3ac227243a2f617c1bad85c16f5ba4a087c10b27a5caadd96f0f98de1a6',
  //     '977daeb615afcde1bf630b7447f1bfee900febab74a37271b0e1b11997610e785f8157252e73d2b61f3bb98db605dda40cbc86547598da3a8ca4dd25a82bb4f0cc7749bb3dfb33de21e225bad5169f498ea7a63e123db71727893b38f27b7193',
  //     'a1d8b1a83e52c636e8e4d12c97846e9ac52b48ebc433f8ffb54e9f619974d3b1799bc0f4664366ba799147b988a69731123d2d4734d84d31e57b9ed545b09682314b54ba5d38ac50f36bf63abc7102db762c6e272a1f2f628b18b506dff5c0ed'),
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // );

  // console.log()
  // console.log('Querying get singing keys...')
  // const signingKeys = await nodeOperatorRegistry.getSigningKeys(operatorId, 0, 5)
  // console.log('Signing Keys:', signingKeys)

  // console.log()
  // console.log('Querying getWithdrawalRequests()...')
  // const withdrawalRequests = await withdrawalQueueERC721.getWithdrawalRequests(
  //   '0x26AC28D33EcBf947951d6B7d8a1e6569eE73d076',
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )
  // console.log('Withdrawal Requests:', withdrawalRequests)

  // console.log()
  // console.log('Querying getLastCheckpointIndex()...')
  // const lastCheckpointIndex = await withdrawalQueueERC721.getLastCheckpointIndex({
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // })
  // console.log('Last Checkpoint Index:', lastCheckpointIndex.toString())

  // console.log()
  // console.log('Querying findCheckpointHints()...')
  // const checkpointHints = await withdrawalQueueERC721.findCheckpointHints(
  //   [1, 2, 3, 4],
  //   1,
  //   await withdrawalQueueERC721.getLastCheckpointIndex() - 1,
  //   {
  //     gasLimit: 1000000,
  //     gasPrice: 100000,
  //   }
  // )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
