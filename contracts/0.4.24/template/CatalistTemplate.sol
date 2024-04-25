// SPDX-FileCopyrightText: 2020 Lido <info@lido.fi>

// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.4.24;

import "@aragon/os/contracts/factory/APMRegistryFactory.sol";
import "@aragon/os/contracts/acl/ACL.sol";
import "@aragon/os/contracts/apm/Repo.sol";
import "@aragon/os/contracts/apm/APMRegistry.sol";
import "@aragon/os/contracts/ens/ENSSubdomainRegistrar.sol";
import "@aragon/os/contracts/kernel/Kernel.sol";
import "@aragon/os/contracts/lib/ens/ENS.sol";
import "@aragon/os/contracts/lib/ens/PublicResolver.sol";
import "@aragon/os/contracts/factory/DAOFactory.sol";
import "@aragon/os/contracts/common/IsContract.sol";

import "@aragon/apps-agent/contracts/Agent.sol";
import "@aragon/apps-vault/contracts/Vault.sol";

import {Voting} from "@aragon/apps-lido/apps/voting/contracts/Voting.sol";

import "@aragon/apps-finance/contracts/Finance.sol";
import "@aragon/apps-lido/apps/token-manager/contracts/TokenManager.sol";

import "@aragon/id/contracts/IFIFSResolvingRegistrar.sol";

import "../Catalist.sol";
import "../oracle/LegacyOracle.sol";
import "../nos/NodeOperatorsRegistry.sol";
import "hardhat/console.sol";

