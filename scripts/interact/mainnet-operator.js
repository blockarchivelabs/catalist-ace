const { ethers } = require('hardhat');
const fs = require('fs');
const getContracts = require('./loader');

// RPC_URL=http://20.197.13.207:8545 npx hardhat run scripts/interact/mainnet-operator.js --network ace_mainnet
async function main() {
  const loader = await getContracts();

  const GAS_INFO = {
    gasLimit: 1000000,
    gasPrice: 100000,
  }
  
  //const deployerAddress = '0x9773b10cf67ad8070c21aa93549fe9af0751b698';
  // reward address = '0xef326a73277a333851c2e6fbce909f14944740b4';
  const changeAddress = '0xef326a73277a333851c2e6fbce909f14944740b4';



  // console.log();
  // console.log('Add node operator...');
  // // 오퍼레이터 이름
  // const OPERATOR_NAME = 'test-operator'
  // //오퍼레이터 보상 수령 주소
  // const REWARD_ADDRESS = deployerAddress
  // await loader.NodeOperatorsRegistry.contract.addNodeOperator(
  //   OPERATOR_NAME,
  //   REWARD_ADDRESS,
  //   GAS_INFO
  // );

  // console.log();
  // console.log('setNodeOperatorStakingLimit()...');
  // const stakingLimit = 1000000000;
  // await loader.NodeOperatorsRegistry.contract.setNodeOperatorStakingLimit(
  //   OPERATOR_ID,
  //   stakingLimit,
  //   GAS_INFO
  // );

  // console.log();
  // console.log('Get node operators count...');
  // const operatorsCount = await loader.NodeOperatorsRegistry.contract.getNodeOperatorsCount({
  //   gasLimit: 1000000,
  //   gasPrice: 100000,
  // });
  // console.log('- operators count:', +operatorsCount);

   console.log();
   console.log('Set node operator reward address...');
   const operatorId = 0
   await loader.NodeOperatorsRegistry.contract.setNodeOperatorRewardAddress(
     operatorId,
     changeAddress,
     GAS_INFO
   )
/*
  console.log()
  console.log('Get node operator info...')
  const OPERATOR_ID = 0
  */
  // const nodeOperatorInfo = await loader.NodeOperatorsRegistry.contract.getNodeOperator(
  //   OPERATOR_ID,
  //   true,
  //   GAS_INFO
  // )
  // console.log('- Node Operator:', nodeOperatorInfo)
/*
  const isOperatorPenalized = await nodeOperatorRegistry.isOperatorPenalized(
    OPERATOR_ID,
    GAS_INFO
  )
  console.log('- Is Operator Penalized:', isOperatorPenalized)

  console.log()*/
  console.log('Complete.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
