// SPDX-FileCopyrightText: 2021 Catalist <info@catalist.fi>
// SPDX-License-Identifier: GPL-3.0

/* See contracts/COMPILERS.md */
pragma solidity 0.8.9;

import "@openzeppelin/contracts-v4.4/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-v4.4/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-v4.4/token/ERC20/utils/SafeERC20.sol";

interface ICatalist {
    /**
     * @notice A payable function supposed to be called only by CatalistExecLayerRewardsVault contract
     * @dev We need a dedicated function because funds received by the default payable function
     * are treated as a user deposit
     */
    function receiveELRewards() external payable;
}

/**
 * @title A vault for temporary storage of execution layer rewards (MEV and tx priority fee)
 */
contract CatalistExecutionLayerRewardsVault {
    using SafeERC20 for IERC20;

    address public immutable CATALIST;
    address public immutable TREASURY;

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

    /**
     * Emitted when the vault received ACE
     */
    event ACEReceived(uint256 amount);

    /**
     * Ctor
     *
     * @param _catalist the Catalist token (stACE) address
     * @param _treasury the Catalist treasury address (see ERC20/ERC721-recovery interfaces)
     */
    constructor(address _catalist, address _treasury) {
        require(_catalist != address(0), "CATALIST_ZERO_ADDRESS");
        require(_treasury != address(0), "TREASURY_ZERO_ADDRESS");

        CATALIST = _catalist;
        TREASURY = _treasury;
    }

    /**
     * @notice Allows the contract to receive ACE
     * @dev execution layer rewards may be sent as plain ACE transfers
     */
    receive() external payable {
        emit ACEReceived(msg.value);
    }

    /**
     * @notice Withdraw all accumulated rewards to Catalist contract
     * @dev Can be called only by the Catalist contract
     * @param _maxAmount Max amount of ACE to withdraw
     * @return amount of funds received as execution layer rewards (in wei)
     */
    function withdrawRewards(
        uint256 _maxAmount
    ) external returns (uint256 amount) {
        require(msg.sender == CATALIST, "ONLY_CATALIST_CAN_WITHDRAW");

        uint256 balance = address(this).balance;
        amount = (balance > _maxAmount) ? _maxAmount : balance;
        if (amount > 0) {
            ICatalist(CATALIST).receiveELRewards{ value: amount }();
        }
        return amount;
    }

    /**
     * Transfers a given `_amount` of an ERC20-token (defined by the `_token` contract address)
     * currently belonging to the burner contract address to the Catalist treasury address.
     *
     * @param _token an ERC20-compatible token
     * @param _amount token amount
     */
    function recoverERC20(address _token, uint256 _amount) external {
        require(_amount > 0, "ZERO_RECOVERY_AMOUNT");

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
        emit ERC721Recovered(msg.sender, _token, _tokenId);

        IERC721(_token).transferFrom(address(this), TREASURY, _tokenId);
    }
}
