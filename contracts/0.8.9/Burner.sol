// SPDX-FileCopyrightText: 2023 Lido <info@lido.fi>
// SPDX-License-Identifier: GPL-3.0

/* See contracts/COMPILERS.md */
pragma solidity 0.8.9;

import {IERC20} from "@openzeppelin/contracts-v4.4/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts-v4.4/token/ERC721/IERC721.sol";
import {SafeERC20} from "@openzeppelin/contracts-v4.4/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts-v4.4/utils/math/Math.sol";

import {AccessControlEnumerable} from "./utils/access/AccessControlEnumerable.sol";
import {IBurner} from "../common/interfaces/IBurner.sol";

/**
 * @title Interface defining ERC20-compatible BACE token
 */
interface IBACE is IERC20 {
    /**
     * @notice Get bACE amount by the provided shares amount
     * @param _sharesAmount shares amount
     * @dev dual to `getSharesByPooledAce`.
     */
    function getPooledAceByShares(
        uint256 _sharesAmount
    ) external view returns (uint256);

    /**
     * @notice Get shares amount by the provided bACE amount
     * @param _pooledAceAmount bACE amount
     * @dev dual to `getPooledAceByShares`.
     */
    function getSharesByPooledAce(
        uint256 _pooledAceAmount
    ) external view returns (uint256);

    /**
     * @notice Get shares amount of the provided account
     * @param _account provided account address.
     */
    function sharesOf(address _account) external view returns (uint256);

    /**
     * @notice Transfer `_sharesAmount` bACE shares from `_sender` to `_receiver` using allowance.
     */
    function transferSharesFrom(
        address _sender,
        address _recipient,
        uint256 _sharesAmount
    ) external returns (uint256);
}

/**
 * @notice A dedicated contract for bACE burning requests scheduling
 *
 * @dev Burning bACE means 'decrease total underlying shares amount to perform bACE positive token rebase'
 */
