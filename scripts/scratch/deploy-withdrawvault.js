const runOrWrapScript = require('../helpers/run-or-wrap-script');
const { log, logWideSplitter, yl, gr } = require('../helpers/log');
const {
  readNetworkState,
  assertRequiredNetworkState,
  persistNetworkState,
} = require('../helpers/persisted-network-state');
const {
  deployWithoutProxy,
  deployBehindOssifiableProxy,
  updateProxyImplementation,
  deployImplementation,
  deployContract,
  getContractPath,
  TotalGasCounter,
} = require('../helpers/deploy');

const { APP_NAMES } = require('../constants');

const DEPLOYER = process.env.DEPLOYER || '';
const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || '';
const REQUIRED_NET_STATE = [
  `app:${APP_NAMES.CATALIST}`,
  `app:${APP_NAMES.ORACLE}`,
  'oracleReportSanityChecker',
  'burner',
  'hashConsensusForAccountingOracle',
  'hashConsensusForValidatorsExitBusOracle',
  'withdrawalQueueERC721',
];

async function deployNewContracts({ web3, artifacts }) {
  const netId = await web3.eth.net.getId();
  logWideSplitter();
  log(`Network ID:`, yl(netId));
  let state = readNetworkState(network.name, netId);
  assertRequiredNetworkState(state, REQUIRED_NET_STATE);
  const catalistAddress = state['app:catalist'].proxy.address;
  const legacyOracleAddress = state['app:oracle'].proxy.address;
  const chainSpec = state['chainSpec'];
  const depositSecurityModuleParams =
    state['depositSecurityModule'].deployParameters;
  const burnerParams = state['burner'].deployParameters;
  const hashConsensusForAccountingParams =
    state['hashConsensusForAccountingOracle'].deployParameters;
  const hashConsensusForExitBusParams =
    state['hashConsensusForValidatorsExitBusOracle'].deployParameters;
  const withdrawalQueueERC721Params =
    state['withdrawalQueueERC721'].deployParameters;

  if (!DEPLOYER) {
    throw new Error('Deployer is not specified');
  }

  const proxyContractsOwner = DEPLOYER;
  const admin = DEPLOYER;
  const deployer = DEPLOYER;

  const treasuryAddress = TREASURY_ADDRESS;
  //
  // === WithdrawalVault ===
  //
  const withdrawalVaultImpl = await deployImplementation(
    'withdrawalVault',
    'WithdrawalVault',
    deployer,
    [catalistAddress, treasuryAddress],
  );
  state = readNetworkState(network.name, netId);
  const withdrawalsManagerProxyConstructorArgs = [
    deployer,
    withdrawalVaultImpl.address,
  ];

  //
  // === CatalistLocator: update to valid implementation ===
  //
  const postTokenRebaseReceiver = legacyOracleAddress;
  const locatorConfig = [
    accountingOracleAddress,
    depositSecurityModuleAddress,
    elRewardsVaultAddress,
    legacyOracleAddress,
    catalistAddress,
    oracleReportSanityCheckerAddress,
    postTokenRebaseReceiver,
    burnerAddress,
    stakingRouterAddress,
    treasuryAddress,
    validatorsExitBusOracleAddress,
    withdrawalQueueERC721Address,
    withdrawalVaultAddress,
    oracleDaemonConfigAddress,
  ];
  await updateProxyImplementation(
    'catalistLocator',
    'CatalistLocator',
    locatorAddress,
    proxyContractsOwner,
    [locatorConfig],
  );

  await TotalGasCounter.incrementTotalGasUsedInStateFile();
}

module.exports = runOrWrapScript(deployNewContracts, module);
