// SPDX-FileCopyrightText: 2023 Catalist <info@catalist.fi>
// SPDX-License-Identifier: GPL-3.0

/* See contracts/COMPILERS.md */
pragma solidity 0.8.9;

import { WithdrawalQueueBase } from "./WithdrawalQueueBase.sol";

import { IERC20 } from "@openzeppelin/contracts-v4.4/token/ERC20/IERC20.sol";
import { IERC20Permit } from "@openzeppelin/contracts-v4.4/token/ERC20/extensions/draft-IERC20Permit.sol";
import { EnumerableSet } from "@openzeppelin/contracts-v4.4/utils/structs/EnumerableSet.sol";
import { AccessControlEnumerable } from "./utils/access/AccessControlEnumerable.sol";
import { UnstructuredStorage } from "./lib/UnstructuredStorage.sol";
import { PausableUntil } from "./utils/PausableUntil.sol";

import { Versioned } from "./utils/Versioned.sol";

/// @notice Interface defining a Catalist liquid staking pool
/// @dev see also [Catalist liquid staking pool core contract](https://docs.catalist.fi/contracts/catalist)
interface IStACE is IERC20, IERC20Permit {
    function getSharesByPooledAce(
        uint256 _pooledAceAmount
    ) external view returns (uint256);
}

/// @notice Interface defining a Catalist liquid staking pool wrapper
/// @dev see WstACE.sol for full docs
interface IWstACE is IERC20, IERC20Permit {
    function unwrap(uint256 _wstACEAmount) external returns (uint256);
    function getStACEByWstACE(
        uint256 _wstACEAmount
    ) external view returns (uint256);
    function stACE() external view returns (IStACE);
}

