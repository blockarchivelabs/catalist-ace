// SPDX-FileCopyrightText: 2023 Catalist <info@catalist.fi>
// SPDX-License-Identifier: GPL-3.0

// See contracts/COMPILERS.md
// solhint-disable-next-line
pragma solidity >=0.4.24 <0.9.0;

interface ICatalistLocator {
    function accountingOracle() external view returns (address);
    function depositSecurityModule() external view returns (address);
    function elRewardsVault() external view returns (address);
    function legacyOracle() external view returns (address);
    function catalist() external view returns (address);
    function oracleReportSanityChecker() external view returns (address);
    function burner() external view returns (address);
    function stakingRouter() external view returns (address);
    function treasury() external view returns (address);
    function validatorsExitBusOracle() external view returns (address);
    function withdrawalQueue() external view returns (address);
    function withdrawalVault() external view returns (address);
    function postTokenRebaseReceiver() external view returns (address);
    function oracleDaemonConfig() external view returns (address);
    function coreComponents()
        external
        view
        returns (
            address elRewardsVault,
            address oracleReportSanityChecker,
            address stakingRouter,
            address treasury,
            address withdrawalQueue,
            address withdrawalVault
        );
    function oracleReportComponentsForCatalist()
        external
        view
        returns (
            address accountingOracle,
            address elRewardsVault,
            address oracleReportSanityChecker,
            address burner,
            address withdrawalQueue,
            address withdrawalVault,
            address postTokenRebaseReceiver
        );
}
