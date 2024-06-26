const { getEventArgument, ZERO_ADDRESS } = require('@aragon/contract-helpers-test')
const runOrWrapScript = require('../../helpers/run-or-wrap-script')
const { log, yl } = require('../../helpers/log')
const { hexConcat, pad, ETH, e27, e18, toBN } = require('../../../test/helpers/utils')
const { reportOracle } = require('../../../test/helpers/oracle')
const { getBalance, advanceChainTime } = require('../../../test/helpers/blockchain')
const { assertRequiredNetworkState, readStateFile } = require('../../helpers/persisted-network-state')
const { assert } = require('../../../test/helpers/assert')


const REQUIRED_NET_STATE = [
  'vestingParams',
  'daoInitialSettings',
]

const UNLIMITED = 1000000000
const CURATED_MODULE_ID = 1
const CALLDATA = '0x0'
const MAX_DEPOSITS = 150
const ADDRESS_1 = '0x0000000000000000000000000000000000000001'
const ADDRESS_2 = '0x0000000000000000000000000000000000000002'

const MANAGE_MEMBERS_AND_QUORUM_ROLE = web3.utils.keccak256('MANAGE_MEMBERS_AND_QUORUM_ROLE')

if (!process.env.HARDHAT_FORKING_URL) {
  console.error('Env variable HARDHAT_FORKING_URL must be set to run fork acceptance tests')
  process.exit(1);
}
if (!process.env.NETWORK_STATE_FILE) {
  console.error('Env variable NETWORK_STATE_FILE must be set to run fork acceptance tests')
  process.exit(1);
}
const NETWORK_STATE_FILE = process.env.NETWORK_STATE_FILE



async function loadDeployedProtocol(state) {
  return {
    stakingRouter: await artifacts.require('StakingRouter').at(state.stakingRouter.proxy.address),
    catalist: await artifacts.require('Catalist').at(state['app:catalist'].proxy.address),
    // voting: await artifacts.require('Voting').at(state['app:aragon-voting'].proxy.address),
    // agent: await artifacts.require('Agent').at(state['app:aragon-agent'].proxy.address),
    nodeOperatorsRegistry: await artifacts.require('NodeOperatorsRegistry').at(state['app:node-operators-registry'].proxy.address),
    depositSecurityModule: await artifacts.require('DepositSecurityModule').at(state.depositSecurityModule.address),
    accountingOracle: await artifacts.require('AccountingOracle').at(state.accountingOracle.proxy.address),
    hashConsensusForAO: await artifacts.require('HashConsensus').at(state.hashConsensusForAccountingOracle.address),
    elRewardsVault: await artifacts.require('CatalistExecutionLayerRewardsVault').at(state.executionLayerRewardsVault.address),
    withdrawalQueue: await artifacts.require('WithdrawalQueueERC721').at(state.withdrawalQueueERC721.proxy.address),
    // ldo: await artifacts.require('MiniMeToken').at(state.ldo.address),
  }
}


// async function checkLDOCanBeTransferred(ldo, state) {
//   const ldoHolder = Object.keys(state.vestingParams.holders)[0]
//   await ethers.provider.send('hardhat_impersonateAccount', [ldoHolder])

//   await ldo.transfer(ADDRESS_1, e18(1), { from: ldoHolder })
//   assert.equals(await ldo.balanceOf(ADDRESS_1), e18(1))

//   log.success("Transferred LDO")
// }


async function prepareProtocolForSubmitDepositReportWithdrawalFlow(protocol, state, owner, oracleMember1, oracleMember2) {
  const {
    catalist,
    // voting,
    // agent,
    nodeOperatorsRegistry,
    depositSecurityModule,
    hashConsensusForAO,
    withdrawalQueue,
  } = protocol

  // await ethers.provider.send('hardhat_impersonateAccount', [voting.address])
  // await ethers.provider.send('hardhat_impersonateAccount', [depositSecurityModule.address])
  // await ethers.provider.send('hardhat_impersonateAccount', [agent.address])

  await catalist.resume({ from: owner.address })

  await withdrawalQueue.grantRole(await withdrawalQueue.RESUME_ROLE(), owner.address, { from: owner.address })
  await withdrawalQueue.resume({ from: owner.address })
  // await withdrawalQueue.renounceRole(await withdrawalQueue.RESUME_ROLE(), agent.address, { from: agent.address })

  await nodeOperatorsRegistry.addNodeOperator('1', ADDRESS_1, { from: owner.address })
  await nodeOperatorsRegistry.addNodeOperator('2', ADDRESS_2, { from: owner.address })

  // await nodeOperatorsRegistry.addSigningKeys(0, 1, pad('0x010203', 48), pad('0x01', 96), { from: owner.address })
  // await nodeOperatorsRegistry.addSigningKeys(
  //   0,
  //   3,
  //   hexConcat(pad('0x010204', 48), pad('0x010205', 48), pad('0x010206', 48)),
  //   hexConcat(pad('0x01', 96), pad('0x01', 96), pad('0x01', 96)),
  //   { from: owner.address }
  // )

  await nodeOperatorsRegistry.setNodeOperatorStakingLimit(0, UNLIMITED, { from: owner.address })
  await nodeOperatorsRegistry.setNodeOperatorStakingLimit(1, UNLIMITED, { from: owner.address })

  const quorum = 2
  await hashConsensusForAO.grantRole(MANAGE_MEMBERS_AND_QUORUM_ROLE, owner.address, { from: owner.address })
  await hashConsensusForAO.addMember(oracleMember1.address, quorum, { from: owner.address })
  await hashConsensusForAO.addMember(oracleMember2.address, quorum, { from: owner.address })
  // await hashConsensusForAO.renounceRole(MANAGE_MEMBERS_AND_QUORUM_ROLE, owner.address, { from: owner.address })

  log.success('Protocol prepared for submit-deposit-report-withdraw flow')
}

