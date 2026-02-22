// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
import {ComplianceOracle} from "../src/ComplianceOracle.sol";

contract ComplianceOracleTest is Test {
    ComplianceOracle public oracle;
    address public admin = address(1);
    address public reporter = address(2);
    address public unauthorized = address(3);

    function setUp() public {
        vm.warp(1_700_000_000);

        vm.startPrank(admin);
        oracle = new ComplianceOracle(admin);
        oracle.grantRole(oracle.REPORTER_ROLE(), reporter);
        vm.stopPrank();
    }

    // --- Helper to build a report ---
    function _makeReport(
        bytes4 symbol,
        uint16 ratioBps,
        bool compliant,
        bool permittedAssets,
        bool noRehypo,
        uint256 lastAudit,
        uint8 score
    ) internal view returns (ComplianceOracle.ComplianceReport memory) {
        return
            ComplianceOracle.ComplianceReport({
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
    }

    // --- Basic Functionality ---

    function test_InitialState() public view {
        assertEq(oracle.getReportCount(), 0);
    }

    function test_UpdateReport() public {
        ComplianceOracle.ComplianceReport memory report = _makeReport(
            bytes4("USDC"),
            10500,
            true,
            true,
            true,
            block.timestamp,
            100
        );

        vm.prank(reporter);
        oracle.updateReport(report);

        assertEq(oracle.getReportCount(), 1);
    }

    function test_UpdateReportEmitsEvent() public {
        ComplianceOracle.ComplianceReport memory report = _makeReport(
            bytes4("USDC"),
            10500,
            true,
            true,
            true,
            block.timestamp,
            95
        );

        vm.expectEmit(true, false, false, true);
        emit ComplianceOracle.ReportUpdated(
            block.timestamp,
            10500,
            true,
            bytes4("USDC"),
            95
        );

        vm.prank(reporter);
        oracle.updateReport(report);
    }

    function test_GetLatestReport() public {
        ComplianceOracle.ComplianceReport memory report = _makeReport(
            bytes4("USDT"),
            10200,
            true,
            true,
            true,
            block.timestamp,
            80
        );

        vm.prank(reporter);
        oracle.updateReport(report);

        ComplianceOracle.ComplianceReport memory latest = oracle
            .getLatestReport();
        assertEq(latest.ratioBps, 10200);
        assertEq(latest.stablecoinSymbol, bytes4("USDT"));
        assertTrue(latest.compliant);
        assertEq(latest.complianceScore, 80);
    }

    function test_GetLatestReportRevertsWhenEmpty() public {
        vm.expectRevert("No reports available");
        oracle.getLatestReport();
    }

    // --- Multi-Token Reports ---

    function test_MultipleStablecoins() public {
        ComplianceOracle.ComplianceReport memory usdcReport = _makeReport(
            bytes4("USDC"),
            10500,
            true,
            true,
            true,
            block.timestamp,
            100
        );
        ComplianceOracle.ComplianceReport memory usdtReport = _makeReport(
            bytes4("USDT"),
            9900,
            false,
            false,
            true,
            block.timestamp,
            20
        );

        vm.startPrank(reporter);
        oracle.updateReport(usdcReport);
        oracle.updateReport(usdtReport);
        vm.stopPrank();

        assertEq(oracle.getReportCount(), 2);

        ComplianceOracle.ComplianceReport memory latest = oracle
            .getLatestReport();
        assertEq(latest.stablecoinSymbol, bytes4("USDT"));
        assertEq(latest.complianceScore, 20);
    }

    function test_GetLatestReportForSymbol() public {
        vm.startPrank(reporter);
        oracle.updateReport(
            _makeReport(
                bytes4("USDC"),
                10500,
                true,
                true,
                true,
                block.timestamp,
                100
            )
        );
        oracle.updateReport(
            _makeReport(
                bytes4("USDT"),
                10100,
                true,
                true,
                true,
                block.timestamp,
                64
            )
        );
        oracle.updateReport(
            _makeReport(
                bytes4("USDC"),
                10400,
                true,
                true,
                true,
                block.timestamp,
                96
            )
        );
        vm.stopPrank();

        ComplianceOracle.ComplianceReport memory usdcLatest = oracle
            .getLatestReportForSymbol(bytes4("USDC"));
        assertEq(usdcLatest.ratioBps, 10400);
        assertEq(usdcLatest.complianceScore, 96);

        ComplianceOracle.ComplianceReport memory usdtLatest = oracle
            .getLatestReportForSymbol(bytes4("USDT"));
        assertEq(usdtLatest.ratioBps, 10100);
        assertEq(usdtLatest.complianceScore, 64);
    }

    function test_GetLatestReportForSymbolRevertsWhenNone() public {
        vm.prank(reporter);
        oracle.updateReport(
            _makeReport(
                bytes4("USDC"),
                10500,
                true,
                true,
                true,
                block.timestamp,
                100
            )
        );

        vm.expectRevert("No reports for this stablecoin");
        oracle.getLatestReportForSymbol(bytes4("DAI!"));
    }

    // --- Access Control ---

    function test_UnauthorizedCannotUpdateReport() public {
        ComplianceOracle.ComplianceReport memory report = _makeReport(
            bytes4("USDC"),
            10500,
            true,
            true,
            true,
            block.timestamp,
            100
        );

        vm.expectRevert();
        vm.prank(unauthorized);
        oracle.updateReport(report);
    }

    function test_AdminCanGrantReporterRole() public {
        address newReporter = address(4);

        vm.startPrank(admin);
        oracle.grantRole(oracle.REPORTER_ROLE(), newReporter);
        vm.stopPrank();

        ComplianceOracle.ComplianceReport memory report = _makeReport(
            bytes4("USDC"),
            10500,
            true,
            true,
            true,
            block.timestamp,
            100
        );

        vm.prank(newReporter);
        oracle.updateReport(report);

        assertEq(oracle.getReportCount(), 1);
    }

    // --- Report History ---

    function test_GetReports() public {
        vm.startPrank(reporter);
        for (uint256 i = 0; i < 5; i++) {
            oracle.updateReport(
                _makeReport(
                    bytes4("USDC"),
                    uint16(10000 + i * 100),
                    true,
                    true,
                    true,
                    block.timestamp,
                    uint8(60 + i * 10)
                )
            );
        }
        vm.stopPrank();

        ComplianceOracle.ComplianceReport[] memory batch = oracle.getReports(
            1,
            3
        );
        assertEq(batch.length, 3);
        assertEq(batch[0].ratioBps, 10100);
        assertEq(batch[0].complianceScore, 70);
        assertEq(batch[2].complianceScore, 90);
    }

    function test_GetReportsRevertsOutOfBounds() public {
        vm.expectRevert("Index out of bounds");
        oracle.getReports(0, 1);
    }

    // --- GENIUS Act Fields ---

    function test_PermittedAssetsFlag() public {
        ComplianceOracle.ComplianceReport memory report = _makeReport(
            bytes4("USDT"),
            10500,
            false,
            false,
            true,
            block.timestamp,
            40
        );

        vm.prank(reporter);
        oracle.updateReport(report);

        ComplianceOracle.ComplianceReport memory stored = oracle
            .getLatestReport();
        assertFalse(stored.permittedAssetsOnly);
        assertFalse(stored.compliant);
        assertEq(stored.complianceScore, 40);
    }

    function test_RehypothecationFlag() public {
        ComplianceOracle.ComplianceReport memory report = _makeReport(
            bytes4("USDC"),
            10500,
            false,
            true,
            false,
            block.timestamp,
            60
        );

        vm.prank(reporter);
        oracle.updateReport(report);

        ComplianceOracle.ComplianceReport memory stored = oracle
            .getLatestReport();
        assertFalse(stored.noRehypothecation);
        assertEq(stored.complianceScore, 60);
    }

    function test_AuditTimestamp() public {
        uint256 auditTime = block.timestamp - 15 days;
        ComplianceOracle.ComplianceReport memory report = _makeReport(
            bytes4("USDC"),
            10500,
            true,
            true,
            true,
            auditTime,
            90
        );

        vm.prank(reporter);
        oracle.updateReport(report);

        ComplianceOracle.ComplianceReport memory stored = oracle
            .getLatestReport();
        assertEq(stored.lastAuditTimestamp, auditTime);
        assertEq(stored.complianceScore, 90);
    }

    // --- Score Boundary Tests ---

    function test_ScoreZero() public {
        ComplianceOracle.ComplianceReport memory report = _makeReport(
            bytes4("USDC"),
            9500,
            false,
            false,
            false,
            block.timestamp,
            0
        );

        vm.prank(reporter);
        oracle.updateReport(report);

        assertEq(oracle.getLatestReport().complianceScore, 0);
    }

    function test_ScoreMax() public {
        ComplianceOracle.ComplianceReport memory report = _makeReport(
            bytes4("USDC"),
            10500,
            true,
            true,
            true,
            block.timestamp,
            100
        );

        vm.prank(reporter);
        oracle.updateReport(report);

        assertEq(oracle.getLatestReport().complianceScore, 100);
    }

    function test_ScoreAtRiskBoundary() public {
        // Score of 50 = AT_RISK threshold
        ComplianceOracle.ComplianceReport memory report = _makeReport(
            bytes4("USDC"),
            10200,
            true,
            true,
            false,
            block.timestamp,
            50
        );

        vm.prank(reporter);
        oracle.updateReport(report);

        assertEq(oracle.getLatestReport().complianceScore, 50);
    }

    // --- Edge Cases ---

    function test_ZeroRatio() public {
        ComplianceOracle.ComplianceReport memory report = _makeReport(
            bytes4("USDC"),
            0,
            false,
            true,
            true,
            block.timestamp,
            0
        );

        vm.prank(reporter);
        oracle.updateReport(report);

        assertEq(oracle.getLatestReport().ratioBps, 0);
    }

    function test_MaxRatio() public {
        ComplianceOracle.ComplianceReport memory report = _makeReport(
            bytes4("USDC"),
            type(uint16).max,
            true,
            true,
            true,
            block.timestamp,
            100
        );

        vm.prank(reporter);
        oracle.updateReport(report);

        assertEq(oracle.getLatestReport().ratioBps, type(uint16).max);
    }
}
