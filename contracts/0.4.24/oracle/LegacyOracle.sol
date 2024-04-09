// SPDX-FileCopyrightText: 2023 Lido <info@lido.fi>
// SPDX-License-Identifier: GPL-3.0

/* See contracts/COMPILERS.md */
pragma solidity 0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";

import "../../common/interfaces/ICatalistLocator.sol";

import "../utils/Versioned.sol";

interface IAccountingOracle {
    function getConsensusContract() external view returns (address);
}

interface IHashConsensus {
    function getChainConfig()
        external
        view
        returns (
            uint256 slotsPerEpoch,
            uint256 secondsPerSlot,
            uint256 genesisTime
        );

    function getFrameConfig()
        external
        view
        returns (uint256 initialEpoch, uint256 epochsPerFrame);

    function getCurrentFrame()
        external
        view
        returns (uint256 refSlot, uint256 reportProcessingDeadlineSlot);
}

/**
 * @title DEPRECATED legacy oracle contract stub kept for compatibility purposes only.
 * Should not be used in new code.
 *
 * Previously, the oracle contract was located at this address. Currently, the oracle lives
 * at a different address, and this contract is kept for the compatibility, supporting a
 * limited subset of view functions and events.
 *
 * See docs.catalist.fi for more info.
 */
contract LegacyOracle is Versioned {
    struct ChainSpec {
        uint64 epochsPerFrame;
        uint64 slotsPerEpoch;
        uint64 secondsPerSlot;
        uint64 genesisTime;
    }

    /// @notice DEPRECATED, kept for compatibility purposes only. The new Rebase event emitted
    /// from the main Catalist contract should be used instead.
    ///
    /// This event is still emitted after oracle committee reaches consensus on a report, but
    /// only for compatibility purposes. The values in this event are not enough to calculate
    /// APR or TVL anymore due to withdrawals, execution layer rewards, and consensus layer
    /// rewards skimming.
    event Completed(
        uint256 epochId,
        uint128 beaconBalance,
        uint128 beaconValidators
    );

    /// @notice DEPRECATED, kept for compatibility purposes only. The new Rebase event emitted
    /// from the main Catalist contract should be used instead.
    ///
    /// This event is still emitted after each rebase but only for compatibility purposes.
    /// The values in this event are not enough to correctly calculate the rebase APR since
    /// a rebase can result from shares burning without changing total ACE held by the
    /// protocol.
    event PostTotalShares(
        uint256 postTotalPooledAce,
        uint256 preTotalPooledAce,
        uint256 timeElapsed,
        uint256 totalShares
    );

    /// Address of the Catalist contract
    bytes32 internal constant CATALIST_POSITION =
        keccak256("catalist.CatalistOracle.catalist");

    /// Address of the new accounting oracle contract
    bytes32 internal constant ACCOUNTING_ORACLE_POSITION =
        keccak256("catalist.CatalistOracle.accountingOracle");

    /// Storage for the Ace chain specification
    bytes32 internal constant BEACON_SPEC_POSITION =
        keccak256("catalist.CatalistOracle.beaconSpec");

    /// Version of the initialized contract data (DEPRECATED)
    bytes32 internal constant CONTRACT_VERSION_POSITION_DEPRECATED =
        keccak256("catalist.CatalistOracle.contractVersion");

    /// Historic data about 2 last completed reports and their times
    bytes32 internal constant POST_COMPLETED_TOTAL_POOLED_ACEER_POSITION =
        keccak256("catalist.CatalistOracle.postCompletedTotalPooledAce");
    bytes32 internal constant PRE_COMPLETED_TOTAL_POOLED_ACEER_POSITION =
        keccak256("catalist.CatalistOracle.preCompletedTotalPooledAce");
    bytes32 internal constant LAST_COMPLETED_EPOCH_ID_POSITION =
        keccak256("catalist.CatalistOracle.lastCompletedEpochId");
    bytes32 internal constant TIME_ELAPSED_POSITION =
        keccak256("catalist.CatalistOracle.timeElapsed");

    mapping(address => bool) private owners;
    bool private INITIALIZED = false;

    modifier onlyOwner() {
        // console.log(OWNER_ADDRESS_POSITION.getStorageAddress());
        require(owners[msg.sender], "NOT_OWNER");
        _;
    }

    function setOwner(address adr, bool status) external onlyOwner {
        owners[adr] = status;
    }

    modifier onlyInit() {
        require(!INITIALIZED, "ALREADY_INITIALIZED");
        _;
    }

    function initialized() internal onlyInit {
        INITIALIZED = true;
    }

    function hasInitialized() public view returns (bool) {
        return INITIALIZED;
    }

    /**
     * @notice Returns the Catalist contract address.
     */
    function getCatalist() public view returns (address) {
        return CATALIST_POSITION.getStorageAddress();
    }

    /**
     * @notice Returns the accounting (new) oracle contract address.
     */
    function getAccountingOracle() public view returns (address) {
        return ACCOUNTING_ORACLE_POSITION.getStorageAddress();
    }

    ///
    /// Compatibility interface (DEPRECATED)
    ///

    /**
     * @notice Returns the initialized version of this contract starting from 0.
     */
    function getVersion() external view returns (uint256) {
        return getContractVersion();
    }

    /**
     * @notice DEPRECATED, kept for compatibility purposes only.
     *
     * Returns the Ace chain specification.
     */
    function getBeaconSpec()
        external
        view
        returns (
            uint64 epochsPerFrame,
            uint64 slotsPerEpoch,
            uint64 secondsPerSlot,
            uint64 genesisTime
        )
    {
        (, uint256 epochsPerFrame_) = _getAccountingConsensusContract()
            .getFrameConfig();
        epochsPerFrame = uint64(epochsPerFrame_);

        ChainSpec memory spec = _getChainSpec();
        slotsPerEpoch = spec.slotsPerEpoch;
        secondsPerSlot = spec.secondsPerSlot;
        genesisTime = spec.genesisTime;
    }

    /**
     * @notice DEPRECATED, kept for compatibility purposes only.
     *
     * Returns the epoch calculated from current timestamp
     */
    function getCurrentEpochId() external view returns (uint256) {
        ChainSpec memory spec = _getChainSpec();
        // solhint-disable-line not-rely-on-time
        return
            (_getTime() - spec.genesisTime) /
            (spec.slotsPerEpoch * spec.secondsPerSlot);
    }

    /**
     * @notice DEPRECATED, kept for compatibility purposes only.
     *
     * Returns the first epoch of the current reporting frame as well as its start and end
     * times in seconds.
     */
    function getCurrentFrame()
        external
        view
        returns (
            uint256 frameEpochId,
            uint256 frameStartTime,
            uint256 frameEndTime
        )
    {
        return _getCurrentFrameFromAccountingOracle();
    }

    /**
     * @notice DEPRECATED, kept for compatibility purposes only.
     *
     * Returns the starting epoch of the last frame in which an oracle report was received
     * and applied.
     */
    function getLastCompletedEpochId() external view returns (uint256) {
        return LAST_COMPLETED_EPOCH_ID_POSITION.getStorageUint256();
    }

    /**
     * @notice DEPRECATED, kept for compatibility purposes only.
     *
     * The change of the protocol TVL that the last rebase resulted in. Notice that, during
     * a rebase, bACE shares can be minted to distribute protocol fees and burnt to apply
     * cover for losses incurred by slashed or unresponsive validators. A rebase might be
     * triggered without changing the protocol TVL. Thus, it's impossible to correctly
     * calculate APR from the numbers returned by this function.
     *
     * See docs.catalist.fi for the correct way of onchain and offchain APR calculation.
     */
    function getLastCompletedReportDelta()
        external
        view
        returns (
            uint256 postTotalPooledAce,
            uint256 preTotalPooledAce,
            uint256 timeElapsed
        )
    {
        postTotalPooledAce = POST_COMPLETED_TOTAL_POOLED_ACEER_POSITION
            .getStorageUint256();
        preTotalPooledAce = PRE_COMPLETED_TOTAL_POOLED_ACEER_POSITION
            .getStorageUint256();
        timeElapsed = TIME_ELAPSED_POSITION.getStorageUint256();
    }

    ///
    /// Internal interface & implementation.
    ///

    /**
     * @notice Called by Catalist on each rebase.
     */
    function handlePostTokenRebase(
        uint256 /* reportTimestamp */,
        uint256 timeElapsed,
        uint256 /* preTotalShares */,
        uint256 preTotalAce,
        uint256 postTotalShares,
        uint256 postTotalAce,
        uint256 /* totalSharesMintedAsFees */
    ) external {
        require(msg.sender == getCatalist(), "SENDER_NOT_ALLOWED");

        PRE_COMPLETED_TOTAL_POOLED_ACEER_POSITION.setStorageUint256(
            preTotalAce
        );
        POST_COMPLETED_TOTAL_POOLED_ACEER_POSITION.setStorageUint256(
            postTotalAce
        );
        TIME_ELAPSED_POSITION.setStorageUint256(timeElapsed);

        emit PostTotalShares(
            postTotalAce,
            preTotalAce,
            timeElapsed,
            postTotalShares
        );
    }

    /**
     * @notice Called by the new accounting oracle on each report.
     */
    function handleConsensusLayerReport(
        uint256 _refSlot,
        uint256 _clBalance,
        uint256 _clValidators
    ) external {
        require(msg.sender == getAccountingOracle(), "SENDER_NOT_ALLOWED");

        // new accounting oracle's ref. slot is the last slot of the epoch preceding the one the frame starts at
        uint256 epochId = (_refSlot + 1) / _getChainSpec().slotsPerEpoch;
        LAST_COMPLETED_EPOCH_ID_POSITION.setStorageUint256(epochId);

        emit Completed(epochId, uint128(_clBalance), uint128(_clValidators));
    }

    /**
     * @notice Initializes the contract (the compat-only deprecated version 4) from scratch.
     * @param _catalistLocator Address of the Catalist Locator contract.
     * @param _accountingOracleConsensusContract Address of consensus contract of the new accounting oracle contract.
     */
    function initialize(
        address _catalistLocator,
        address _accountingOracleConsensusContract
    ) external onlyInit {
        // Initializations for v0 --> v3
        _checkContractVersion(0);
        // deprecated version slot must be empty
        require(
            CONTRACT_VERSION_POSITION_DEPRECATED.getStorageUint256() == 0,
            "WRONG_BASE_VERSION"
        );
        require(_catalistLocator != address(0), "ZERO_LOCATOR_ADDRESS");
        ICatalistLocator locator = ICatalistLocator(_catalistLocator);

        CATALIST_POSITION.setStorageAddress(locator.catalist());

        // Initializations for v3 --> v4
        _initialize_v4(locator.accountingOracle());

        // Cannot get consensus contract from new oracle because at this point new oracle is
        // not initialized with consensus contract address yet
        _setChainSpec(
            _getAccountingOracleChainSpec(_accountingOracleConsensusContract)
        );

        // Needed to finish the Aragon part of initialization (otherwise auth() modifiers will fail)
        initialized();
    }

    /**
     * @notice A function to finalize upgrade v3 -> v4 (the compat-only deprecated impl).
     * Can be called only once.
     */
    function finalizeUpgrade_v4(address _accountingOracle) external {
        // deprecated version slot must be set to v3
        require(
            CONTRACT_VERSION_POSITION_DEPRECATED.getStorageUint256() == 3,
            "WRONG_BASE_VERSION"
        );
        // current version slot must not be initialized yet
        _checkContractVersion(0);

        IHashConsensus consensus = IHashConsensus(
            IAccountingOracle(_accountingOracle).getConsensusContract()
        );

        _initialize_v4(_accountingOracle);

        ChainSpec memory spec = _getChainSpec();
        ChainSpec memory newSpec = _getAccountingOracleChainSpec(consensus);

        require(
            spec.slotsPerEpoch == newSpec.slotsPerEpoch &&
                spec.secondsPerSlot == newSpec.secondsPerSlot &&
                spec.genesisTime == newSpec.genesisTime,
            "UNEXPECTED_CHAIN_SPEC"
        );
    }

    function _initialize_v4(address _accountingOracle) internal {
        require(
            _accountingOracle != address(0),
            "ZERO_ACCOUNTING_ORACLE_ADDRESS"
        );
        ACCOUNTING_ORACLE_POSITION.setStorageAddress(_accountingOracle);
        // write current version slot
        _setContractVersion(4);
        // reset deprecated version slot
        CONTRACT_VERSION_POSITION_DEPRECATED.setStorageUint256(0);
    }

    function _getTime() internal view returns (uint256) {
        return block.timestamp; // solhint-disable-line not-rely-on-time
    }

    function _getChainSpec()
        internal
        view
        returns (ChainSpec memory chainSpec)
    {
        uint256 data = BEACON_SPEC_POSITION.getStorageUint256();
        chainSpec.epochsPerFrame = uint64(data >> 192);
        chainSpec.slotsPerEpoch = uint64(data >> 128);
        chainSpec.secondsPerSlot = uint64(data >> 64);
        chainSpec.genesisTime = uint64(data);
        return chainSpec;
    }

    function _setChainSpec(ChainSpec memory _chainSpec) internal {
        require(_chainSpec.slotsPerEpoch > 0, "BAD_SLOTS_PER_EPOCH");
        require(_chainSpec.secondsPerSlot > 0, "BAD_SECONDS_PER_SLOT");
        require(_chainSpec.genesisTime > 0, "BAD_GENESIS_TIME");
        require(_chainSpec.epochsPerFrame > 0, "BAD_EPOCHS_PER_FRAME");

        uint256 data = ((uint256(_chainSpec.epochsPerFrame) << 192) |
            (uint256(_chainSpec.slotsPerEpoch) << 128) |
            (uint256(_chainSpec.secondsPerSlot) << 64) |
            uint256(_chainSpec.genesisTime));

        BEACON_SPEC_POSITION.setStorageUint256(data);
    }

    function _getAccountingOracleChainSpec(
        address _accountingOracleConsensusContract
    ) internal view returns (ChainSpec memory spec) {
        IHashConsensus consensus = IHashConsensus(
            _accountingOracleConsensusContract
        );
        (
            uint256 slotsPerEpoch,
            uint256 secondsPerSlot,
            uint256 genesisTime
        ) = consensus.getChainConfig();
        (, uint256 epochsPerFrame_) = consensus.getFrameConfig();

        spec.epochsPerFrame = uint64(epochsPerFrame_);
        spec.slotsPerEpoch = uint64(slotsPerEpoch);
        spec.secondsPerSlot = uint64(secondsPerSlot);
        spec.genesisTime = uint64(genesisTime);
    }

    function _getCurrentFrameFromAccountingOracle()
        internal
        view
        returns (
            uint256 frameEpochId,
            uint256 frameStartTime,
            uint256 frameEndTime
        )
    {
        ChainSpec memory spec = _getChainSpec();
        IHashConsensus consensus = _getAccountingConsensusContract();
        uint256 refSlot;
        (refSlot, ) = consensus.getCurrentFrame();

        // new accounting oracle's ref. slot is the last slot of the epoch preceding the one the frame starts at
        frameStartTime = spec.genesisTime + (refSlot + 1) * spec.secondsPerSlot;
        // new accounting oracle's frame ends at the timestamp of the frame's last slot; old oracle's frame
        // ended a second before the timestamp of the first slot of the next frame
        frameEndTime =
            frameStartTime +
            spec.secondsPerSlot *
            spec.slotsPerEpoch *
            spec.epochsPerFrame -
            1;
        frameEpochId = (refSlot + 1) / spec.slotsPerEpoch;
    }

    function _getAccountingConsensusContract()
        internal
        view
        returns (IHashConsensus)
    {
        return
            IHashConsensus(
                IAccountingOracle(getAccountingOracle()).getConsensusContract()
            );
    }
}