/// @title A contract for handling stACE withdrawal request queue within the Catalist protocol
/// @author folkyatina
abstract contract WithdrawalQueue is
    AccessControlEnumerable,
    PausableUntil,
    WithdrawalQueueBase,
    Versioned
{
    using UnstructuredStorage for bytes32;
    using EnumerableSet for EnumerableSet.UintSet;

    /// Bunker mode activation timestamp
    bytes32 internal constant BUNKER_MODE_SINCE_TIMESTAMP_POSITION =
        keccak256("catalist.WithdrawalQueue.bunkerModeSinceTimestamp");

    /// Special value for timestamp when bunker mode is inactive (i.e., protocol in turbo mode)
    uint256 public constant BUNKER_MODE_DISABLED_TIMESTAMP = type(uint256).max;

    // ACL
    bytes32 public constant PAUSE_ROLE = keccak256("PAUSE_ROLE");
    bytes32 public constant RESUME_ROLE = keccak256("RESUME_ROLE");
    bytes32 public constant FINALIZE_ROLE = keccak256("FINALIZE_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    /// @notice minimal amount of stACE that is possible to withdraw
    uint256 public constant MIN_STACE_WITHDRAWAL_AMOUNT = 100;

    /// @notice maximum amount of stACE that is possible to withdraw by a single request
    /// Prevents accumulating too much funds per single request fulfillment in the future.
    /// @dev To withdraw larger amounts, it's recommended to split it to several requests
    uint256 public constant MAX_STACE_WITHDRAWAL_AMOUNT = 1000 * 1e18;

    /// @notice Catalist stACE token address
    IStACE public immutable STACE;
    /// @notice Catalist wstACE token address
    IWstACE public immutable WSTACE;

    event InitializedV1(address _admin);
    event BunkerModeEnabled(uint256 _sinceTimestamp);
    event BunkerModeDisabled();

    error AdminZeroAddress();
    error RequestAmountTooSmall(uint256 _amountOfStACE);
    error RequestAmountTooLarge(uint256 _amountOfStACE);
    error InvalidReportTimestamp();
    error RequestIdsNotSorted();
    error ZeroRecipient();
    error ArraysLengthMismatch(
        uint256 _firstArrayLength,
        uint256 _secondArrayLength
    );

    /// @param _wstACE address of WstACE contract
    constructor(IWstACE _wstACE) {
        // init immutables
        WSTACE = _wstACE;
        STACE = WSTACE.stACE();
    }

    /// @notice Initialize the contract storage explicitly.
    /// @param _admin admin address that can change every role.
    /// @dev Reverts if `_admin` equals to `address(0)`
    /// @dev NB! It's initialized in paused state by default and should be resumed explicitly to start
    /// @dev NB! Bunker mode is disabled by default
    function initialize(address _admin) external {
        if (_admin == address(0)) revert AdminZeroAddress();

        _initialize(_admin);
    }

    /// @notice Resume withdrawal requests placement and finalization
    ///  Contract is deployed in paused state and should be resumed explicitly
    function resume() external {
        _checkRole(RESUME_ROLE, msg.sender);
        _resume();
    }

    /// @notice Pause withdrawal requests placement and finalization. Claiming finalized requests will still be available
    /// @param _duration pause duration in seconds (use `PAUSE_INFINITELY` for unlimited)
    /// @dev Reverts if contract is already paused
    /// @dev Reverts reason if sender has no `PAUSE_ROLE`
    /// @dev Reverts if zero duration is passed
    function pauseFor(uint256 _duration) external onlyRole(PAUSE_ROLE) {
        _pauseFor(_duration);
    }

    /// @notice Pause withdrawal requests placement and finalization. Claiming finalized requests will still be available
    /// @param _pauseUntilInclusive the last second to pause until inclusive
    /// @dev Reverts if the timestamp is in the past
    /// @dev Reverts if sender has no `PAUSE_ROLE`
    /// @dev Reverts if contract is already paused
    function pauseUntil(
        uint256 _pauseUntilInclusive
    ) external onlyRole(PAUSE_ROLE) {
        _pauseUntil(_pauseUntilInclusive);
    }

    /// @notice Request the batch of stACE for withdrawal. Approvals for the passed amounts should be done before.
    /// @param _amounts an array of stACE amount values.
    ///  The standalone withdrawal request will be created for each item in the passed list.
    /// @param _owner address that will be able to manage the created requests.
    ///  If `address(0)` is passed, `msg.sender` will be used as owner.
    /// @return requestIds an array of the created withdrawal request ids
    function requestWithdrawals(
        uint256[] calldata _amounts,
        address _owner
    ) public returns (uint256[] memory requestIds) {
        _checkResumed();
        if (_owner == address(0)) _owner = msg.sender;
        requestIds = new uint256[](_amounts.length);
        for (uint256 i = 0; i < _amounts.length; ++i) {
            _checkWithdrawalRequestAmount(_amounts[i]);
            requestIds[i] = _requestWithdrawal(_amounts[i], _owner);
        }
    }

    /// @notice Request the batch of wstACE for withdrawal. Approvals for the passed amounts should be done before.
    /// @param _amounts an array of wstACE amount values.
    ///  The standalone withdrawal request will be created for each item in the passed list.
    /// @param _owner address that will be able to manage the created requests.
    ///  If `address(0)` is passed, `msg.sender` will be used as an owner.
    /// @return requestIds an array of the created withdrawal request ids
    function requestWithdrawalsWstACE(
        uint256[] calldata _amounts,
        address _owner
    ) public returns (uint256[] memory requestIds) {
        _checkResumed();
        if (_owner == address(0)) _owner = msg.sender;
        requestIds = new uint256[](_amounts.length);
        for (uint256 i = 0; i < _amounts.length; ++i) {
            requestIds[i] = _requestWithdrawalWstACE(_amounts[i], _owner);
        }
    }

    struct PermitInput {
        uint256 value;
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    /// @notice Request the batch of stACE for withdrawal using EIP-2612 Permit
    /// @param _amounts an array of stACE amount values
    ///  The standalone withdrawal request will be created for each item in the passed list.
    /// @param _owner address that will be able to manage the created requests.
    ///  If `address(0)` is passed, `msg.sender` will be used as an owner.
    /// @param _permit data required for the stACE.permit() method to set the allowance
    /// @return requestIds an array of the created withdrawal request ids
    function requestWithdrawalsWithPermit(
        uint256[] calldata _amounts,
        address _owner,
        PermitInput calldata _permit
    ) external returns (uint256[] memory requestIds) {
        STACE.permit(
            msg.sender,
            address(this),
            _permit.value,
            _permit.deadline,
            _permit.v,
            _permit.r,
            _permit.s
        );
        return requestWithdrawals(_amounts, _owner);
    }

    /// @notice Request the batch of wstACE for withdrawal using EIP-2612 Permit
    /// @param _amounts an array of wstACE amount values
    ///  The standalone withdrawal request will be created for each item in the passed list.
    /// @param _owner address that will be able to manage the created requests.
    ///  If `address(0)` is passed, `msg.sender` will be used as an owner.
    /// @param _permit data required for the wtACE.permit() method to set the allowance
    /// @return requestIds an array of the created withdrawal request ids
    function requestWithdrawalsWstACEWithPermit(
        uint256[] calldata _amounts,
        address _owner,
        PermitInput calldata _permit
    ) external returns (uint256[] memory requestIds) {
        WSTACE.permit(
            msg.sender,
            address(this),
            _permit.value,
            _permit.deadline,
            _permit.v,
            _permit.r,
            _permit.s
        );
        return requestWithdrawalsWstACE(_amounts, _owner);
    }

    /// @notice Returns all withdrawal requests that belongs to the `_owner` address
    ///
    /// WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
    /// to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
    /// this function has an unbounded cost, and using it as part of a state-changing function may render the function
    /// uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block.
    function getWithdrawalRequests(
        address _owner
    ) external view returns (uint256[] memory requestsIds) {
        return _getRequestsByOwner()[_owner].values();
    }

    /// @notice Returns status for requests with provided ids
    /// @param _requestIds array of withdrawal request ids
    function getWithdrawalStatus(
        uint256[] calldata _requestIds
    ) external view returns (WithdrawalRequestStatus[] memory statuses) {
        statuses = new WithdrawalRequestStatus[](_requestIds.length);
        for (uint256 i = 0; i < _requestIds.length; ++i) {
            statuses[i] = _getStatus(_requestIds[i]);
        }
    }

    /// @notice Returns amount of ether available for claim for each provided request id
    /// @param _requestIds array of request ids
    /// @param _hints checkpoint hints. can be found with `findCheckpointHints(_requestIds, 1, getLastCheckpointIndex())`
    /// @return claimableAceValues amount of claimable ether for each request, amount is equal to 0 if request
    ///  is not finalized or already claimed
    function getClaimableAce(
        uint256[] calldata _requestIds,
        uint256[] calldata _hints
    ) external view returns (uint256[] memory claimableAceValues) {
        claimableAceValues = new uint256[](_requestIds.length);
        for (uint256 i = 0; i < _requestIds.length; ++i) {
            claimableAceValues[i] = _getClaimableAce(_requestIds[i], _hints[i]);
        }
    }

    /// @notice Claim a batch of withdrawal requests if they are finalized sending ether to `_recipient`
    /// @param _requestIds array of request ids to claim
    /// @param _hints checkpoint hint for each id. Can be obtained with `findCheckpointHints()`
    /// @param _recipient address where claimed ether will be sent to
    /// @dev
    ///  Reverts if recipient is equal to zero
    ///  Reverts if requestIds and hints arrays length differs
    ///  Reverts if any requestId or hint in arguments are not valid
    ///  Reverts if any request is not finalized or already claimed
    ///  Reverts if msg sender is not an owner of the requests
    function claimWithdrawalsTo(
        uint256[] calldata _requestIds,
        uint256[] calldata _hints,
        address _recipient
    ) external {
        if (_recipient == address(0)) revert ZeroRecipient();
        if (_requestIds.length != _hints.length) {
            revert ArraysLengthMismatch(_requestIds.length, _hints.length);
        }

        for (uint256 i = 0; i < _requestIds.length; ++i) {
            _claim(_requestIds[i], _hints[i], _recipient);
            _emitTransfer(msg.sender, address(0), _requestIds[i]);
        }
    }

    /// @notice Claim a batch of withdrawal requests if they are finalized sending locked ether to the owner
    /// @param _requestIds array of request ids to claim
    /// @param _hints checkpoint hint for each id. Can be obtained with `findCheckpointHints()`
    /// @dev
    ///  Reverts if requestIds and hints arrays length differs
    ///  Reverts if any requestId or hint in arguments are not valid
    ///  Reverts if any request is not finalized or already claimed
    ///  Reverts if msg sender is not an owner of the requests
    function claimWithdrawals(
        uint256[] calldata _requestIds,
        uint256[] calldata _hints
    ) external {
        if (_requestIds.length != _hints.length) {
            revert ArraysLengthMismatch(_requestIds.length, _hints.length);
        }

        for (uint256 i = 0; i < _requestIds.length; ++i) {
            _claim(_requestIds[i], _hints[i], msg.sender);
            _emitTransfer(msg.sender, address(0), _requestIds[i]);
        }
    }

    /// @notice Claim one`_requestId` request once finalized sending locked ether to the owner
    /// @param _requestId request id to claim
    /// @dev use unbounded loop to find a hint, which can lead to OOG
    /// @dev
    ///  Reverts if requestId or hint are not valid
    ///  Reverts if request is not finalized or already claimed
    ///  Reverts if msg sender is not an owner of request
    function claimWithdrawal(uint256 _requestId) external {
        _claim(
            _requestId,
            _findCheckpointHint(_requestId, 1, getLastCheckpointIndex()),
            msg.sender
        );
        _emitTransfer(msg.sender, address(0), _requestId);
    }

    /// @notice Finds the list of hints for the given `_requestIds` searching among the checkpoints with indices
    ///  in the range  `[_firstIndex, _lastIndex]`.
    ///  NB! Array of request ids should be sorted
    ///  NB! `_firstIndex` should be greater than 0, because checkpoint list is 1-based array
    ///  Usage: findCheckpointHints(_requestIds, 1, getLastCheckpointIndex())
    /// @param _requestIds ids of the requests sorted in the ascending order to get hints for
    /// @param _firstIndex left boundary of the search range. Should be greater than 0
    /// @param _lastIndex right boundary of the search range. Should be less than or equal to getLastCheckpointIndex()
    /// @return hintIds array of hints used to find required checkpoint for the request
    function findCheckpointHints(
        uint256[] calldata _requestIds,
        uint256 _firstIndex,
        uint256 _lastIndex
    ) external view returns (uint256[] memory hintIds) {
        hintIds = new uint256[](_requestIds.length);
        uint256 prevRequestId = 0;
        for (uint256 i = 0; i < _requestIds.length; ++i) {
            if (_requestIds[i] < prevRequestId) revert RequestIdsNotSorted();
            hintIds[i] = _findCheckpointHint(
                _requestIds[i],
                _firstIndex,
                _lastIndex
            );
            _firstIndex = hintIds[i];
            prevRequestId = _requestIds[i];
        }
    }

    /// @notice Update bunker mode state and last report timestamp on oracle report
    /// @dev should be called by oracle
    ///
    /// @param _isBunkerModeNow is bunker mode reported by oracle
    /// @param _bunkerStartTimestamp timestamp of start of the bunker mode
    /// @param _currentReportTimestamp timestamp of the current report ref slot
    function onOracleReport(
        bool _isBunkerModeNow,
        uint256 _bunkerStartTimestamp,
        uint256 _currentReportTimestamp
    ) external {
        _checkRole(ORACLE_ROLE, msg.sender);
        if (_bunkerStartTimestamp >= block.timestamp)
            revert InvalidReportTimestamp();
        if (_currentReportTimestamp >= block.timestamp)
            revert InvalidReportTimestamp();

        _setLastReportTimestamp(_currentReportTimestamp);

        bool isBunkerModeWasSetBefore = isBunkerModeActive();

        // on bunker mode state change
        if (_isBunkerModeNow != isBunkerModeWasSetBefore) {
            // write previous timestamp to enable bunker or max uint to disable
            if (_isBunkerModeNow) {
                BUNKER_MODE_SINCE_TIMESTAMP_POSITION.setStorageUint256(
                    _bunkerStartTimestamp
                );

                emit BunkerModeEnabled(_bunkerStartTimestamp);
            } else {
                BUNKER_MODE_SINCE_TIMESTAMP_POSITION.setStorageUint256(
                    BUNKER_MODE_DISABLED_TIMESTAMP
                );

                emit BunkerModeDisabled();
            }
        }
    }

    /// @notice Check if bunker mode is active
    function isBunkerModeActive() public view returns (bool) {
        return bunkerModeSinceTimestamp() < BUNKER_MODE_DISABLED_TIMESTAMP;
    }

    /// @notice Get bunker mode activation timestamp
    /// @dev returns `BUNKER_MODE_DISABLED_TIMESTAMP` if bunker mode is disable (i.e., protocol in turbo mode)
    function bunkerModeSinceTimestamp() public view returns (uint256) {
        return BUNKER_MODE_SINCE_TIMESTAMP_POSITION.getStorageUint256();
    }

    /// @notice Should emit ERC721 Transfer event in the inheriting contract
    function _emitTransfer(
        address from,
        address to,
        uint256 _requestId
    ) internal virtual;

    /// @dev internal initialization helper. Doesn't check provided addresses intentionally
    function _initialize(address _admin) internal {
        _initializeQueue();
        _pauseFor(PAUSE_INFINITELY);

        _initializeContractVersionTo(1);

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);

        BUNKER_MODE_SINCE_TIMESTAMP_POSITION.setStorageUint256(
            BUNKER_MODE_DISABLED_TIMESTAMP
        );

        emit InitializedV1(_admin);
    }

    function _requestWithdrawal(
        uint256 _amountOfStACE,
        address _owner
    ) internal returns (uint256 requestId) {
        STACE.transferFrom(msg.sender, address(this), _amountOfStACE);

        uint256 amountOfShares = STACE.getSharesByPooledAce(_amountOfStACE);

        requestId = _enqueue(
            uint128(_amountOfStACE),
            uint128(amountOfShares),
            _owner
        );

        _emitTransfer(address(0), _owner, requestId);
    }

    function _requestWithdrawalWstACE(
        uint256 _amountOfWstACE,
        address _owner
    ) internal returns (uint256 requestId) {
        WSTACE.transferFrom(msg.sender, address(this), _amountOfWstACE);
        uint256 amountOfStACE = WSTACE.unwrap(_amountOfWstACE);
        _checkWithdrawalRequestAmount(amountOfStACE);

        uint256 amountOfShares = STACE.getSharesByPooledAce(amountOfStACE);

        requestId = _enqueue(
            uint128(amountOfStACE),
            uint128(amountOfShares),
            _owner
        );

        _emitTransfer(address(0), _owner, requestId);
    }

    function _checkWithdrawalRequestAmount(
        uint256 _amountOfStACE
    ) internal pure {
        if (_amountOfStACE < MIN_STACE_WITHDRAWAL_AMOUNT) {
            revert RequestAmountTooSmall(_amountOfStACE);
        }
        if (_amountOfStACE > MAX_STACE_WITHDRAWAL_AMOUNT) {
            revert RequestAmountTooLarge(_amountOfStACE);
        }
    }

    /// @notice returns claimable ether under the request. Returns 0 if request is not finalized or claimed
    function _getClaimableAce(
        uint256 _requestId,
        uint256 _hint
    ) internal view returns (uint256) {
        if (_requestId == 0 || _requestId > getLastRequestId())
            revert InvalidRequestId(_requestId);

        if (_requestId > getLastFinalizedRequestId()) return 0;

        WithdrawalRequest storage request = _getQueue()[_requestId];
        if (request.claimed) return 0;

        return _calculateClaimableAce(request, _requestId, _hint);
    }
}