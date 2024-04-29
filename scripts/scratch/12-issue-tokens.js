const BN = require('bn.js')
const chalk = require('chalk')
const { makeTx, TotalGasCounter } = require('../helpers/deploy')

const runOrWrapScript = require('../helpers/run-or-wrap-script')
const { log } = require('../helpers/log')
const { assertLastEvent } = require('../helpers/events')
const { readNetworkState, assertRequiredNetworkState } = require('../helpers/persisted-network-state')

const { APP_NAMES } = require('../constants')
const VALID_APP_NAMES = Object.entries(APP_NAMES).map((e) => e[1])

const REQUIRED_NET_STATE = ['catalistTemplate', 'vestingParams']

const MAX_HOLDERS_IN_ONE_TX = 30

async function issueTokens({ web3, artifacts }) {
  const netId = await web3.eth.net.getId()

  log.splitter()
  log(`Network ID: ${chalk.yellow(netId)}`)

  const state = readNetworkState(network.name, netId)
  assertRequiredNetworkState(state, REQUIRED_NET_STATE)
  const daoTemplateAddress = state.catalistTemplate.address

  log.splitter()
  log(`Using CatalistTemplate: ${chalk.yellow(daoTemplateAddress)}`)
  const template = await artifacts.require('CatalistTemplate').at(daoTemplateAddress)
  if (state.catalistTemplate.deployBlock) {
    log(`Using CatalistTemplate deploy block: ${chalk.yellow(state.catalistTemplate.deployBlock)}`)
  }
  await assertLastEvent(template, 'TmplDAOAndTokenDeployed', null, state.catalistTemplate.deployBlock)
  log.splitter()

  const { vestingParams: vesting } = state
  const pairs = Object.entries(vesting.holders)
  const holders = pairs.map((p) => p[0])
  const amounts = pairs.map((p) => p[1])

  const totalSupply = bigSum(amounts, vesting.unvestedTokensAmount)

  log.splitter()

  const holdersInOneTx = Math.min(MAX_HOLDERS_IN_ONE_TX, holders.length)
  const totalTxes = Math.ceil(holders.length / holdersInOneTx)

  log(`Total batches:`, chalk.yellow(totalTxes))

  const endTotalSupply = new BN(0)

  for (let i = 0; i < totalTxes; ++i) {
    const startIndex = i * holdersInOneTx
    const iHolders = holders.slice(startIndex, startIndex + holdersInOneTx)
    const iAmounts = amounts.slice(startIndex, startIndex + holdersInOneTx)

    endTotalSupply.iadd(bigSum(iAmounts))

    await makeTx(template, 'issueTokens', [], { from: state.deployer })
  }

  await TotalGasCounter.incrementTotalGasUsedInStateFile()
}

function bigSum(amounts, initialAmount = 0) {
  const sum = new BN(initialAmount)
  amounts.forEach((amount) => {
    sum.iadd(new BN(amount))
  })
  return sum
}

function formatDate(unixTimestamp) {
  return new Date(unixTimestamp * 1000).toUTCString()
}

module.exports = runOrWrapScript(issueTokens, module)
