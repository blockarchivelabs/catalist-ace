// SPDX-FileCopyrightText: 2023 Lido <info@lido.fi>
// SPDX-License-Identifier: GPL-3.0

/* See contracts/COMPILERS.md */
pragma solidity 0.8.9;

import {Math256} from "../../common/lib/Math256.sol";

/**
 * This library implements positive rebase limiter for `bACE` token.
 * One needs to initialize `LimiterState` with the desired parameters:
 * - _rebaseLimit (limiter max value, nominated in LIMITER_PRECISION_BASE)
 * - _preTotalPooledAce (see `Catalist.getTotalPooledAce()`), pre-rebase value
 * - _preTotalShares (see `Catalist.getTotalShares()`), pre-rebase value
 *
 * The limiter allows to account for:
 * - consensus layer balance updates (can be either positive or negative)
 * - total pooled ace changes (withdrawing funds from vaults on execution layer)
 * - total shares changes (burning due to coverage, NOR penalization, withdrawals finalization, etc.)
 */

/**
 * @dev Internal limiter representation struct (storing in memory)
 */
struct TokenRebaseLimiterData {
    uint256 preTotalPooledAce; // pre-rebase total pooled ace
    uint256 preTotalShares; // pre-rebase total shares
    uint256 currentTotalPooledAce; // intermediate total pooled ace amount while token rebase is in progress
    uint256 positiveRebaseLimit; // positive rebase limit (target value) with 1e9 precision (`LIMITER_PRECISION_BASE`)
    uint256 maxTotalPooledAce; // maximum total pooled ace that still fits into the positive rebase limit (cached)
}

/**
 *
 * Two-steps flow: account for total supply changes and then determine the shares allowed to be burnt.
 *
 * Conventions:
 *     R - token rebase limit (i.e, {postShareRate / preShareRate - 1} <= R);
 *   inc - total pooled ace increase;
 *   dec - total shares decrease.
 *
 * ### Step 1. Calculating the allowed total pooled ace changes (preTotalShares === postTotalShares)
 *     Used for `PositiveTokenRebaseLimiter.increaseAce()`, `PositiveTokenRebaseLimiter.decreaseAce()`.
 *
 * R = ((preTotalPooledAce + inc) / preTotalShares) / (preTotalPooledAce / preTotalShares) - 1
 * = ((preTotalPooledAce + inc) / preTotalShares) * (preTotalShares / preTotalPooledAce) - 1
 * = (preTotalPooledAce + inc) / preTotalPooledAce) - 1
 * = inc/preTotalPooledAce
 *
 * isolating inc:
 *
 * ``` inc = R * preTotalPooledAce ```
 *
 * ### Step 2. Calculating the allowed to burn shares (preTotalPooledAce != currentTotalPooledAce)
 *     Used for `PositiveTokenRebaseLimiter.getSharesToBurnLimit()`.
 *
 * R = (currentTotalPooledAce / (preTotalShares - dec)) / (preTotalPooledAce / preTotalShares) - 1,
 * let X = currentTotalPooledAce / preTotalPooledAce
 *
 * then:
 * R = X * (preTotalShares / (preTotalShares - dec)) - 1, or
 * (R+1) * (preTotalShares - dec) = X * preTotalShares
 *
 * isolating dec:
 * dec * (R + 1) = (R + 1 - X) * preTotalShares =>
 *
 * ``` dec = preTotalShares * (R + 1 - currentTotalPooledAce/preTotalPooledAce) / (R + 1) ```
 *
 */
