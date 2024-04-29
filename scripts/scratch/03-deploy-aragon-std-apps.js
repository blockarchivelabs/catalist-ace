const runOrWrapScript = require('../helpers/run-or-wrap-script')
const { readNetworkState, assertRequiredNetworkState } = require('../helpers/persisted-network-state')
const { deployImplementation, TotalGasCounter } = require('../helpers/deploy')

const REQUIRED_NET_STATE = [
  'deployer',
]

async function deployAragonStdApps({ web3, artifacts, }) {
  const netId = await web3.eth.net.getId()
  const state = readNetworkState(network.name, netId)
  assertRequiredNetworkState(state, REQUIRED_NET_STATE)

  const deployer = state.deployer

  await TotalGasCounter.incrementTotalGasUsedInStateFile()
}


module.exports = runOrWrapScript(deployAragonStdApps, module)
