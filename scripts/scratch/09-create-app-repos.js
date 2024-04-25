const chalk = require('chalk')
const { assert } = require('chai')

const runOrWrapScript = require('../helpers/run-or-wrap-script')
const { log, logSplitter, logWideSplitter } = require('../helpers/log')
const { assertLastEvent } = require('../helpers/events')
const { readNetworkState, assertRequiredNetworkState, persistNetworkState } = require('../helpers/persisted-network-state')
const { makeTx, TotalGasCounter } = require('../helpers/deploy')

const { APP_NAMES } = require('../constants')

const NULL_CONTENT_URI = "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"


const REQUIRED_NET_STATE = [
  'deployer',
  'catalistTemplate',
  `app:${APP_NAMES.CATALIST}`,
  `app:${APP_NAMES.ORACLE}`,
  `app:${APP_NAMES.NODE_OPERATORS_REGISTRY}`,
]

async function createAppRepos({ web3, artifacts }) {
  const netId = await web3.eth.net.getId()

  logWideSplitter()
  log(`Network ID: ${chalk.yellow(netId)}`)

  const state = readNetworkState(network.name, netId)
  assertRequiredNetworkState(state, REQUIRED_NET_STATE)
  const daoTemplateAddress = state.catalistTemplate.address

  logSplitter()
  log(`Using CatalistTemplate: ${chalk.yellow(daoTemplateAddress)}`)
  const template = await artifacts.require('CatalistTemplate').at(daoTemplateAddress)
  if (state.catalistTemplate.deployBlock) {
    log(`Using CatalistTemplate deploy block: ${chalk.yellow(state.catalistTemplate.deployBlock)}`)
  }

  await assertLastEvent(template, 'TmplAPMDeployed', null, state.catalistTemplate.deployBlock)
  logSplitter()

  const catalistAppState = state[`app:${APP_NAMES.CATALIST}`]
  const oracleAppState = state[`app:${APP_NAMES.ORACLE}`]
  const nodeOperatorsAppState = state[`app:${APP_NAMES.NODE_OPERATORS_REGISTRY}`]

  const createReposArguments = [
    [1, 0, 0],
    // Catalist app
    catalistAppState.implementation.address,
    NULL_CONTENT_URI,
    // NodeOperatorsRegistry app
    nodeOperatorsAppState.implementation.address,
    NULL_CONTENT_URI,
    // LegacyOracle app
    oracleAppState.implementation.address,
    NULL_CONTENT_URI,
  ]
  const from = state.deployer

  console.log({arguments, from})

  const catalistAppsReceipt = await makeTx(template, 'createRepos', createReposArguments, { from })
  console.log(`=== Aragon Catalist Apps Repos (Catalist, AccountingOracle, NodeOperatorsRegistry deployed: ${catalistAppsReceipt.tx} ===`)

  logSplitter()
  persistNetworkState(network.name, netId, state)

  await TotalGasCounter.incrementTotalGasUsedInStateFile()
}

module.exports = runOrWrapScript(createAppRepos, module)