async function checkSubmitDepositReportWithdrawal(protocol, state, owner, user1) {
  const {
    catalist,
    // agent,
    // depositSecurityModule,
    accountingOracle,
    hashConsensusForAO,
    elRewardsVault,
    withdrawalQueue,
  } = protocol


  const initialCatalistBalance = await getBalance(catalist.address)
  const chainSpec = state.chainSpec

  await owner.sendTransaction({ to: catalist.address, value: ETH(34) })
  await user1.sendTransaction({ to: elRewardsVault.address, value: ETH(1) })
  log.success('Users submitted ace')

  assert.equals(await catalist.balanceOf(owner.address), ETH(34))
  assert.equals(await catalist.getTotalPooledAce(), initialCatalistBalance + BigInt(ETH(34)))
  assert.equals(await catalist.getBufferedAce(), initialCatalistBalance + BigInt(ETH(34)))

  // await catalist.deposit(MAX_DEPOSITS, CURATED_MODULE_ID, CALLDATA, { from: depositSecurityModule.address })
  // log.success('Ace deposited')

  // assert.equals((await catalist.getBeaconStat()).depositedValidators, 1)

  const latestBlockTimestamp = (await ethers.provider.getBlock('latest')).timestamp
  const initialEpoch = Math.floor((latestBlockTimestamp - chainSpec.genesisTime)
    / (chainSpec.slotsPerEpoch * chainSpec.secondsPerSlot))

  await hashConsensusForAO.updateInitialEpoch(initialEpoch, { from: owner.address })

  const elRewardsVaultBalance = await web3.eth.getBalance(elRewardsVault.address)

  const withdrawalAmount = ETH(1)

  await catalist.approve(withdrawalQueue.address, withdrawalAmount, { from: owner.address })
  const receipt = await withdrawalQueue.requestWithdrawals([withdrawalAmount], owner.address, { from: owner.address })
  const requestId = getEventArgument(receipt, 'WithdrawalRequested', 'requestId')

  log.success('Withdrawal request made')

  const epochsPerFrame = +(await hashConsensusForAO.getFrameConfig()).epochsPerFrame
  const initialEpochTimestamp = chainSpec.genesisTime + initialEpoch * chainSpec.slotsPerEpoch * chainSpec.secondsPerSlot

  // skip two reports to be sure about REQUEST_TIMESTAMP_MARGIN
  const nextReportEpochTimestamp = initialEpochTimestamp + 2 * epochsPerFrame * chainSpec.slotsPerEpoch * chainSpec.secondsPerSlot

  const timeToWaitTillReportWindow = nextReportEpochTimestamp - latestBlockTimestamp + chainSpec.secondsPerSlot

  await advanceChainTime(timeToWaitTillReportWindow)

  let stat = await catalist.getBeaconStat()
  const clBalance = toBN(stat.depositedValidators).mul(toBN(e18(32)))


  const { refSlot } = await hashConsensusForAO.getCurrentFrame()
  const reportTimestamp = +chainSpec.genesisTime + (+refSlot) * (+chainSpec.secondsPerSlot)
  const timeElapsed = +(nextReportEpochTimestamp - initialEpochTimestamp)

  const withdrawalFinalizationBatches = [1]

  // Performing dry-run to estimate simulated share rate
  const [postTotalPooledAce, postTotalShares, withdrawals, elRewards] = await catalist.handleOracleReport.call(
    reportTimestamp,
    timeElapsed,
    stat.depositedValidators,
    clBalance,
    0 /* withdrawals vault balance */,
    elRewardsVaultBalance,
    0 /* shares requested to burn */,
    [] /* withdrawal finalization batches */,
    0 /* simulated share rate */,
    { from: accountingOracle.address }
  )

  log.success('Oracle report simulated')

  const simulatedShareRate = postTotalPooledAce.mul(toBN(e27(1))).div(postTotalShares)

  await reportOracle(hashConsensusForAO, accountingOracle, {
    refSlot,
    numValidators: stat.depositedValidators,
    clBalance,
    elRewardsVaultBalance,
    withdrawalFinalizationBatches,
    simulatedShareRate,
  })

  log.success('Oracle report submitted')

  await withdrawalQueue.claimWithdrawalsTo([requestId], [requestId], owner.address, { from: owner.address })

  log.success('Withdrawal claimed successfully')
}

async function checkMainProtocolFlows({ web3 }) {
  const netId = await web3.eth.net.getId()

  log.splitter()
  log(`Network ID: ${yl(netId)}`)

  const state = readStateFile(NETWORK_STATE_FILE)
  assertRequiredNetworkState(state, REQUIRED_NET_STATE)

  log.splitter()

  const protocol = await loadDeployedProtocol(state)
  const [owner, user1, user2, oracleMember1, oracleMember2] = await ethers.getSigners()

  
  // await checkLDOCanBeTransferred(protocol.ldo, state)

  await prepareProtocolForSubmitDepositReportWithdrawalFlow(protocol, state, owner, oracleMember1, oracleMember2)
  await checkSubmitDepositReportWithdrawal(protocol, state, owner, user1)
}


module.exports = runOrWrapScript(checkMainProtocolFlows, module)
