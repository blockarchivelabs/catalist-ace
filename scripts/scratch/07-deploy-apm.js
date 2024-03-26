const chalk = require('chalk')
const { assert } = require('chai')
const { hash: namehash } = require('eth-ens-namehash')
const keccak256 = require('js-sha3').keccak_256

const runOrWrapScript = require('../helpers/run-or-wrap-script')
const { log, logSplitter, logWideSplitter } = require('../helpers/log')
const { assertNoEvents } = require('../helpers/events')
const { readNetworkState, assertRequiredNetworkState, persistNetworkState } = require('../helpers/persisted-network-state')
const { getENSNodeOwner } = require('../components/ens')
const { makeTx, TotalGasCounter } = require('../helpers/deploy')

const REQUIRED_NET_STATE = [
  'deployer',
  'catalistTemplate',
  'ens',
  'catalistApmEnsName',
]

async function deployAPM({ web3, artifacts }) {
  const netId = await web3.eth.net.getId()

  logWideSplitter()
  log(`Network ID: ${chalk.yellow(netId)}`)

  const state = readNetworkState(network.name, netId)
  assertRequiredNetworkState(state, REQUIRED_NET_STATE)
  const daoTemplateAddress = state.catalistTemplate.address

  logSplitter()
  log(`APM ENS domain: ${chalk.yellow(state.catalistApmEnsName)}`)
  log(`Using DAO template: ${chalk.yellow(daoTemplateAddress)}`)

  const template = await artifacts.require('CatalistTemplate').at(daoTemplateAddress)
  if (state.catalistTemplate.deployBlock) {
    log(`Using CatalistTemplate deploy block: ${chalk.yellow(state.catalistTemplate.deployBlock)}`)
  }
  log.splitter()
  await assertNoEvents(template, null, state.catalistTemplate.deployBlock)

  const ens = await artifacts.require('ENS').at(state.ens.address)
  const catalistApmEnsNode = namehash(state.catalistApmEnsName)
  const catalistApmEnsNodeOwner = await getENSNodeOwner(ens, catalistApmEnsNode)
  const checkDesc = `ENS node is owned by the DAO template`

  assert.equal(catalistApmEnsNodeOwner, daoTemplateAddress, checkDesc)
  log.success(checkDesc)

  logSplitter()

  const domain = splitDomain(state.catalistApmEnsName)
  const parentHash = namehash(domain.parent)
  const subHash = '0x' + keccak256(domain.sub)

  log(`Parent domain: ${chalk.yellow(domain.parent)} ${parentHash}`)
  log(`Subdomain label: ${chalk.yellow(domain.sub)} ${subHash}`)

  logSplitter()

  const from = state.deployer

  const catalistApmDeployArguments = [parentHash, subHash]
  const receipt = await makeTx(template, 'deployCatalistAPM', catalistApmDeployArguments, { from })

  state.catalistApm = {
    ...state.catalistApm,
    deployArguments: catalistApmDeployArguments,
    deployTx: receipt.tx,
  }
  persistNetworkState(network.name, netId, state)

  await TotalGasCounter.incrementTotalGasUsedInStateFile()
}

function splitDomain(domain) {
  const dotIndex = domain.indexOf('.')
  if (dotIndex === -1) {
    throw new Error(`the ENS domain ${domain} is a top-level domain`)
  }
  return {
    sub: domain.substring(0, dotIndex),
    parent: domain.substring(dotIndex + 1)
  }
}

module.exports = runOrWrapScript(deployAPM, module)
