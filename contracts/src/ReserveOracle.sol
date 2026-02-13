// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ReserveOracle
 * @notice Stores reserve health reports pushed by the Chainlink CRE workflow.
 */
contract ReserveOracle is AccessControl {
    bytes32 public constant REPORTER_ROLE = keccak256("REPORTER_ROLE");

    struct ReserveReport {
        uint256 timestamp;
        uint256 totalReserves;
        uint256 totalSupply;
        uint16 ratioBps;
        bool compliant;
        bytes32 proofHash;
    }

    ReserveReport[] public reports;

    event ReportUpdated(
        uint256 indexed timestamp,
        uint16 ratioBps,
        bool compliant
    );

    constructor(address initialAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(REPORTER_ROLE, initialAdmin); // Grant to deployer for valid testing
    }

    /**
     * @notice Pushes a new reserve report. Only callable by addresses with REPORTER_ROLE.
     * @param report The new report data.
     */
    function updateReport(
        ReserveReport calldata report
    ) external onlyRole(REPORTER_ROLE) {
        reports.push(report);
        emit ReportUpdated(report.timestamp, report.ratioBps, report.compliant);
    }

    /**
     * @notice Returns the latest report. Reverts if no reports exist.
     */
    function getLatestReport() external view returns (ReserveReport memory) {
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
     * @param startIndex The starting index.
     * @param count The number of reports to return.
     */
    function getReports(
        uint256 startIndex,
        uint256 count
    ) external view returns (ReserveReport[] memory) {
        require(startIndex + count <= reports.length, "Index out of bounds");
        ReserveReport[] memory result = new ReserveReport[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = reports[startIndex + i];
        }
        return result;
    }
}
