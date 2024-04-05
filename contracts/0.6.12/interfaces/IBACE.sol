// SPDX-FileCopyrightText: 2021 Lido <info@lido.fi>

// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.12; // latest available for using OZ

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBACE is IERC20 {
    function getPooledAceByShares(
        uint256 _sharesAmount
    ) external view returns (uint256);

    function getSharesByPooledAce(
        uint256 _pooledAceAmount
    ) external view returns (uint256);

    function submit(address _referral) external payable returns (uint256);
}
