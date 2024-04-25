const { parseEther } = require('ethers/lib/utils')
const { ethers } = require('hardhat')
const { hexConcat, pad, ETH, e27, e18, toBN } = require('./utils')
const fs = require('fs')
const { DSMAttestMessage } = require('../../test/helpers/signatures')
const namehash = require('eth-ens-namehash').hash

// RPC_URL=http://20.197.13.207:8545 npx hardhat run scripts/interact/mainnet-upgradable-aragon.js --network ace_mainnet
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
  const NodeOperatorRegistryAddress = addresses['app:node-operators-registry'].proxy.address
  const DepositSecurityModuleAddress = addresses.depositSecurityModule.address
  const CatalistLocatorAddress = addresses.catalistLocator.proxy.address
  const ValidatorsExitBusOracle = addresses.validatorsExitBusOracle.proxy.address
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
  const nodeOperatorRegistry = await ethers.getContractAt('NodeOperatorsRegistry', NodeOperatorRegistryAddress)
  const depositSecurityModule = await ethers.getContractAt('DepositSecurityModule', DepositSecurityModuleAddress)
  const catalistLocator = await ethers.getContractAt('CatalistLocator', CatalistLocatorAddress)
  // const catalistLocator = await ethers.getContractAt('CatalistLocator', '0x8f744ECF16293801cFB28B4f063D7267cD7541F1')
  const validatorsExitBusOracle = await ethers.getContractAt('ValidatorsExitBusOracle', ValidatorsExitBusOracle)
  const aragonKernel = await ethers.getContractAt('Kernel', AragonKernelAddress)
  const aragonKernelProxy = await ethers.getContractAt('KernelProxy', AragonKernelAddress)
  const aragonAcl = await ethers.getContractAt('ACL', AragonAclAddress)

  const deployerAddress = '0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058'
  const deployerPrivateKey = 'f11a771308f235a1331b098d0212db69ac049e56c9f1e0da739a39e8b743363c'
  const oracleMemberAddress = '0xB458c332C242247C46e065Cf987a05bAf7612904'
  const testerAddress = '0x26AC28D33EcBf947951d6B7d8a1e6569eE73d076'

  const chainSpec = JSON.parse(fs.readFileSync(fileName, 'utf-8')).chainSpec
  const GENESIS_TIME = chainSpec.genesisTime
  const SLOTS_PER_EPOCH = chainSpec.slotsPerEpoch
  const SECONDS_PER_SLOT = chainSpec.secondsPerSlot

  const GAS_INFO = {
    gasLimit: 1000000,
    gasPrice: 100000,
  }

  const CATALIST_APP_ID = '0xfe7e515193fc7331eedd97433fad4b507d16473770a68882c43677c8f27ebcd8'
  const ORIGIN_CATALIST_ADDRESS = '0x14Cb36737D2EA82e617E241fb32A44f652e0E8F4'
  const NEW_CATALIST_ADDRESS = '0x0665f48d1ddebF766837b771f29584eA6c23Dc43'

  const APP_BASES_NAMESPACE = await aragonKernel.APP_BASES_NAMESPACE(GAS_INFO)
  console.log()
  console.log('APP_BASES_NAMESPACE:', APP_BASES_NAMESPACE)

  const APP_MANAGER_ROLE = await aragonKernel.APP_MANAGER_ROLE(GAS_INFO)
  console.log('APP_MANAGER_ROLE:', APP_MANAGER_ROLE)

  console.log()
  console.log('Grant APP_MANAGER_ROLE to owner...')
  await aragonAcl.grantPermission(
    deployerAddress,
    AragonKernelAddress,
    APP_MANAGER_ROLE,
    GAS_INFO
  )

  console.log()
  console.log('Check permission...')
  const paramBytes = dangerouslyCastUintArrayToBytes([
    APP_BASES_NAMESPACE,
    CATALIST_APP_ID,
  ])
  const permission = await aragonKernel.hasPermission(
    deployerAddress,
    AragonKernelAddress,
    APP_MANAGER_ROLE,
    paramBytes,
    GAS_INFO
  )
  console.log('- permission:', permission)

  console.log()
  console.log('Get name from catalist...')
  const beforeName = await catalist.name()
  console.log('- name:', beforeName)

  console.log()
  console.log('Get address from kernel...')
  const beforeAddress = await aragonKernel.getApp(
    APP_BASES_NAMESPACE,
    CATALIST_APP_ID,
    GAS_INFO
  )
  console.log('- address:', beforeAddress)

  console.log()
  console.log('Deploy new Catalist...')
  const Catalist = await ethers.getContractFactory('Catalist')
  const newCatalist = await Catalist.deploy()
  await newCatalist.deployed()
  console.log('New Catalist deployed to:', newCatalist.address)

  console.log()
  console.log('Set app from kernel...')
  await aragonKernel.setApp(
    APP_BASES_NAMESPACE,
    CATALIST_APP_ID,
    NEW_CATALIST_ADDRESS,
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