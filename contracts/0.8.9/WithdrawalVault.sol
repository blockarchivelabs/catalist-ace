// SPDX-FileCopyrightText: 2023 Lido <info@lido.fi>
// SPDX-License-Identifier: GPL-3.0

/* See contracts/COMPILERS.md */
pragma solidity 0.8.9;

import "@openzeppelin/contracts-v4.4/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-v4.4/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-v4.4/token/ERC20/utils/SafeERC20.sol";

import {Versioned} from "./utils/Versioned.sol";

interface ICatalist {
    /**
     * @notice A payable function supposed to be called only by WithdrawalVault contract
     * @dev We need a dedicated function because funds received by the default payable function
     * are treated as a user deposit
     */
    function receiveWithdrawals() external payable;
}

/**
 * @title A vault for temporary storage of withdrawals
 */
contract WithdrawalVault is Versioned {
    using SafeERC20 for IERC20;

    ICatalist public immutable CATALIST;
    address public immutable TREASURY;

    // Events
    /**
     * Emitted when the ERC20 `token` recovered (i.e. transferred)
     * to the Catalist treasury address by `requestedBy` sender.
     */
    event ERC20Recovered(
        address indexed requestedBy,
        address indexed token,
        uint256 amount
    );

    /**
     * Emitted when the ERC721-compatible `token` (NFT) recovered (i.e. transferred)
     * to the Catalist treasury address by `requestedBy` sender.
     */
    event ERC721Recovered(
        address indexed requestedBy,
        address indexed token,
        uint256 tokenId
    );

    // Errors
    error CatalistZeroAddress();
    error TreasuryZeroAddress();
    error NotCatalist();
    error NotEnoughAce(uint256 requested, uint256 balance);
    error ZeroAmount();

    /**
     * @param _catalist the Catalist token (bACE) address
     * @param _treasury the Catalist treasury address (see ERC20/ERC721-recovery interfaces)
     */
    constructor(ICatalist _catalist, address _treasury) {
        if (address(_catalist) == address(0)) {
            revert CatalistZeroAddress();
        }
        if (_treasury == address(0)) {
            revert TreasuryZeroAddress();
        }

        CATALIST = _catalist;
        TREASURY = _treasury;
    }

    /**
     * @notice Initialize the contract explicitly.
     * Sets the contract version to '1'.
     */
    function initialize() external {
        _initializeContractVersionTo(1);
    }

    /**
     * @notice Withdraw `_amount` of accumulated withdrawals to Catalist contract
     * @dev Can be called only by the Catalist contract
     * @param _amount amount of ACE to withdraw
     */
    function withdrawWithdrawals(uint256 _amount) external {
        if (msg.sender != address(CATALIST)) {
            revert NotCatalist();
        }
        if (_amount == 0) {
            revert ZeroAmount();
        }

        uint256 balance = address(this).balance;
        if (_amount > balance) {
            revert NotEnoughAce(_amount, balance);
        }

        CATALIST.receiveWithdrawals{value: _amount}();
    }

    /**
     * Transfers a given `_amount` of an ERC20-token (defined by the `_token` contract address)
     * currently belonging to the burner contract address to the Catalist treasury address.
     *
     * @param _token an ERC20-compatible token
     * @param _amount token amount
     */
    function recoverERC20(IERC20 _token, uint256 _amount) external {
        if (_amount == 0) {
            revert ZeroAmount();
        }

        emit ERC20Recovered(msg.sender, address(_token), _amount);

        _token.safeTransfer(TREASURY, _amount);
    }

    /**
     * Transfers a given token_id of an ERC721-compatible NFT (defined by the token contract address)
     * currently belonging to the burner contract address to the Catalist treasury address.
     *
     * @param _token an ERC721-compatible token
     * @param _tokenId minted token id
     */
    function recoverERC721(IERC721 _token, uint256 _tokenId) external {
        emit ERC721Recovered(msg.sender, address(_token), _tokenId);

        _token.transferFrom(address(this), TREASURY, _tokenId);
    }
}
