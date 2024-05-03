const fs = require('fs');
const { ethers } = require('hardhat')
const path = require('path');

async function getContracts() {
  console.log('Getting contract information...');
  
  const FILE_NAME = path.join(__dirname, '../../deployed-ace_mainnet.json');
  const addresses = JSON.parse(fs.readFileSync(FILE_NAME, 'utf-8'));

  const contracts = {
    DepositContract: {
      name: 'DepositContract',
      address: addresses.chainSpec.depositContract,
      contract: await ethers.getContractAt('DepositContract', addresses.chainSpec.depositContract)
    },
    Catalist: {
      name: 'Catalist',
      address: addresses['app:catalist'].proxy.address,
      contract: await ethers.getContractAt('Catalist', addresses['app:catalist'].proxy.address)
    },
    HashConsensusForAccountingOracle: {
      name: 'HashConsensus',
      address: addresses.hashConsensusForAccountingOracle.address,
      contract: await ethers.getContractAt('HashConsensus', addresses.hashConsensusForAccountingOracle.address)
    },
    HashConsensusForValidatorsExitBusOracle: {
      name: 'HashConsensus',
      address: addresses.hashConsensusForValidatorsExitBusOracle.address,
      contract: await ethers.getContractAt('HashConsensus', addresses.hashConsensusForValidatorsExitBusOracle.address)
    },
    StakingRouter: {
      name: 'StakingRouter',
      address: addresses.stakingRouter.proxy.address,
      contract: await ethers.getContractAt('StakingRouter', addresses.stakingRouter.proxy.address)
    },
    AccountingOracle: {
      name: 'AccountingOracle',
      address: addresses.accountingOracle.proxy.address,
      contract: await ethers.getContractAt('AccountingOracle', addresses.accountingOracle.proxy.address)
    },
    WithdrawalQueueERC721: {
      name: 'WithdrawalQueueERC721',
      address: addresses.withdrawalQueueERC721.proxy.address,
      contract: await ethers.getContractAt('WithdrawalQueueERC721', addresses.withdrawalQueueERC721.proxy.address)
    },
    NodeOperatorsRegistry: {
      name: 'NodeOperatorsRegistry',
      address: addresses['app:node-operators-registry'].proxy.address,
      contract: await ethers.getContractAt('NodeOperatorsRegistry', addresses['app:node-operators-registry'].proxy.address)
    },
    DepositSecurityModule: {
      name: 'DepositSecurityModule',
      address: addresses.depositSecurityModule.address,
      contract: await ethers.getContractAt('DepositSecurityModule', addresses.depositSecurityModule.address)
    },
    CatalistLocator: {
      name: 'CatalistLocator',
      address: addresses.catalistLocator.proxy.address,
      contract: await ethers.getContractAt('CatalistLocator', addresses.catalistLocator.proxy.address)
    },
    ValidatorsExitBusOracle: {
      name: 'ValidatorsExitBusOracle',
      address: addresses.validatorsExitBusOracle.proxy.address,
      contract: await ethers.getContractAt('ValidatorsExitBusOracle', addresses.validatorsExitBusOracle.proxy.address)
    },
    AragonKernel: {
      name: 'AragonKernel',
      address: addresses['aragon-kernel'].proxy.address,
      contract: await ethers.getContractAt('Kernel', addresses['aragon-kernel'].proxy.address)
    },
    AragonAcl: {
      name: 'AragonAcl',
      address: addresses['aragon-acl'].proxy.address,
      contract: await ethers.getContractAt('ACL', addresses['aragon-acl'].proxy.address)
    }
  };  

  return contracts;
}

module.exports = getContracts;