contract CatalistTemplate is IsContract {
    // Configuration errors
    string private constant ERROR_ZERO_OWNER = "TMPL_ZERO_OWNER";
    string private constant ERROR_ENS_NOT_CONTRACT = "TMPL_ENS_NOT_CONTRACT";
    string private constant ERROR_DAO_FACTORY_NOT_CONTRACT =
        "TMPL_DAO_FAC_NOT_CONTRACT";
    string private constant ERROR_MINIME_FACTORY_NOT_CONTRACT =
        "TMPL_MINIME_FAC_NOT_CONTRACT";
    string private constant ERROR_ARAGON_ID_NOT_CONTRACT =
        "TMPL_ARAGON_ID_NOT_CONTRACT";
    string private constant ERROR_APM_REGISTRY_FACTORY_NOT_CONTRACT =
        "TMPL_APM_REGISTRY_FAC_NOT_CONTRACT";
    string private constant ERROR_EMPTY_HOLDERS = "TMPL_EMPTY_HOLDERS";
    string private constant ERROR_BAD_AMOUNTS_LEN = "TMPL_BAD_AMOUNTS_LEN";
    string private constant ERROR_INVALID_ID = "TMPL_INVALID_ID";
    string private constant ERROR_UNEXPECTED_TOTAL_SUPPLY =
        "TMPL_UNEXPECTED_TOTAL_SUPPLY";

    // Operational errors
    string private constant ERROR_PERMISSION_DENIED = "TMPL_PERMISSION_DENIED";
    string private constant ERROR_REGISTRY_ALREADY_DEPLOYED =
        "TMPL_REGISTRY_ALREADY_DEPLOYED";
    string private constant ERROR_ENS_NODE_NOT_OWNED_BY_TEMPLATE =
        "TMPL_ENS_NODE_NOT_OWNED_BY_TEMPLATE";
    string private constant ERROR_REGISTRY_NOT_DEPLOYED =
        "TMPL_REGISTRY_NOT_DEPLOYED";
    string private constant ERROR_DAO_ALREADY_DEPLOYED =
        "TMPL_DAO_ALREADY_DEPLOYED";
    string private constant ERROR_DAO_NOT_DEPLOYED = "TMPL_DAO_NOT_DEPLOYED";
    string private constant ERROR_ALREADY_FINALIZED = "TMPL_ALREADY_FINALIZED";

    // APM app names, see https://github.com/aragon/aragonOS/blob/f3ae59b/contracts/apm/APMRegistry.sol#L11
    string private constant APM_APP_NAME = "apm-registry";
    string private constant APM_REPO_APP_NAME = "apm-repo";
    string private constant APM_ENSSUB_APP_NAME = "apm-enssub";

    // Aragon app names
    string private constant ARAGON_AGENT_APP_NAME = "aragon-agent";
    string private constant ARAGON_FINANCE_APP_NAME = "aragon-finance";
    string private constant ARAGON_TOKEN_MANAGER_APP_NAME =
        "aragon-token-manager";
    string private constant ARAGON_VOTING_APP_NAME = "aragon-voting";

    // Catalist app names
    string private constant CATALIST_APP_NAME = "catalist";
    string private constant ORACLE_APP_NAME = "oracle";
    string private constant NODE_OPERATORS_REGISTRY_APP_NAME =
        "node-operators-registry";

    // DAO config constants
    bool private constant TOKEN_TRANSFERABLE = true;
    uint8 private constant TOKEN_DECIMALS = uint8(18);
    uint64 private constant DEFAULT_FINANCE_PERIOD = uint64(30 days);
    uint256 private constant TOKEN_MAX_PER_ACCOUNT = 0;

    struct APMRepos {
        Repo catalist;
        Repo oracle;
        Repo nodeOperatorsRegistry;
    }

    struct DeployState {
        bytes32 catalistRegistryEnsNode;
        APMRegistry catalistRegistry;
        Kernel dao;
        ACL acl;
        Catalist catalist;
        LegacyOracle oracle;
        NodeOperatorsRegistry operators;
        address stakingRouter;
    }

    struct AppVersion {
        address contractAddress;
        bytes contentURI;
    }

    address private owner;
    ENS private ens;
    DAOFactory private daoFactory;
    IFIFSResolvingRegistrar private aragonID;
    APMRegistryFactory private apmRegistryFactory;

    DeployState private deployState;
    APMRepos private apmRepos;

    event TmplAPMDeployed(address apm);
    event TmplReposCreated();
    event TmplAppInstalled(
        address appProxy,
        bytes32 appId,
        bytes initializeData
    );
    event TmplDAOAndTokenDeployed(address dao);
    event TmplTokensIssued(uint256 totalAmount);
    event TmplDaoFinalized();

    modifier onlyOwner() {
        require(msg.sender == owner, ERROR_PERMISSION_DENIED);
        _;
    }

    function setOwner(address _newOwner) external onlyOwner {
        owner = _newOwner;
    }

    function changeOwner(address _newOwner) external onlyOwner {
        owner = _newOwner;
    }

    constructor(
        address _owner,
        DAOFactory _daoFactory,
        ENS _ens,
        IFIFSResolvingRegistrar _aragonID,
        APMRegistryFactory _apmRegistryFactory
    ) public {
        require(_owner != address(0), ERROR_ZERO_OWNER);
        require(
            isContract(address(_daoFactory)),
            ERROR_DAO_FACTORY_NOT_CONTRACT
        );
        require(isContract(address(_ens)), ERROR_ENS_NOT_CONTRACT);
        require(isContract(address(_aragonID)), ERROR_ARAGON_ID_NOT_CONTRACT);
        require(
            isContract(address(_apmRegistryFactory)),
            ERROR_APM_REGISTRY_FACTORY_NOT_CONTRACT
        );

        owner = _owner;
        daoFactory = _daoFactory;
        ens = _ens;
        aragonID = _aragonID;
        apmRegistryFactory = _apmRegistryFactory;
    }

    function getConfig()
        external
        view
        returns (
            address _owner,
            address _daoFactory,
            address _ens,
            address _aragonID,
            address _apmRegistryFactory
        )
    {
        return (owner, daoFactory, ens, aragonID, apmRegistryFactory);
    }

    function deployCatalistAPM(
        bytes32 _tld,
        bytes32 _label
    ) external onlyOwner {
        require(
            deployState.catalistRegistry == address(0),
            ERROR_REGISTRY_ALREADY_DEPLOYED
        );

        bytes32 node = keccak256(abi.encodePacked(_tld, _label));
        require(
            ens.owner(node) == address(this),
            ERROR_ENS_NODE_NOT_OWNED_BY_TEMPLATE
        );
        deployState.catalistRegistryEnsNode = node;

        APMRegistryFactory factory = apmRegistryFactory;

        // transfer ENS node ownership to the APM factory, which will
        // subsequently transfer it to the subdomain registrar
        ens.setOwner(node, factory);

        // make the template a (temporary) manager of the APM registry
        APMRegistry registry = factory.newAPM(_tld, _label, address(this));

        // APMRegistryFactory doesn't revoke its permission to create repos
        ACL(registry.kernel().acl()).revokePermission(
            factory,
            registry,
            registry.CREATE_REPO_ROLE()
        );

        deployState.catalistRegistry = registry;

        emit TmplAPMDeployed(address(registry));
    }

    /**
     * @dev An escape hatch function to reclaim the domain if APM fails to deploy.
     */
    function cancelAndTransferDomain(
        bytes32 node,
        address _to
    ) external onlyOwner {
        require(
            ens.owner(node) == address(this),
            ERROR_ENS_NODE_NOT_OWNED_BY_TEMPLATE
        );
        ens.setOwner(node, _to);
    }

    function createRepos(
        uint16[3] _initialSemanticVersion,
        address _catalistImplAddress,
        bytes _catalistContentURI,
        address _nodeOperatorsRegistryImplAddress,
        bytes _nodeOperatorsRegistryContentURI,
        address _oracleImplAddress,
        bytes _oracleContentURI
    ) external onlyOwner {
        require(
            deployState.catalistRegistry != address(0),
            ERROR_REGISTRY_NOT_DEPLOYED
        );

        APMRegistry catalistRegistry = deployState.catalistRegistry;

        // create Catalist app repos

        apmRepos.catalist = catalistRegistry.newRepoWithVersion(
            CATALIST_APP_NAME,
            this,
            _initialSemanticVersion,
            _catalistImplAddress,
            _catalistContentURI
        );

        apmRepos.nodeOperatorsRegistry = catalistRegistry.newRepoWithVersion(
            NODE_OPERATORS_REGISTRY_APP_NAME,
            this,
            _initialSemanticVersion,
            _nodeOperatorsRegistryImplAddress,
            _nodeOperatorsRegistryContentURI
        );

        apmRepos.oracle = catalistRegistry.newRepoWithVersion(
            ORACLE_APP_NAME,
            this,
            _initialSemanticVersion,
            _oracleImplAddress,
            _oracleContentURI
        );

        emit TmplReposCreated();
    }

    function newDAO() external onlyOwner {
        DeployState memory state = deployState;

        require(
            state.catalistRegistry != address(0),
            ERROR_REGISTRY_NOT_DEPLOYED
        );
        require(state.dao == address(0), ERROR_DAO_ALREADY_DEPLOYED);

        (state.dao, state.acl) = _createDAO();

        bytes memory noInit = new bytes(0);

        state.catalist = Catalist(
            _installNonDefaultApp(
                state.dao,
                _getAppId(CATALIST_APP_NAME, state.catalistRegistryEnsNode),
                noInit
            )
        );

        state.operators = NodeOperatorsRegistry(
            _installNonDefaultApp(
                state.dao,
                _getAppId(
                    NODE_OPERATORS_REGISTRY_APP_NAME,
                    state.catalistRegistryEnsNode
                ),
                noInit
            )
        );

        state.oracle = LegacyOracle(
            _installNonDefaultApp(
                state.dao,
                _getAppId(ORACLE_APP_NAME, state.catalistRegistryEnsNode),
                noInit
            )
        );

        emit TmplDAOAndTokenDeployed(address(state.dao));

        deployState = state;
    }

    function issueTokens() external onlyOwner {
        emit TmplTokensIssued(0);
    }

    function finalizeDAO(
        string _daoName,
        address _stakingRouter
    ) external onlyOwner {
        require(_stakingRouter != address(0));
        DeployState memory state = deployState;
        APMRepos memory repos = apmRepos;

        require(state.dao != address(0), ERROR_DAO_NOT_DEPLOYED);
        require(bytes(_daoName).length > 0, ERROR_INVALID_ID);

        state.stakingRouter = _stakingRouter;

        _setupPermissions(state, repos);
        _transferRootPermissionsFromTemplateAndFinalizeDAO(
            state.dao,
            msg.sender
        );
        _resetState();

        aragonID.register(keccak256(abi.encodePacked(_daoName)), state.dao);

        emit TmplDaoFinalized();
    }

    /* DAO AND APPS */

    /**
     * @dev Create a DAO using the DAO Factory and grant the template root permissions so it has full
     *      control during setup. Once the DAO setup has finished, it is recommended to call the
     *      `_transferRootPermissionsFromTemplateAndFinalizeDAO()` helper to transfer the root
     *      permissions to the end entity in control of the organization.
     */
    function _createDAO() private returns (Kernel dao, ACL acl) {
        dao = daoFactory.newDAO(this);
        acl = ACL(dao.acl());
        _createPermissionForTemplate(acl, dao, dao.APP_MANAGER_ROLE());
    }

    function _installAgentApp(
        bytes32 _catalistRegistryEnsNode,
        Kernel _dao
    ) private returns (Agent) {
        bytes32 appId = _getAppId(
            ARAGON_AGENT_APP_NAME,
            _catalistRegistryEnsNode
        );
        bytes memory initializeData = abi.encodeWithSelector(
            Agent(0).initialize.selector
        );
        Agent agent = Agent(_installApp(_dao, appId, initializeData, true));
        _dao.setRecoveryVaultAppId(appId);
        return agent;
    }

    function _installNonDefaultApp(
        Kernel _dao,
        bytes32 _appId,
        bytes memory _initializeData
    ) internal returns (address) {
        return _installApp(_dao, _appId, _initializeData, false);
    }

    function _installApp(
        Kernel _dao,
        bytes32 _appId,
        bytes memory _initializeData,
        bool _setDefault
    ) internal returns (address) {
        address latestBaseAppAddress = _apmResolveLatest(_appId)
            .contractAddress;
        address instance = address(
            _dao.newAppInstance(
                _appId,
                latestBaseAppAddress,
                _initializeData,
                _setDefault
            )
        );
        emit TmplAppInstalled(instance, _appId, _initializeData);
        return instance;
    }

    /* PERMISSIONS */

    function _setupPermissions(
        DeployState memory _state,
        APMRepos memory _repos
    ) private {
        ACL acl = _state.acl;

        // APM

        Kernel apmDAO = Kernel(_state.catalistRegistry.kernel());
        ACL apmACL = ACL(apmDAO.acl());
        bytes32 REPO_CREATE_VERSION_ROLE = _repos
            .catalist
            .CREATE_VERSION_ROLE();
        ENSSubdomainRegistrar apmRegistrar = _state
            .catalistRegistry
            .registrar();

        _transferPermissionFromTemplate(
            apmACL,
            _state.catalistRegistry,
            msg.sender,
            _state.catalistRegistry.CREATE_REPO_ROLE()
        );
        apmACL.setPermissionManager(
            msg.sender,
            apmDAO,
            apmDAO.APP_MANAGER_ROLE()
        );
        _transferPermissionFromTemplate(
            apmACL,
            apmACL,
            msg.sender,
            apmACL.CREATE_PERMISSIONS_ROLE()
        );
        apmACL.setPermissionManager(
            msg.sender,
            apmRegistrar,
            apmRegistrar.CREATE_NAME_ROLE()
        );
        apmACL.setPermissionManager(
            msg.sender,
            apmRegistrar,
            apmRegistrar.POINT_ROOTNODE_ROLE()
        );

        // APM repos

        // using loops to save contract size
        Repo[6] memory repoAddresses;
        repoAddresses[0] = _repos.catalist;
        repoAddresses[1] = _repos.oracle;
        repoAddresses[2] = _repos.nodeOperatorsRegistry;
        repoAddresses[3] = _resolveRepo(
            _getAppId(APM_APP_NAME, _state.catalistRegistryEnsNode)
        );
        repoAddresses[4] = _resolveRepo(
            _getAppId(APM_REPO_APP_NAME, _state.catalistRegistryEnsNode)
        );
        repoAddresses[5] = _resolveRepo(
            _getAppId(APM_ENSSUB_APP_NAME, _state.catalistRegistryEnsNode)
        );
        for (uint256 i = 0; i < repoAddresses.length; ++i) {
            _transferPermissionFromTemplate(
                apmACL,
                repoAddresses[i],
                msg.sender,
                REPO_CREATE_VERSION_ROLE
            );
        }

        // using loops to save contract size
        bytes32[6] memory perms;

        // NodeOperatorsRegistry
        perms[0] = _state.operators.MANAGE_SIGNING_KEYS();
        perms[1] = _state.operators.SET_NODE_OPERATOR_LIMIT_ROLE();
        for (i = 0; i < 2; ++i) {
            _createPermission(acl, _state.operators, perms[i], msg.sender);
        }
        acl.createPermission(
            _state.stakingRouter,
            _state.operators,
            _state.operators.STAKING_ROUTER_ROLE(),
            msg.sender
        );
        acl.createPermission(
            msg.sender,
            _state.operators,
            _state.operators.MANAGE_NODE_OPERATOR_ROLE(),
            msg.sender
        );

        // Catalist
        perms[0] = _state.catalist.PAUSE_ROLE();
        perms[1] = _state.catalist.RESUME_ROLE();
        perms[2] = _state.catalist.STAKING_PAUSE_ROLE();
        perms[3] = _state.catalist.STAKING_CONTROL_ROLE();
        perms[4] = _state.catalist.UNSAFE_CHANGE_DEPOSITED_VALIDATORS_ROLE();
        for (i = 0; i < 5; ++i) {
            _createPermission(acl, _state.catalist, perms[i], msg.sender);
        }
    }

    function _createTokenManagerPermissionsForTemplate(
        ACL _acl,
        TokenManager _tokenManager
    ) internal {
        _createPermissionForTemplate(
            _acl,
            _tokenManager,
            _tokenManager.ISSUE_ROLE()
        );
        _createPermissionForTemplate(
            _acl,
            _tokenManager,
            _tokenManager.ASSIGN_ROLE()
        );
    }

    function _createPermission(
        ACL _acl,
        address _app,
        bytes32 perm,
        address entity
    ) internal {
        _acl.createPermission(entity, _app, perm, entity);
    }

    function _createPermissionForTemplate(
        ACL _acl,
        address _app,
        bytes32 _permission
    ) private {
        _acl.createPermission(address(this), _app, _permission, address(this));
    }

    function _removePermissionFromTemplate(
        ACL _acl,
        address _app,
        bytes32 _permission
    ) private {
        _acl.revokePermission(address(this), _app, _permission);
        _acl.removePermissionManager(_app, _permission);
    }

    function _transferRootPermissionsFromTemplateAndFinalizeDAO(
        Kernel _dao,
        address entity
    ) private {
        ACL _acl = ACL(_dao.acl());
        _transferPermissionFromTemplate(
            _acl,
            _dao,
            entity,
            _dao.APP_MANAGER_ROLE(),
            entity
        );
        _transferPermissionFromTemplate(
            _acl,
            _acl,
            entity,
            _acl.CREATE_PERMISSIONS_ROLE(),
            entity
        );
        console.log("Transfering permissions");
    }

    function _transferPermissionFromTemplate(
        ACL _acl,
        address _app,
        address _to,
        bytes32 _permission
    ) private {
        _transferPermissionFromTemplate(_acl, _app, _to, _permission, _to);
    }

    function _transferPermissionFromTemplate(
        ACL _acl,
        address _app,
        address _to,
        bytes32 _permission,
        address _manager
    ) private {
        _acl.grantPermission(_to, _app, _permission);
        _acl.revokePermission(address(this), _app, _permission);
        _acl.setPermissionManager(_manager, _app, _permission);
    }

    /* APM and ENS */

    function _apmResolveLatest(
        bytes32 _appId
    ) private view returns (AppVersion memory) {
        Repo repo = _resolveRepo(_appId);
        (, address contractAddress, bytes memory contentURI) = repo.getLatest();
        return AppVersion(contractAddress, contentURI);
    }

    function _resolveRepo(bytes32 _appId) private view returns (Repo) {
        address resolverAddress = ens.resolver(_appId);
        require(resolverAddress != address(0x0), "ZERO_RESOLVER_ADDRESS");
        return Repo(PublicResolver(resolverAddress).addr(_appId));
    }

    /**
     * @return the app ID: ENS node with name `_appName` and parent node `_apmRootNode`.
     */
    function _getAppId(
        string _appName,
        bytes32 _apmRootNode
    ) private pure returns (bytes32 subnode) {
        return
            keccak256(
                abi.encodePacked(
                    _apmRootNode,
                    keccak256(abi.encodePacked(_appName))
                )
            );
    }

    /* STATE RESET */

    function _resetState() private {
        delete deployState.catalistRegistryEnsNode;
        delete deployState.catalistRegistry;
        delete deployState.dao;
        delete deployState.acl;
        delete deployState.catalist;
        delete deployState.operators;
        delete deployState;
        delete apmRepos.catalist;
        delete apmRepos.oracle;
        delete apmRepos.nodeOperatorsRegistry;
        delete apmRepos;
    }
}
