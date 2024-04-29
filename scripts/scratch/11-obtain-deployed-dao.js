const path = require('path')
const chalk = require('chalk')
const { hash: namehash } = require('eth-ens-namehash')
const { toChecksumAddress } = require('web3-utils')
const { getEventArgument, getEvents, ZERO_ADDRESS } = require('@aragon/contract-helpers-test')

const runOrWrapScript = require('../helpers/run-or-wrap-script')
const { log } = require('../helpers/log')
const { assertLastEvent } = require('../helpers/events')
const { getContractPath } = require('../helpers/deploy')
const { readNetworkState, persistNetworkState, assertRequiredNetworkState } = require('../helpers/persisted-network-state')

const { assertInstalledApps } = require('./checks/apps')
const { APP_NAMES } = require('../constants')

const REQUIRED_NET_STATE = [
  'catalistApmEnsName',
  'catalistTemplate',
  `app:${APP_NAMES.CATALIST}`,
  `app:${APP_NAMES.ORACLE}`,
  `app:${APP_NAMES.NODE_OPERATORS_REGISTRY}`
]

const VALID_APP_NAMES = Object.entries(APP_NAMES).map((e) => e[1])
const AGENT_VESTING_PLACEHOLDER = 'catalist-aragon-agent-placeholder'

// See KernelConstants.sol
const KERNEL_DEFAULT_ACL_APP_ID = '0xe3262375f45a6e2026b7e7b18c2b807434f2508fe1a2a3dfb493c7df8f4aad6a'

async function obtainDeployedAPM({ web3, artifacts }) {
  const netId = await web3.eth.net.getId()

  log.wideSplitter()
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
  const daoDeployedEvt = await assertLastEvent(template, 'TmplDAOAndTokenDeployed', null, state.catalistTemplate.deployBlock)

  const catalistApmEnsName = state.catalistApmEnsName
  const appIdNameEntries = VALID_APP_NAMES.map((name) => [namehash(`${name}.${catalistApmEnsName}`), name])
  const appNameByAppId = Object.fromEntries(appIdNameEntries)

  const fromBlock = state.catalistTemplate.deployBlock
  const appInstalledEvents = (await template.getPastEvents('TmplAppInstalled', { fromBlock })).map((evt) => evt.args)
  for (const evt of appInstalledEvents) {
    const appName = appNameByAppId[evt.appId]
    const proxyAddress = toChecksumAddress(evt.appProxy)
    console.log(`${appName}: ${proxyAddress} ${evt.appId} ${evt.initializeData}`)
  }

  state.newDaoTx = daoDeployedEvt.transactionHash
  log(`Using newDao transaction: ${chalk.yellow(state.newDaoTx)}`)
  persistNetworkState(network.name, netId, state)


  log.splitter()

  log(`Using Kernel: ${chalk.yellow(daoDeployedEvt.args.dao)}`)
  const kernelProxyAddress = daoDeployedEvt.args.dao
  const dao = await artifacts.require('Kernel').at(kernelProxyAddress)

  log.splitter()

  state['aragon-kernel'] = {
    ...state['aragon-kernel'],
    proxy: {
      address: kernelProxyAddress,
      contract: await getContractPath('KernelProxy'),
      constructorArgs: [ // see DAOFactory.newDAO
        state['aragon-kernel'].implementation.address,
      ],
    },
  }

  const evmScriptRegistryFactory = await artifacts.require('EVMScriptRegistryFactory').at(state.evmScriptRegistryFactory.address)
  state.callsScript = {
    address: await evmScriptRegistryFactory.baseCallScript(),
    contract: await getContractPath('CallsScript'),
    constructorArgs: [], // see EVMScriptRegistryFactory.baseCallScript
  }

  const dataByAppName = await assertInstalledApps(
    {
      template,
      dao,
      catalistApmEnsName: state.catalistApmEnsName,
      appProxyUpgradeableArtifactName: 'external:AppProxyUpgradeable_DAO'
    },
    state.catalistTemplate.deployBlock
  )

  for (const [appName, appData] of Object.entries(dataByAppName)) {
    const key = `app:${appName}`
    const proxyAddress = appData.proxyAddress
    const initializeData = appData.initializeData
    delete appData.proxyAddress
    delete appData.initializeData
    state[key] = {
      ...state[key],
      aragonApp: appData,
      proxy: {
        address: proxyAddress,
        contract: await getContractPath('AppProxyUpgradeable'),
        constructorArgs: [  // see AppProxyFactory
          kernelProxyAddress,
          appData.id,
          initializeData,
        ],
      }
    }
  }
  log.splitter()
  persistNetworkState(network.name, netId, state)

  const newDaoReceipt = await web3.eth.getTransactionReceipt(state.catalistTemplateNewDaoTx)
  const { abi: DAOFactoryABI } = await artifacts.readArtifact('DAOFactory')
  const evmScriptRegistryEvents = getEvents(newDaoReceipt, 'DeployEVMScriptRegistry', { decodeForAbi: DAOFactoryABI })
  const evmScriptRegistryAddress = evmScriptRegistryEvents[0].args.reg


  // Get missing proxies
  const { abi: KernelABI } = await artifacts.readArtifact('Kernel')
  const newAppProxyEvents = getEvents(newDaoReceipt, 'NewAppProxy', { decodeForAbi: KernelABI })
  for (const e of newAppProxyEvents) {
    const appId = e.args.appId
    if (appNameByAppId[appId] !== undefined) continue

    let proxyContract, appName

    if (appId == KERNEL_DEFAULT_ACL_APP_ID) {
      proxyContract = 'AppProxyUpgradeable'
      appName = 'aragon-acl'
    } else {  // otherwise it is EvmScriptRegistry
      proxyContract = 'AppProxyPinned'
      appName = 'aragon-evm-script-registry'
    }

    const proxy = await artifacts.require(proxyContract).at(e.args.proxy)

    state[appName] = {
      ...state[appName],
      proxy: {
        address: proxy.address,
        constructorArgs: [ // See Kernel.initialize
          kernelProxyAddress,
          appId,
          '0x00',
        ],
        contract: await getContractPath(proxyContract),
      },
      aragonApp: {
        name: appName,
        id: appId,
      }
    }
    if (appName === 'aragon-evm-script-registry') {
      state[appName].implementation = {
        address: await proxy.implementation(),
        contract: await getContractPath('EVMScriptRegistry'),
        constructorArgs: [], // see DAOFactory.newDAO and EVMScriptRegistryFactory.baseReg
      }
    }
  }
  persistNetworkState(network.name, netId, state)
}

module.exports = runOrWrapScript(obtainDeployedAPM, module)
