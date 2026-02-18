// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ComplianceOracle
 * @notice On-chain oracle that stores GENIUS Act compliance attestations
 *         for real stablecoins (USDC, USDT), pushed by Chainlink CRE workflows.
 */
contract ComplianceOracle is AccessControl {
    bytes32 public constant REPORTER_ROLE = keccak256("REPORTER_ROLE");

    struct ComplianceReport {
        uint256 timestamp;
        uint256 totalReserves;       // Total reserves reported (USD, 18 decimals)
        uint256 totalSupply;         // Total circulating supply (USD, 18 decimals)
        uint16  ratioBps;            // Reserve ratio in basis points (10000 = 100%)
        bool    compliant;           // Overall GENIUS Act compliance
        bytes32 proofHash;           // ZK proof hash (Phase 5)
        bytes4  stablecoinSymbol;    // "USDC" or "USDT" (packed for gas efficiency)
        bool    permittedAssetsOnly; // §5: Reserves held in T-bills, FDIC deposits only
        bool    noRehypothecation;   // §5: Reserves not re-lent or pledged
        uint256 lastAuditTimestamp;  // §8: When issuer last published attestation
    }

    ComplianceReport[] public reports;

    event ReportUpdated(
        uint256 indexed timestamp,
        uint16  ratioBps,
        bool    compliant,
        bytes4  stablecoinSymbol
    );

    constructor(address initialAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(REPORTER_ROLE, initialAdmin);
    }

    /**
     * @notice Pushes a new compliance report. Only callable by REPORTER_ROLE.
     */
    function updateReport(
        ComplianceReport calldata report
    ) external onlyRole(REPORTER_ROLE) {
        reports.push(report);
        emit ReportUpdated(
            report.timestamp,
            report.ratioBps,
            report.compliant,
            report.stablecoinSymbol
        );
    }

    /**
     * @notice Returns the latest report. Reverts if none exist.
     */
    function getLatestReport() external view returns (ComplianceReport memory) {
        require(reports.length > 0, "No reports available");
        return reports[reports.length - 1];
    }

    /**
     * @notice Returns the total number of reports submitted.
     */
    function getReportCount() external view returns (uint256) {
        return reports.length;
    }

    /**
     * @notice Returns a range of reports for dashboard charting.
     */
    function getReports(
        uint256 startIndex,
        uint256 count
    ) external view returns (ComplianceReport[] memory) {
        require(startIndex + count <= reports.length, "Index out of bounds");
        ComplianceReport[] memory result = new ComplianceReport[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = reports[startIndex + i];
        }
        return result;
    }

    /**
     * @notice Returns the latest report for a specific stablecoin.
     * @param symbol The stablecoin symbol (e.g., "USDC" as bytes4).
     */
    function getLatestReportForSymbol(
        bytes4 symbol
    ) external view returns (ComplianceReport memory) {
        for (uint256 i = reports.length; i > 0; i--) {
            if (reports[i - 1].stablecoinSymbol == symbol) {
                return reports[i - 1];
            }
        }
        revert("No reports for this stablecoin");
    }
}