contract Burner is IBurner, AccessControlEnumerable {
    using SafeERC20 for IERC20;

    error AppAuthCatalistFailed();
    error DirectACETransfer();
    error ZeroRecoveryAmount();
    error BACERecoveryWrongFunc();
    error ZeroBurnAmount();
    error BurnAmountExceedsActual(
        uint256 requestedAmount,
        uint256 actualAmount
    );
    error ZeroAddress(string field);

    bytes32 public constant REQUEST_BURN_MY_BACE_ROLE =
        keccak256("REQUEST_BURN_MY_BACE_ROLE");
    bytes32 public constant REQUEST_BURN_SHARES_ROLE =
        keccak256("REQUEST_BURN_SHARES_ROLE");

    uint256 private coverSharesBurnRequested;
    uint256 private nonCoverSharesBurnRequested;

    uint256 private totalCoverSharesBurnt;
    uint256 private totalNonCoverSharesBurnt;

    address public immutable BACE;
    address public immutable TREASURY;

    /**
     * Emitted when a new bACE burning request is added by the `requestedBy` address.
     */
    event BACEBurnRequested(
        bool indexed isCover,
        address indexed requestedBy,
        uint256 amountOfBACE,
        uint256 amountOfShares
    );

    /**
     * Emitted when the bACE `amount` (corresponding to `amountOfShares` shares) burnt for the `isCover` reason.
     */
    event BACEBurnt(
        bool indexed isCover,
        uint256 amountOfBACE,
        uint256 amountOfShares
    );

    /**
     * Emitted when the excessive bACE `amount` (corresponding to `amountOfShares` shares) recovered (i.e. transferred)
     * to the Catalist treasure address by `requestedBy` sender.
     */
    event ExcessBACERecovered(
        address indexed requestedBy,
        uint256 amountOfBACE,
        uint256 amountOfShares
    );

    /**
     * Emitted when the ERC20 `token` recovered (i.e. transferred)
     * to the Catalist treasure address by `requestedBy` sender.
     */
    event ERC20Recovered(
        address indexed requestedBy,
        address indexed token,
        uint256 amount
    );

    /**
     * Emitted when the ERC721-compatible `token` (NFT) recovered (i.e. transferred)
     * to the Catalist treasure address by `requestedBy` sender.
     */
    event ERC721Recovered(
        address indexed requestedBy,
        address indexed token,
        uint256 tokenId
    );

    /**
     * Ctor
     *
     * @param _admin the Catalist DAO Aragon agent contract address
     * @param _treasury the Catalist treasury address (see BACE/ERC20/ERC721-recovery interfaces)
     * @param _bACE bACE token address
     * @param _totalCoverSharesBurnt Shares burnt counter init value (cover case)
     * @param _totalNonCoverSharesBurnt Shares burnt counter init value (non-cover case)
     */
    constructor(
        address _admin,
        address _treasury,
        address _bACE,
        uint256 _totalCoverSharesBurnt,
        uint256 _totalNonCoverSharesBurnt
    ) {
        if (_admin == address(0)) revert ZeroAddress("_admin");
        if (_treasury == address(0)) revert ZeroAddress("_treasury");
        if (_bACE == address(0)) revert ZeroAddress("_bACE");

        _setupRole(DEFAULT_ADMIN_ROLE, _admin);
        _setupRole(REQUEST_BURN_SHARES_ROLE, _bACE);

        TREASURY = _treasury;
        BACE = _bACE;

        totalCoverSharesBurnt = _totalCoverSharesBurnt;
        totalNonCoverSharesBurnt = _totalNonCoverSharesBurnt;
    }

    /**
     * @notice BE CAREFUL, the provided bACE will be burnt permanently.
     *
     * Transfers `_bACEAmountToBurn` bACE tokens from the message sender and irreversibly locks these
     * on the burner contract address. Internally converts `_bACEAmountToBurn` amount into underlying
     * shares amount (`_bACEAmountToBurnAsShares`) and marks the converted amount for burning
     * by increasing the `coverSharesBurnRequested` counter.
     *
     * @param _bACEAmountToBurn bACE tokens to burn
     *
     */
    function requestBurnMyBACEForCover(
        uint256 _bACEAmountToBurn
    ) external onlyRole(REQUEST_BURN_MY_BACE_ROLE) {
        IBACE(BACE).transferFrom(msg.sender, address(this), _bACEAmountToBurn);
        uint256 sharesAmount = IBACE(BACE).getSharesByPooledAce(
            _bACEAmountToBurn
        );
        _requestBurn(sharesAmount, _bACEAmountToBurn, true /* _isCover */);
    }

    /**
     * @notice BE CAREFUL, the provided bACE will be burnt permanently.
     *
     * Transfers `_sharesAmountToBurn` bACE shares from `_from` and irreversibly locks these
     * on the burner contract address. Marks the shares amount for burning
     * by increasing the `coverSharesBurnRequested` counter.
     *
     * @param _from address to transfer shares from
     * @param _sharesAmountToBurn bACE shares to burn
     *
     */
    function requestBurnSharesForCover(
        address _from,
        uint256 _sharesAmountToBurn
    ) external onlyRole(REQUEST_BURN_SHARES_ROLE) {
        uint256 bACEAmount = IBACE(BACE).transferSharesFrom(
            _from,
            address(this),
            _sharesAmountToBurn
        );
        _requestBurn(_sharesAmountToBurn, bACEAmount, true /* _isCover */);
    }

    /**
     * @notice BE CAREFUL, the provided bACE will be burnt permanently.
     *
     * Transfers `_bACEAmountToBurn` bACE tokens from the message sender and irreversibly locks these
     * on the burner contract address. Internally converts `_bACEAmountToBurn` amount into underlying
     * shares amount (`_bACEAmountToBurnAsShares`) and marks the converted amount for burning
     * by increasing the `nonCoverSharesBurnRequested` counter.
     *
     * @param _bACEAmountToBurn bACE tokens to burn
     *
     */
    function requestBurnMyBACE(
        uint256 _bACEAmountToBurn
    ) external onlyRole(REQUEST_BURN_MY_BACE_ROLE) {
        IBACE(BACE).transferFrom(msg.sender, address(this), _bACEAmountToBurn);
        uint256 sharesAmount = IBACE(BACE).getSharesByPooledAce(
            _bACEAmountToBurn
        );
        _requestBurn(sharesAmount, _bACEAmountToBurn, false /* _isCover */);
    }

    /**
     * @notice BE CAREFUL, the provided bACE will be burnt permanently.
     *
     * Transfers `_sharesAmountToBurn` bACE shares from `_from` and irreversibly locks these
     * on the burner contract address. Marks the shares amount for burning
     * by increasing the `nonCoverSharesBurnRequested` counter.
     *
     * @param _from address to transfer shares from
     * @param _sharesAmountToBurn bACE shares to burn
     *
     */
    function requestBurnShares(
        address _from,
        uint256 _sharesAmountToBurn
    ) external onlyRole(REQUEST_BURN_SHARES_ROLE) {
        uint256 bACEAmount = IBACE(BACE).transferSharesFrom(
            _from,
            address(this),
            _sharesAmountToBurn
        );
        _requestBurn(_sharesAmountToBurn, bACEAmount, false /* _isCover */);
    }

    /**
     * Transfers the excess bACE amount (e.g. belonging to the burner contract address
     * but not marked for burning) to the Catalist treasury address set upon the
     * contract construction.
     */
    function recoverExcessBACE() external {
        uint256 excessBACE = getExcessBACE();

        if (excessBACE > 0) {
            uint256 excessSharesAmount = IBACE(BACE).getSharesByPooledAce(
                excessBACE
            );

            emit ExcessBACERecovered(
                msg.sender,
                excessBACE,
                excessSharesAmount
            );

            IBACE(BACE).transfer(TREASURY, excessBACE);
        }
    }

    /**
     * Intentionally deny incoming ether
     */
    receive() external payable {
        revert DirectACETransfer();
    }

    /**
     * Transfers a given `_amount` of an ERC20-token (defined by the `_token` contract address)
     * currently belonging to the burner contract address to the Catalist treasury address.
     *
     * @param _token an ERC20-compatible token
     * @param _amount token amount
     */
    function recoverERC20(address _token, uint256 _amount) external {
        if (_amount == 0) revert ZeroRecoveryAmount();
        if (_token == BACE) revert BACERecoveryWrongFunc();

        emit ERC20Recovered(msg.sender, _token, _amount);

        IERC20(_token).safeTransfer(TREASURY, _amount);
    }

    /**
     * Transfers a given token_id of an ERC721-compatible NFT (defined by the token contract address)
     * currently belonging to the burner contract address to the Catalist treasury address.
     *
     * @param _token an ERC721-compatible token
     * @param _tokenId minted token id
     */
    function recoverERC721(address _token, uint256 _tokenId) external {
        if (_token == BACE) revert BACERecoveryWrongFunc();

        emit ERC721Recovered(msg.sender, _token, _tokenId);

        IERC721(_token).transferFrom(address(this), TREASURY, _tokenId);
    }

    /**
     * Commit cover/non-cover burning requests and logs cover/non-cover shares amount just burnt.
     *
     * NB: The real burn enactment to be invoked after the call (via internal Catalist._burnShares())
     *
     * Increments `totalCoverSharesBurnt` and `totalNonCoverSharesBurnt` counters.
     * Decrements `coverSharesBurnRequested` and `nonCoverSharesBurnRequested` counters.
     * Does nothing if zero amount passed.
     *
     * @param _sharesToBurn amount of shares to be burnt
     */
    function commitSharesToBurn(
        uint256 _sharesToBurn
    ) external virtual override {
        if (msg.sender != BACE) revert AppAuthCatalistFailed();

        if (_sharesToBurn == 0) {
            return;
        }

        uint256 memCoverSharesBurnRequested = coverSharesBurnRequested;
        uint256 memNonCoverSharesBurnRequested = nonCoverSharesBurnRequested;

        uint256 burnAmount = memCoverSharesBurnRequested +
            memNonCoverSharesBurnRequested;

        if (_sharesToBurn > burnAmount) {
            revert BurnAmountExceedsActual(_sharesToBurn, burnAmount);
        }

        uint256 sharesToBurnNow;
        if (memCoverSharesBurnRequested > 0) {
            uint256 sharesToBurnNowForCover = Math.min(
                _sharesToBurn,
                memCoverSharesBurnRequested
            );

            totalCoverSharesBurnt += sharesToBurnNowForCover;
            uint256 bACEToBurnNowForCover = IBACE(BACE).getPooledAceByShares(
                sharesToBurnNowForCover
            );
            emit BACEBurnt(
                true /* isCover */,
                bACEToBurnNowForCover,
                sharesToBurnNowForCover
            );

            coverSharesBurnRequested -= sharesToBurnNowForCover;
            sharesToBurnNow += sharesToBurnNowForCover;
        }
        if (
            memNonCoverSharesBurnRequested > 0 &&
            sharesToBurnNow < _sharesToBurn
        ) {
            uint256 sharesToBurnNowForNonCover = Math.min(
                _sharesToBurn - sharesToBurnNow,
                memNonCoverSharesBurnRequested
            );

            totalNonCoverSharesBurnt += sharesToBurnNowForNonCover;
            uint256 bACEToBurnNowForNonCover = IBACE(BACE).getPooledAceByShares(
                sharesToBurnNowForNonCover
            );
            emit BACEBurnt(
                false /* isCover */,
                bACEToBurnNowForNonCover,
                sharesToBurnNowForNonCover
            );

            nonCoverSharesBurnRequested -= sharesToBurnNowForNonCover;
            sharesToBurnNow += sharesToBurnNowForNonCover;
        }
        assert(sharesToBurnNow == _sharesToBurn);
    }

    /**
     * Returns the current amount of shares locked on the contract to be burnt.
     */
    function getSharesRequestedToBurn()
        external
        view
        virtual
        override
        returns (uint256 coverShares, uint256 nonCoverShares)
    {
        coverShares = coverSharesBurnRequested;
        nonCoverShares = nonCoverSharesBurnRequested;
    }

    /**
     * Returns the total cover shares ever burnt.
     */
    function getCoverSharesBurnt()
        external
        view
        virtual
        override
        returns (uint256)
    {
        return totalCoverSharesBurnt;
    }

    /**
     * Returns the total non-cover shares ever burnt.
     */
    function getNonCoverSharesBurnt()
        external
        view
        virtual
        override
        returns (uint256)
    {
        return totalNonCoverSharesBurnt;
    }

    /**
     * Returns the bACE amount belonging to the burner contract address but not marked for burning.
     */
    function getExcessBACE() public view returns (uint256) {
        return IBACE(BACE).getPooledAceByShares(_getExcessBACEShares());
    }

    function _getExcessBACEShares() internal view returns (uint256) {
        uint256 sharesBurnRequested = (coverSharesBurnRequested +
            nonCoverSharesBurnRequested);
        uint256 totalShares = IBACE(BACE).sharesOf(address(this));

        // sanity check, don't revert
        if (totalShares <= sharesBurnRequested) {
            return 0;
        }

        return totalShares - sharesBurnRequested;
    }

    function _requestBurn(
        uint256 _sharesAmount,
        uint256 _bACEAmount,
        bool _isCover
    ) private {
        if (_sharesAmount == 0) revert ZeroBurnAmount();

        emit BACEBurnRequested(
            _isCover,
            msg.sender,
            _bACEAmount,
            _sharesAmount
        );

        if (_isCover) {
            coverSharesBurnRequested += _sharesAmount;
        } else {
            nonCoverSharesBurnRequested += _sharesAmount;
        }
    }
}