library PositiveTokenRebaseLimiter {
    /// @dev Precision base for the limiter (e.g.: 1e6 - 0.1%; 1e9 - 100%)
    uint256 public constant LIMITER_PRECISION_BASE = 10 ** 9;
    /// @dev Disabled limit
    uint256 public constant UNLIMITED_REBASE = type(uint64).max;

    /**
     * @dev Initialize the new `LimiterState` structure instance
     * @param _rebaseLimit max limiter value (saturation point), see `LIMITER_PRECISION_BASE`
     * @param _preTotalPooledAce pre-rebase total pooled ace, see `Catalist.getTotalPooledAce()`
     * @param _preTotalShares pre-rebase total shares, see `Catalist.getTotalShares()`
     * @return limiterState newly initialized limiter structure
     */
    function initLimiterState(
        uint256 _rebaseLimit,
        uint256 _preTotalPooledAce,
        uint256 _preTotalShares
    ) internal pure returns (TokenRebaseLimiterData memory limiterState) {
        if (_rebaseLimit == 0) revert TooLowTokenRebaseLimit();
        if (_rebaseLimit > UNLIMITED_REBASE) revert TooHighTokenRebaseLimit();

        // special case
        if (_preTotalPooledAce == 0) {
            _rebaseLimit = UNLIMITED_REBASE;
        }

        limiterState.currentTotalPooledAce = limiterState
            .preTotalPooledAce = _preTotalPooledAce;
        limiterState.preTotalShares = _preTotalShares;
        limiterState.positiveRebaseLimit = _rebaseLimit;

        limiterState.maxTotalPooledAce = (_rebaseLimit == UNLIMITED_REBASE)
            ? type(uint256).max
            : limiterState.preTotalPooledAce +
                (limiterState.positiveRebaseLimit *
                    limiterState.preTotalPooledAce) /
                LIMITER_PRECISION_BASE;
    }

    /**
     * @notice check if positive rebase limit is reached
     * @param _limiterState limit repr struct
     * @return true if limit is reached
     */
    function isLimitReached(
        TokenRebaseLimiterData memory _limiterState
    ) internal pure returns (bool) {
        return
            _limiterState.currentTotalPooledAce >=
            _limiterState.maxTotalPooledAce;
    }

    /**
     * @notice decrease total pooled ace by the given amount of ace
     * @param _limiterState limit repr struct
     * @param _aceAmount amount of ace to decrease
     */
    function decreaseAce(
        TokenRebaseLimiterData memory _limiterState,
        uint256 _aceAmount
    ) internal pure {
        if (_limiterState.positiveRebaseLimit == UNLIMITED_REBASE) return;

        if (_aceAmount > _limiterState.currentTotalPooledAce)
            revert NegativeTotalPooledAce();

        _limiterState.currentTotalPooledAce -= _aceAmount;
    }

    /**
     * @dev increase total pooled ace up to the limit and return the consumed value (not exceeding the limit)
     * @param _limiterState limit repr struct
     * @param _aceAmount desired ace addition
     * @return consumedAce appended ace still not exceeding the limit
     */
    function increaseAce(
        TokenRebaseLimiterData memory _limiterState,
        uint256 _aceAmount
    ) internal pure returns (uint256 consumedAce) {
        if (_limiterState.positiveRebaseLimit == UNLIMITED_REBASE)
            return _aceAmount;

        uint256 prevPooledAce = _limiterState.currentTotalPooledAce;
        _limiterState.currentTotalPooledAce += _aceAmount;

        _limiterState.currentTotalPooledAce = Math256.min(
            _limiterState.currentTotalPooledAce,
            _limiterState.maxTotalPooledAce
        );

        assert(_limiterState.currentTotalPooledAce >= prevPooledAce);

        return _limiterState.currentTotalPooledAce - prevPooledAce;
    }

    /**
     * @dev return shares to burn value not exceeding the limit
     * @param _limiterState limit repr struct
     * @return maxSharesToBurn allowed to deduct shares to not exceed the limit
     */
    function getSharesToBurnLimit(
        TokenRebaseLimiterData memory _limiterState
    ) internal pure returns (uint256 maxSharesToBurn) {
        if (_limiterState.positiveRebaseLimit == UNLIMITED_REBASE)
            return _limiterState.preTotalShares;

        if (isLimitReached(_limiterState)) return 0;

        uint256 rebaseLimitPlus1 = _limiterState.positiveRebaseLimit +
            LIMITER_PRECISION_BASE;
        uint256 pooledAceRate = (_limiterState.currentTotalPooledAce *
            LIMITER_PRECISION_BASE) / _limiterState.preTotalPooledAce;

        maxSharesToBurn =
            (_limiterState.preTotalShares *
                (rebaseLimitPlus1 - pooledAceRate)) /
            rebaseLimitPlus1;
    }

    error TooLowTokenRebaseLimit();
    error TooHighTokenRebaseLimit();
    error NegativeTotalPooledAce();
}
