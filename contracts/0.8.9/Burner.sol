// SPDX-FileCopyrightText: 2023 Catalist <info@catalist.fi>
// SPDX-License-Identifier: GPL-3.0

/* See contracts/COMPILERS.md */
pragma solidity 0.8.9;

import { IERC20 } from "@openzeppelin/contracts-v4.4/token/ERC20/IERC20.sol";
import { IERC721 } from "@openzeppelin/contracts-v4.4/token/ERC721/IERC721.sol";
import { SafeERC20 } from "@openzeppelin/contracts-v4.4/token/ERC20/utils/SafeERC20.sol";
import { Math } from "@openzeppelin/contracts-v4.4/utils/math/Math.sol";

import { AccessControlEnumerable } from "./utils/access/AccessControlEnumerable.sol";
import { IBurner } from "../common/interfaces/IBurner.sol";

/**
 * @title Interface defining ERC20-compatible StACE token
 */
interface IStACE is IERC20 {
    /**
     * @notice Get stACE amount by the provided shares amount
     * @param _sharesAmount shares amount
     * @dev dual to `getSharesByPooledAce`.
     */
    function getPooledAceByShares(
        uint256 _sharesAmount
    ) external view returns (uint256);

    /**
     * @notice Get shares amount by the provided stACE amount
     * @param _pooledAceAmount stACE amount
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
     * @notice Transfer `_sharesAmount` stACE shares from `_sender` to `_receiver` using allowance.
     */
    function transferSharesFrom(
        address _sender,
        address _recipient,
        uint256 _sharesAmount
    ) external returns (uint256);
}

/**
 * @notice A dedicated contract for stACE burning requests scheduling
 *
 * @dev Burning stACE means 'decrease total underlying shares amount to perform stACE positive token rebase'
 */
