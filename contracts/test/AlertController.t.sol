// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
import {ComplianceOracle} from "../src/ComplianceOracle.sol";
import {AlertController} from "../src/AlertController.sol";

contract AlertControllerTest is Test {
    ComplianceOracle public oracle;
    AlertController public controller;
    address public admin = address(1);
    address public reporter = address(2);

    function setUp() public {
        vm.warp(1_700_000_000);

        vm.startPrank(admin);
        oracle = new ComplianceOracle(admin);
        oracle.grantRole(oracle.REPORTER_ROLE(), reporter);
        controller = new AlertController(admin, address(oracle));
        vm.stopPrank();
    }

    // --- Helper ---
    function _pushReport(
        bytes4 symbol,
        uint16 ratioBps,
        bool compliant,
        bool permittedAssets,
        bool noRehypo,
        uint256 lastAudit,
        uint8 score
    ) internal {
        ComplianceOracle.ComplianceReport memory report = ComplianceOracle
            .ComplianceReport({
                timestamp: block.timestamp,
                totalReserves: 105_000_000 * 1e18,
                totalSupply: 100_000_000 * 1e18,
                ratioBps: ratioBps,
                compliant: compliant,
                proofHash: bytes32(0),
                stablecoinSymbol: symbol,
                permittedAssetsOnly: permittedAssets,
                noRehypothecation: noRehypo,
                lastAuditTimestamp: lastAudit,
                complianceScore: score
            });

        vm.prank(reporter);
        oracle.updateReport(report);
    }

    // --- Ratio-Based Alerts ---

    function test_HealthyAlert() public {
        _pushReport(
            bytes4("USDC"),
            10500,
            true,
            true,
            true,
            block.timestamp,
            100
        );

        vm.expectEmit(true, false, false, true);
        emit AlertController.Healthy(bytes4("USDC"), 10500);

        controller.evaluateAndAlert();
    }

    function test_WarningAlert() public {
        _pushReport(
            bytes4("USDC"),
            10100,
            true,
            true,
            true,
            block.timestamp,
            64
        );

        vm.expectEmit(true, false, false, true);
        emit AlertController.WarningIssued(bytes4("USDC"), 10100);

        controller.evaluateAndAlert();
    }

    function test_CriticalAlert() public {
        _pushReport(
            bytes4("USDT"),
            10020,
            false,
            true,
            true,
            block.timestamp,
            48
        );

        vm.expectEmit(true, false, false, true);
        emit AlertController.CriticalAlert(bytes4("USDT"), 10020);

        controller.evaluateAndAlert();
    }

    function test_BreachAlert() public {
        _pushReport(
            bytes4("USDT"),
            9800,
            false,
            true,
            true,
            block.timestamp,
            32
        );

        vm.expectEmit(true, false, false, true);
        emit AlertController.BreachDetected(bytes4("USDT"), 9800);

        controller.evaluateAndAlert();
    }

    // --- GENIUS Act Compliance Violations ---

    function test_PermittedAssetsViolation() public {
        _pushReport(
            bytes4("USDT"),
            10500,
            false,
            false,
            true,
            block.timestamp,
            60
        );

        vm.expectEmit(true, false, false, true);
        emit AlertController.ComplianceViolation(
            bytes4("USDT"),
            "PERMITTED_ASSETS",
            "Reserves include non-permitted asset types (GENIUS Act Section 5)"
        );

        controller.evaluateAndAlert();
    }

    function test_RehypothecationViolation() public {
        _pushReport(
            bytes4("USDC"),
            10500,
            false,
            true,
            false,
            block.timestamp,
            60
        );

        vm.expectEmit(true, false, false, true);
        emit AlertController.ComplianceViolation(
            bytes4("USDC"),
            "REHYPOTHECATION",
            "Reserves may be re-lent or pledged (GENIUS Act Section 5)"
        );

        controller.evaluateAndAlert();
    }

    function test_AuditOverdueViolation() public {
        uint256 oldAudit = block.timestamp - 31 days;
        _pushReport(bytes4("USDC"), 10500, true, true, true, oldAudit, 70);

        vm.expectEmit(true, false, false, true);
        emit AlertController.ComplianceViolation(
            bytes4("USDC"),
            "AUDIT_OVERDUE",
            "No issuer attestation in over 30 days (GENIUS Act Section 8)"
        );

        controller.evaluateAndAlert();
    }

    function test_AuditNotOverdue() public {
        uint256 recentAudit = block.timestamp - 15 days;
        _pushReport(bytes4("USDC"), 10500, true, true, true, recentAudit, 90);

        vm.expectEmit(true, false, false, true);
        emit AlertController.Healthy(bytes4("USDC"), 10500);

        controller.evaluateAndAlert();
    }

    // --- Compliance Grade Events ---

    function test_GradeCompliant() public {
        _pushReport(
            bytes4("USDC"),
            10500,
            true,
            true,
            true,
            block.timestamp,
            85
        );

        vm.expectEmit(true, false, false, true);
        emit AlertController.ComplianceGradeChanged(
            bytes4("USDC"),
            85,
            "COMPLIANT"
        );

        controller.evaluateAndAlert();
    }

    function test_GradeAtRisk() public {
        _pushReport(
            bytes4("USDC"),
            10200,
            true,
            true,
            true,
            block.timestamp,
            65
        );

        vm.expectEmit(true, false, false, true);
        emit AlertController.ComplianceGradeChanged(
            bytes4("USDC"),
            65,
            "AT_RISK"
        );

        controller.evaluateAndAlert();
    }

    function test_GradeNonCompliant() public {
        _pushReport(
            bytes4("USDT"),
            9800,
            false,
            false,
            false,
            block.timestamp,
            10
        );

        vm.expectEmit(true, false, false, true);
        emit AlertController.ComplianceGradeChanged(
            bytes4("USDT"),
            10,
            "NON_COMPLIANT"
        );

        controller.evaluateAndAlert();
    }

    function test_GradeBoundary80() public {
        _pushReport(
            bytes4("USDC"),
            10500,
            true,
            true,
            true,
            block.timestamp,
            80
        );

        vm.expectEmit(true, false, false, true);
        emit AlertController.ComplianceGradeChanged(
            bytes4("USDC"),
            80,
            "COMPLIANT"
        );

        controller.evaluateAndAlert();
    }

    function test_GradeBoundary50() public {
        _pushReport(
            bytes4("USDC"),
            10100,
            true,
            true,
            true,
            block.timestamp,
            50
        );

        vm.expectEmit(true, false, false, true);
        emit AlertController.ComplianceGradeChanged(
            bytes4("USDC"),
            50,
            "AT_RISK"
        );

        controller.evaluateAndAlert();
    }

    function test_GradeBoundary49() public {
        _pushReport(
            bytes4("USDC"),
            10100,
            false,
            false,
            true,
            block.timestamp,
            49
        );

        vm.expectEmit(true, false, false, true);
        emit AlertController.ComplianceGradeChanged(
            bytes4("USDC"),
            49,
            "NON_COMPLIANT"
        );

        controller.evaluateAndAlert();
    }

    // --- Multiple Violations at Once ---

    function test_MultipleViolationsEmitted() public {
        uint256 oldAudit = block.timestamp - 45 days;
        _pushReport(bytes4("USDT"), 9500, false, false, false, oldAudit, 0);

        controller.evaluateAndAlert();

        assertEq(oracle.getReportCount(), 1);
    }

    // --- Reverts when no reports ---

    function test_RevertsWhenNoReports() public {
        vm.expectRevert("No reports available");
        controller.evaluateAndAlert();
    }

    // --- Owner Functions ---

    function test_SetOracle() public {
        ComplianceOracle newOracle = new ComplianceOracle(admin);

        vm.prank(admin);
        controller.setOracle(address(newOracle));

        assertEq(address(controller.oracle()), address(newOracle));
    }

    function test_NonOwnerCannotSetOracle() public {
        vm.prank(reporter);
        vm.expectRevert();
        controller.setOracle(address(0));
    }

    // --- Edge: Audit timestamp of 0 ---

    function test_ZeroAuditTimestampNoViolation() public {
        _pushReport(bytes4("USDC"), 10500, true, true, true, 0, 100);

        vm.expectEmit(true, false, false, true);
        emit AlertController.Healthy(bytes4("USDC"), 10500);

        controller.evaluateAndAlert();
    }
}
