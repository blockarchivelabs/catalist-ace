// SPDX-FileCopyrightText: 2021 Lido <info@lido.fi>

// SPDX-License-Identifier: GPL-3.0

/* See contracts/COMPILERS.md */
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/drafts/ERC20Permit.sol";
import "./interfaces/IStACE.sol";

/**
 * @title StACE token wrapper with static balances.
 * @dev It's an ERC20 token that represents the account's share of the total
 * supply of stACE tokens. WstACE token's balance only changes on transfers,
 * unlike StACE that is also changed when oracles report staking rewards and
 * penalties. It's a "power user" token for DeFi protocols which don't
 * support rebasable tokens.
 *
 * The contract is also a trustless wrapper that accepts stACE tokens and mints
 * wstACE in return. Then the user unwraps, the contract burns user's wstACE
 * and sends user locked stACE in return.
 *
 * The contract provides the staking shortcut: user can send ACE with regular
 * transfer and get wstACE in return. The contract will send ACE to Lido submit
 * method, staking it and wrapping the received stACE.
 *
 */
contract WstACE is ERC20Permit {
    IStACE public stACE;

    /**
     * @param _stACE address of the StACE token to wrap
     */
    constructor(
        IStACE _stACE
    )
        public
        ERC20Permit("Wrapped liquid staked Ace 2.0")
        ERC20("Wrapped liquid staked Ace 2.0", "wstACE")
    {
        stACE = _stACE;
    }

    /**
     * @notice Exchanges stACE to wstACE
     * @param _stACEAmount amount of stACE to wrap in exchange for wstACE
     * @dev Requirements:
     *  - `_stACEAmount` must be non-zero
     *  - msg.sender must approve at least `_stACEAmount` stACE to this
     *    contract.
     *  - msg.sender must have at least `_stACEAmount` of stACE.
     * User should first approve _stACEAmount to the WstACE contract
     * @return Amount of wstACE user receives after wrap
     */
    function wrap(uint256 _stACEAmount) external returns (uint256) {
        require(_stACEAmount > 0, "wstACE: can't wrap zero stACE");
        uint256 wstACEAmount = stACE.getSharesByPooledAce(_stACEAmount);
        _mint(msg.sender, wstACEAmount);
        stACE.transferFrom(msg.sender, address(this), _stACEAmount);
        return wstACEAmount;
    }

    /**
     * @notice Exchanges wstACE to stACE
     * @param _wstACEAmount amount of wstACE to uwrap in exchange for stACE
     * @dev Requirements:
     *  - `_wstACEAmount` must be non-zero
     *  - msg.sender must have at least `_wstACEAmount` wstACE.
     * @return Amount of stACE user receives after unwrap
     */
    function unwrap(uint256 _wstACEAmount) external returns (uint256) {
        require(_wstACEAmount > 0, "wstACE: zero amount unwrap not allowed");
        uint256 stACEAmount = stACE.getPooledAceByShares(_wstACEAmount);
        _burn(msg.sender, _wstACEAmount);
        stACE.transfer(msg.sender, stACEAmount);
        return stACEAmount;
    }

    /**
     * @notice Shortcut to stake ACE and auto-wrap returned stACE
     */
    receive() external payable {
        uint256 shares = stACE.submit{ value: msg.value }(address(0));
        _mint(msg.sender, shares);
    }

    /**
     * @notice Get amount of wstACE for a given amount of stACE
     * @param _stACEAmount amount of stACE
     * @return Amount of wstACE for a given stACE amount
     */
    function getWstACEByStACE(
        uint256 _stACEAmount
    ) external view returns (uint256) {
        return stACE.getSharesByPooledAce(_stACEAmount);
    }

    /**
     * @notice Get amount of stACE for a given amount of wstACE
     * @param _wstACEAmount amount of wstACE
     * @return Amount of stACE for a given wstACE amount
     */
    function getStACEByWstACE(
        uint256 _wstACEAmount
    ) external view returns (uint256) {
        return stACE.getPooledAceByShares(_wstACEAmount);
    }

    /**
     * @notice Get amount of stACE for a one wstACE
     * @return Amount of stACE for 1 wstACE
     */
    function stAcePerToken() external view returns (uint256) {
        return stACE.getPooledAceByShares(1 ether);
    }

    /**
     * @notice Get amount of wstACE for a one stACE
     * @return Amount of wstACE for a 1 stACE
     */
    function tokensPerStAce() external view returns (uint256) {
        return stACE.getSharesByPooledAce(1 ether);
    }
}