contract Burner is IBurner, AccessControlEnumerable {
    using SafeERC20 for IERC20;

    error AppAuthCatalistFailed();
    error DirectACETransfer();
    error ZeroRecoveryAmount();
    error StACERecoveryWrongFunc();
    error ZeroBurnAmount();
    error BurnAmountExceedsActual(
        uint256 requestedAmount,
        uint256 actualAmount
    );
    error ZeroAddress(string field);

    bytes32 public constant REQUEST_BURN_MY_STACE_ROLE =
        keccak256("REQUEST_BURN_MY_STACE_ROLE");
    bytes32 public constant REQUEST_BURN_SHARES_ROLE =
        keccak256("REQUEST_BURN_SHARES_ROLE");

    uint256 private coverSharesBurnRequested;
    uint256 private nonCoverSharesBurnRequested;

    uint256 private totalCoverSharesBurnt;
    uint256 private totalNonCoverSharesBurnt;

    address public immutable STACE;
    address public immutable TREASURY;

    /**
     * Emitted when a new stACE burning request is added by the `requestedBy` address.
     */
    event StACEBurnRequested(
        bool indexed isCover,
        address indexed requestedBy,
        uint256 amountOfStACE,
        uint256 amountOfShares
    );

    /**
     * Emitted when the stACE `amount` (corresponding to `amountOfShares` shares) burnt for the `isCover` reason.
     */
    event StACEBurnt(
        bool indexed isCover,
        uint256 amountOfStACE,
        uint256 amountOfShares
    );

    /**
     * Emitted when the excessive stACE `amount` (corresponding to `amountOfShares` shares) recovered (i.e. transferred)
     * to the Catalist treasure address by `requestedBy` sender.
     */
    event ExcessStACERecovered(
        address indexed requestedBy,
        uint256 amountOfStACE,
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
     * @param _treasury the Catalist treasury address (see StACE/ERC20/ERC721-recovery interfaces)
     * @param _stACE stACE token address
     * @param _totalCoverSharesBurnt Shares burnt counter init value (cover case)
     * @param _totalNonCoverSharesBurnt Shares burnt counter init value (non-cover case)
     */
    constructor(
        address _admin,
        address _treasury,
        address _stACE,
        uint256 _totalCoverSharesBurnt,
        uint256 _totalNonCoverSharesBurnt
    ) {
        if (_admin == address(0)) revert ZeroAddress("_admin");
        if (_treasury == address(0)) revert ZeroAddress("_treasury");
        if (_stACE == address(0)) revert ZeroAddress("_stACE");

        _setupRole(DEFAULT_ADMIN_ROLE, _admin);
        _setupRole(REQUEST_BURN_SHARES_ROLE, _stACE);

        TREASURY = _treasury;
        STACE = _stACE;

        totalCoverSharesBurnt = _totalCoverSharesBurnt;
        totalNonCoverSharesBurnt = _totalNonCoverSharesBurnt;
    }

    /**
     * @notice BE CAREFUL, the provided stACE will be burnt permanently.
     *
     * Transfers `_stACEAmountToBurn` stACE tokens from the message sender and irreversibly locks these
     * on the burner contract address. Internally converts `_stACEAmountToBurn` amount into underlying
     * shares amount (`_stACEAmountToBurnAsShares`) and marks the converted amount for burning
     * by increasing the `coverSharesBurnRequested` counter.
     *
     * @param _stACEAmountToBurn stACE tokens to burn
     *
     */
    function requestBurnMyStACEForCover(
        uint256 _stACEAmountToBurn
    ) external onlyRole(REQUEST_BURN_MY_STACE_ROLE) {
        IStACE(STACE).transferFrom(
            msg.sender,
            address(this),
            _stACEAmountToBurn
        );
        uint256 sharesAmount = IStACE(STACE).getSharesByPooledAce(
            _stACEAmountToBurn
        );
        _requestBurn(sharesAmount, _stACEAmountToBurn, true /* _isCover */);
    }

    /**
     * @notice BE CAREFUL, the provided stACE will be burnt permanently.
     *
     * Transfers `_sharesAmountToBurn` stACE shares from `_from` and irreversibly locks these
     * on the burner contract address. Marks the shares amount for burning
     * by increasing the `coverSharesBurnRequested` counter.
     *
     * @param _from address to transfer shares from
     * @param _sharesAmountToBurn stACE shares to burn
     *
     */
    function requestBurnSharesForCover(
        address _from,
        uint256 _sharesAmountToBurn
    ) external onlyRole(REQUEST_BURN_SHARES_ROLE) {
        uint256 stACEAmount = IStACE(STACE).transferSharesFrom(
            _from,
            address(this),
            _sharesAmountToBurn
        );
        _requestBurn(_sharesAmountToBurn, stACEAmount, true /* _isCover */);
    }

    /**
     * @notice BE CAREFUL, the provided stACE will be burnt permanently.
     *
     * Transfers `_stACEAmountToBurn` stACE tokens from the message sender and irreversibly locks these
     * on the burner contract address. Internally converts `_stACEAmountToBurn` amount into underlying
     * shares amount (`_stACEAmountToBurnAsShares`) and marks the converted amount for burning
     * by increasing the `nonCoverSharesBurnRequested` counter.
     *
     * @param _stACEAmountToBurn stACE tokens to burn
     *
     */
    function requestBurnMyStACE(
        uint256 _stACEAmountToBurn
    ) external onlyRole(REQUEST_BURN_MY_STACE_ROLE) {
        IStACE(STACE).transferFrom(
            msg.sender,
            address(this),
            _stACEAmountToBurn
        );
        uint256 sharesAmount = IStACE(STACE).getSharesByPooledAce(
            _stACEAmountToBurn
        );
        _requestBurn(sharesAmount, _stACEAmountToBurn, false /* _isCover */);
    }

    /**
     * @notice BE CAREFUL, the provided stACE will be burnt permanently.
     *
     * Transfers `_sharesAmountToBurn` stACE shares from `_from` and irreversibly locks these
     * on the burner contract address. Marks the shares amount for burning
     * by increasing the `nonCoverSharesBurnRequested` counter.
     *
     * @param _from address to transfer shares from
     * @param _sharesAmountToBurn stACE shares to burn
     *
     */
    function requestBurnShares(
        address _from,
        uint256 _sharesAmountToBurn
    ) external onlyRole(REQUEST_BURN_SHARES_ROLE) {
        uint256 stACEAmount = IStACE(STACE).transferSharesFrom(
            _from,
            address(this),
            _sharesAmountToBurn
        );
        _requestBurn(_sharesAmountToBurn, stACEAmount, false /* _isCover */);
    }

    /**
     * Transfers the excess stACE amount (e.g. belonging to the burner contract address
     * but not marked for burning) to the Catalist treasury address set upon the
     * contract construction.
     */
    function recoverExcessStACE() external {
        uint256 excessStACE = getExcessStACE();

        if (excessStACE > 0) {
            uint256 excessSharesAmount = IStACE(STACE).getSharesByPooledAce(
                excessStACE
            );

            emit ExcessStACERecovered(
                msg.sender,
                excessStACE,
                excessSharesAmount
            );

            IStACE(STACE).transfer(TREASURY, excessStACE);
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
        if (_token == STACE) revert StACERecoveryWrongFunc();

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
        if (_token == STACE) revert StACERecoveryWrongFunc();

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
        if (msg.sender != STACE) revert AppAuthCatalistFailed();

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
            uint256 stACEToBurnNowForCover = IStACE(STACE).getPooledAceByShares(
                sharesToBurnNowForCover
            );
            emit StACEBurnt(
                true /* isCover */,
                stACEToBurnNowForCover,
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
            uint256 stACEToBurnNowForNonCover = IStACE(STACE)
                .getPooledAceByShares(sharesToBurnNowForNonCover);
            emit StACEBurnt(
                false /* isCover */,
                stACEToBurnNowForNonCover,
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
     * Returns the stACE amount belonging to the burner contract address but not marked for burning.
     */
    function getExcessStACE() public view returns (uint256) {
        return IStACE(STACE).getPooledAceByShares(_getExcessStACEShares());
    }

    function _getExcessStACEShares() internal view returns (uint256) {
        uint256 sharesBurnRequested = (coverSharesBurnRequested +
            nonCoverSharesBurnRequested);
        uint256 totalShares = IStACE(STACE).sharesOf(address(this));

        // sanity check, don't revert
        if (totalShares <= sharesBurnRequested) {
            return 0;
        }

        return totalShares - sharesBurnRequested;
    }

    function _requestBurn(
        uint256 _sharesAmount,
        uint256 _stACEAmount,
        bool _isCover
    ) private {
        if (_sharesAmount == 0) revert ZeroBurnAmount();

        emit StACEBurnRequested(
            _isCover,
            msg.sender,
            _stACEAmount,
            _sharesAmount
        );

        if (_isCover) {
            coverSharesBurnRequested += _sharesAmount;
        } else {
            nonCoverSharesBurnRequested += _sharesAmount;
        }
    }
}
