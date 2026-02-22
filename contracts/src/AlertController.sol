// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ComplianceOracle} from "./ComplianceOracle.sol";

/**
 * @title AlertController
 * @notice Evaluates compliance reports and emits alert events.
 *         Does NOT pause or control any stablecoin — we only monitor and alert.
 * @dev Reads from ComplianceOracle and categorizes risk levels via events.
 */
contract AlertController is Ownable {
    ComplianceOracle public oracle;

    // Thresholds (Basis Points: 10000 = 100%)
    uint16 public constant WARNING_RATIO = 10200; // 102%
    uint16 public constant CRITICAL_RATIO = 10050; // 100.5%
    uint16 public constant BREACH_RATIO = 10000; // 100% — below this = depeg risk

    // --- Alert Events ---
    event Healthy(bytes4 indexed stablecoin, uint16 ratioBps);
    event WarningIssued(bytes4 indexed stablecoin, uint16 ratioBps);
    event CriticalAlert(bytes4 indexed stablecoin, uint16 ratioBps);
    event BreachDetected(bytes4 indexed stablecoin, uint16 ratioBps);
    event ComplianceViolation(
        bytes4 indexed stablecoin,
        string rule,
        string detail
    );
    event ComplianceGradeChanged(
        bytes4 indexed stablecoin,
        uint8 score,
        string grade
    );

    constructor(address initialOwner, address _oracle) Ownable(initialOwner) {
        oracle = ComplianceOracle(_oracle);
    }

    /**
     * @notice Evaluates the latest compliance report and emits appropriate alerts.
     *         Publicly callable to allow CRE automation or manual checking.
     */
    function evaluateAndAlert() external {
        ComplianceOracle.ComplianceReport memory report = oracle
            .getLatestReport();

        bytes4 symbol = report.stablecoinSymbol;
        uint16 ratio = report.ratioBps;

        // 1. Reserve Ratio Alerts
        if (ratio < BREACH_RATIO) {
            emit BreachDetected(symbol, ratio);
        } else if (ratio < CRITICAL_RATIO) {
            emit CriticalAlert(symbol, ratio);
        } else if (ratio < WARNING_RATIO) {
            emit WarningIssued(symbol, ratio);
        } else {
            emit Healthy(symbol, ratio);
        }

        // 2. GENIUS Act Compliance Checks
        if (!report.permittedAssetsOnly) {
            emit ComplianceViolation(
                symbol,
                "PERMITTED_ASSETS",
                "Reserves include non-permitted asset types (GENIUS Act Section 5)"
            );
        }

        if (!report.noRehypothecation) {
            emit ComplianceViolation(
                symbol,
                "REHYPOTHECATION",
                "Reserves may be re-lent or pledged (GENIUS Act Section 5)"
            );
        }

        // 3. Audit Freshness Check (30 days = 2592000 seconds)
        if (
            report.lastAuditTimestamp > 0 &&
            block.timestamp - report.lastAuditTimestamp > 30 days
        ) {
            emit ComplianceViolation(
                symbol,
                "AUDIT_OVERDUE",
                "No issuer attestation in over 30 days (GENIUS Act Section 8)"
            );
        }

        // 4. Compliance Score Grade
        uint8 score = report.complianceScore;
        if (score >= 80) {
            emit ComplianceGradeChanged(symbol, score, "COMPLIANT");
        } else if (score >= 50) {
            emit ComplianceGradeChanged(symbol, score, "AT_RISK");
        } else {
            emit ComplianceGradeChanged(symbol, score, "NON_COMPLIANT");
        }
    }

    /**
     * @notice Allows the owner to update the oracle reference.
     */
    function setOracle(address _oracle) external onlyOwner {
        oracle = ComplianceOracle(_oracle);
    }
}
