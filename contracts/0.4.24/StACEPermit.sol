// SPDX-FileCopyrightText: 2023 OpenZeppelin, Lido <info@lido.fi>
// SPDX-License-Identifier: GPL-3.0

/* See contracts/COMPILERS.md */
pragma solidity 0.4.24;

import { UnstructuredStorage } from "@aragon/os/contracts/common/UnstructuredStorage.sol";

import { SignatureUtils } from "../common/lib/SignatureUtils.sol";
import { IEIP712StACE } from "../common/interfaces/IEIP712StACE.sol";

import { StACE } from "./StACE.sol";

/**
 * @dev Interface of the ERC20 Permit extension allowing approvals to be made via signatures, as defined in
 * https://eips.ethereum.org/EIPS/eip-2612[EIP-2612].
 *
 * Adds the {permit} method, which can be used to change an account's ERC20 allowance (see {IERC20-allowance}) by
 * presenting a message signed by the account. By not relying on {IERC20-approve}, the token holder account doesn't
 * need to send a transaction, and thus is not required to hold Ace at all.
 */
interface IERC2612 {
    /**
     * @dev Sets `value` as the allowance of `spender` over ``owner``'s tokens,
     * given ``owner``'s signed approval.
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `deadline` must be a timestamp in the future.
     * - `v`, `r` and `s` must be a valid `secp256k1` signature from `owner`
     * over the EIP712-formatted function arguments.
     * - the signature must use ``owner``'s current nonce (see {nonces}).
     */
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    /**
     * @dev Returns the current nonce for `owner`. This value must be
     * included whenever a signature is generated for {permit}.
     *
     * Every successful call to {permit} increases ``owner``'s nonce by one. This
     * prevents a signature from being used multiple times.
     */
    function nonces(address owner) external view returns (uint256);

    /**
     * @dev Returns the domain separator used in the encoding of the signature for {permit}, as defined by {EIP712}.
     */
    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32);
}

contract StACEPermit is IERC2612, StACE {
    using UnstructuredStorage for bytes32;

    /**
     * @dev Service event for initialization
     */
    event EIP712StACEInitialized(address eip712StACE);

    /**
     * @dev Nonces for ERC-2612 (Permit)
     */
    mapping(address => uint256) internal noncesByAddress;

    /**
     * @dev Storage position used for the EIP712 message utils contract
     *
     * keccak256("catalist.StACEPermit.eip712StACE")
     */
    bytes32 internal constant EIP712_STACE_POSITION =
        keccak256("catalist.StACEPermit.eip712StACE");

    /**
     * @dev Typehash constant for ERC-2612 (Permit)
     *
     * keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)")
     */
    bytes32 internal constant PERMIT_TYPEHASH =
        keccak256(
            "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
        );

    /**
     * @dev Sets `value` as the allowance of `spender` over ``owner``'s tokens,
     * given ``owner``'s signed approval.
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `deadline` must be a timestamp in the future.
     * - `v`, `r` and `s` must be a valid `secp256k1` signature from `owner`
     * over the EIP712-formatted function arguments.
     * - the signature must use ``owner``'s current nonce (see {nonces}).
     */
    function permit(
        address _owner,
        address _spender,
        uint256 _value,
        uint256 _deadline,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external {
        require(block.timestamp <= _deadline, "DEADLINE_EXPIRED");

        bytes32 structHash = keccak256(
            abi.encode(
                PERMIT_TYPEHASH,
                _owner,
                _spender,
                _value,
                _useNonce(_owner),
                _deadline
            )
        );

        bytes32 hash = IEIP712StACE(getEIP712StACE()).hashTypedDataV4(
            address(this),
            structHash
        );

        require(
            SignatureUtils.isValidSignature(_owner, hash, _v, _r, _s),
            "INVALID_SIGNATURE"
        );
        _approve(_owner, _spender, _value);
    }

    /**
     * @dev Returns the current nonce for `owner`. This value must be
     * included whenever a signature is generated for {permit}.
     *
     * Every successful call to {permit} increases ``owner``'s nonce by one. This
     * prevents a signature from being used multiple times.
     */
    function nonces(address owner) external view returns (uint256) {
        return noncesByAddress[owner];
    }

    /**
     * @dev Returns the domain separator used in the encoding of the signature for {permit}, as defined by {EIP712}.
     */
    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return IEIP712StACE(getEIP712StACE()).domainSeparatorV4(address(this));
    }

    /**
     * @dev returns the fields and values that describe the domain separator used by this contract for EIP-712
     * signature.
     *
     * NB: compairing to the full-fledged ERC-5267 version:
     * - `salt` and `extensions` are unused
     * - `flags` is hex"0f" or 01111b
     *
     * @dev using shortened returns to reduce a bytecode size
     */
    function eip712Domain()
        external
        view
        returns (
            string memory name,
            string memory version,
            uint256 chainId,
            address verifyingContract
        )
    {
        return IEIP712StACE(getEIP712StACE()).eip712Domain(address(this));
    }

    /**
     * @dev "Consume a nonce": return the current value and increment.
     */
    function _useNonce(address _owner) internal returns (uint256 current) {
        current = noncesByAddress[_owner];
        noncesByAddress[_owner] = current.add(1);
    }

    /**
     * @dev Initialize EIP712 message utils contract for stACE
     */
    function _initializeEIP712StACE(address _eip712StACE) internal {
        require(_eip712StACE != address(0), "ZERO_EIP712STACE");
        require(getEIP712StACE() == address(0), "EIP712STACE_ALREADY_SET");

        EIP712_STACE_POSITION.setStorageAddress(_eip712StACE);

        emit EIP712StACEInitialized(_eip712StACE);
    }

    /**
     * @dev Get EIP712 message utils contract
     */
    function getEIP712StACE() public view returns (address) {
        return EIP712_STACE_POSITION.getStorageAddress();
    }
}
