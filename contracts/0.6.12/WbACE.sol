// SPDX-FileCopyrightText: 2021 Lido <info@lido.fi>

// SPDX-License-Identifier: GPL-3.0

/* See contracts/COMPILERS.md */
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/drafts/ERC20Permit.sol";
import "./interfaces/IBACE.sol";

/**
 * @title BACE token wrapper with static balances.
 * @dev It's an ERC20 token that represents the account's share of the total
 * supply of bACE tokens. WbACE token's balance only changes on transfers,
 * unlike BACE that is also changed when oracles report staking rewards and
 * penalties. It's a "power user" token for DeFi protocols which don't
 * support rebasable tokens.
 *
 * The contract is also a trustless wrapper that accepts bACE tokens and mints
 * wbACE in return. Then the user unwraps, the contract burns user's wbACE
 * and sends user locked bACE in return.
 *
 * The contract provides the staking shortcut: user can send ACE with regular
 * transfer and get wbACE in return. The contract will send ACE to Lido submit
 * method, staking it and wrapping the received bACE.
 *
 */
contract WbACE is ERC20Permit {
    IBACE public bACE;

    /**
     * @param _bACE address of the BACE token to wrap
     */
    constructor(
        IBACE _bACE
    )
        public
        ERC20Permit("Wrapped Bond Ace")
        ERC20("Wrapped Bond Ace", "wbACE")
    {
        bACE = _bACE;
    }

    /**
     * @notice Exchanges bACE to wbACE
     * @param _bACEAmount amount of bACE to wrap in exchange for wbACE
     * @dev Requirements:
     *  - `_bACEAmount` must be non-zero
     *  - msg.sender must approve at least `_bACEAmount` bACE to this
     *    contract.
     *  - msg.sender must have at least `_bACEAmount` of bACE.
     * User should first approve _bACEAmount to the WbACE contract
     * @return Amount of wbACE user receives after wrap
     */
    function wrap(uint256 _bACEAmount) external returns (uint256) {
        require(_bACEAmount > 0, "wbACE: can't wrap zero bACE");
        uint256 wbACEAmount = bACE.getSharesByPooledAce(_bACEAmount);
        _mint(msg.sender, wbACEAmount);
        bACE.transferFrom(msg.sender, address(this), _bACEAmount);
        return wbACEAmount;
    }

    /**
     * @notice Exchanges wbACE to bACE
     * @param _wbACEAmount amount of wbACE to uwrap in exchange for bACE
     * @dev Requirements:
     *  - `_wbACEAmount` must be non-zero
     *  - msg.sender must have at least `_wbACEAmount` wbACE.
     * @return Amount of bACE user receives after unwrap
     */
    function unwrap(uint256 _wbACEAmount) external returns (uint256) {
        require(_wbACEAmount > 0, "wbACE: zero amount unwrap not allowed");
        uint256 bACEAmount = bACE.getPooledAceByShares(_wbACEAmount);
        _burn(msg.sender, _wbACEAmount);
        bACE.transfer(msg.sender, bACEAmount);
        return bACEAmount;
    }

    /**
     * @notice Shortcut to stake ACE and auto-wrap returned bACE
     */
    receive() external payable {
        uint256 shares = bACE.submit{value: msg.value}(address(0));
        _mint(msg.sender, shares);
    }

    /**
     * @notice Get amount of wbACE for a given amount of bACE
     * @param _bACEAmount amount of bACE
     * @return Amount of wbACE for a given bACE amount
     */
    function getWbACEByBACE(
        uint256 _bACEAmount
    ) external view returns (uint256) {
        return bACE.getSharesByPooledAce(_bACEAmount);
    }

    /**
     * @notice Get amount of bACE for a given amount of wbACE
     * @param _wbACEAmount amount of wbACE
     * @return Amount of bACE for a given wbACE amount
     */
    function getBACEByWbACE(
        uint256 _wbACEAmount
    ) external view returns (uint256) {
        return bACE.getPooledAceByShares(_wbACEAmount);
    }

    /**
     * @notice Get amount of bACE for a one wbACE
     * @return Amount of bACE for 1 wbACE
     */
    function bAcePerToken() external view returns (uint256) {
        return bACE.getPooledAceByShares(1 ether);
    }

    /**
     * @notice Get amount of wbACE for a one bACE
     * @return Amount of wbACE for a 1 bACE
     */
    function tokensPerStAce() external view returns (uint256) {
        return bACE.getSharesByPooledAce(1 ether);
    }
}
