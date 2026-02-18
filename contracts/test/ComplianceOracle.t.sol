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

    // ─── Helper to build a report ───
    function _makeReport(
        bytes4 symbol,
        uint16 ratioBps,
        bool compliant,
        bool permittedAssets,
        bool noRehypo,
        uint256 lastAudit
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
                lastAuditTimestamp: lastAudit
            });
    }

    // ─── Basic Functionality ───

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
            block.timestamp
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
            block.timestamp
        );

        vm.expectEmit(true, false, false, true);
        emit ComplianceOracle.ReportUpdated(
            block.timestamp,
            10500,
            true,
            bytes4("USDC")
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
            block.timestamp
        );

        vm.prank(reporter);
        oracle.updateReport(report);

        ComplianceOracle.ComplianceReport memory latest = oracle
            .getLatestReport();
        assertEq(latest.ratioBps, 10200);
        assertEq(latest.stablecoinSymbol, bytes4("USDT"));
        assertTrue(latest.compliant);
    }

    function test_GetLatestReportRevertsWhenEmpty() public {
        vm.expectRevert("No reports available");
        oracle.getLatestReport();
    }

    // ─── Multi-Token Reports ───

    function test_MultipleStablecoins() public {
        ComplianceOracle.ComplianceReport memory usdcReport = _makeReport(
            bytes4("USDC"),
            10500,
            true,
            true,
            true,
            block.timestamp
        );
        ComplianceOracle.ComplianceReport memory usdtReport = _makeReport(
            bytes4("USDT"),
            9900,
            false,
            false,
            true,
            block.timestamp
        );

        vm.startPrank(reporter);
        oracle.updateReport(usdcReport);
        oracle.updateReport(usdtReport);
        vm.stopPrank();

        assertEq(oracle.getReportCount(), 2);

        // Latest overall is USDT (submitted second)
        ComplianceOracle.ComplianceReport memory latest = oracle
            .getLatestReport();
        assertEq(latest.stablecoinSymbol, bytes4("USDT"));
    }

    function test_GetLatestReportForSymbol() public {
        // Submit USDC, then USDT, then USDC again
        vm.startPrank(reporter);
        oracle.updateReport(
            _makeReport(
                bytes4("USDC"),
                10500,
                true,
                true,
                true,
                block.timestamp
            )
        );
        oracle.updateReport(
            _makeReport(
                bytes4("USDT"),
                10100,
                true,
                true,
                true,
                block.timestamp
            )
        );
        oracle.updateReport(
            _makeReport(
                bytes4("USDC"),
                10400,
                true,
                true,
                true,
                block.timestamp
            )
        );
        vm.stopPrank();

        // Should find the LATEST USDC (third report, ratio 10400)
        ComplianceOracle.ComplianceReport memory usdcLatest = oracle
            .getLatestReportForSymbol(bytes4("USDC"));
        assertEq(usdcLatest.ratioBps, 10400);

        // Should find the only USDT (second report, ratio 10100)
        ComplianceOracle.ComplianceReport memory usdtLatest = oracle
            .getLatestReportForSymbol(bytes4("USDT"));
        assertEq(usdtLatest.ratioBps, 10100);
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
                block.timestamp
            )
        );

        // DAI! has no reports
        vm.expectRevert("No reports for this stablecoin");
        oracle.getLatestReportForSymbol(bytes4("DAI!"));
    }

    // ─── Access Control ───

    function test_UnauthorizedCannotUpdateReport() public {
        ComplianceOracle.ComplianceReport memory report = _makeReport(
            bytes4("USDC"),
            10500,
            true,
            true,
            true,
            block.timestamp
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
            block.timestamp
        );

        vm.prank(newReporter);
        oracle.updateReport(report);

        assertEq(oracle.getReportCount(), 1);
    }

    // ─── Report History (getReports) ───

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
                    block.timestamp
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
        assertEq(batch[1].ratioBps, 10200);
        assertEq(batch[2].ratioBps, 10300);
    }

    function test_GetReportsRevertsOutOfBounds() public {
        vm.expectRevert("Index out of bounds");
        oracle.getReports(0, 1);
    }

    // ─── GENIUS Act Fields ───

    function test_PermittedAssetsFlag() public {
        ComplianceOracle.ComplianceReport memory report = _makeReport(
            bytes4("USDT"),
            10500,
            false,
            false,
            true,
            block.timestamp
        );

        vm.prank(reporter);
        oracle.updateReport(report);

        ComplianceOracle.ComplianceReport memory stored = oracle
            .getLatestReport();
        assertFalse(stored.permittedAssetsOnly);
        assertFalse(stored.compliant);
    }

    function test_RehypothecationFlag() public {
        ComplianceOracle.ComplianceReport memory report = _makeReport(
            bytes4("USDC"),
            10500,
            false,
            true,
            false,
            block.timestamp
        );

        vm.prank(reporter);
        oracle.updateReport(report);

        ComplianceOracle.ComplianceReport memory stored = oracle
            .getLatestReport();
        assertFalse(stored.noRehypothecation);
    }

    function test_AuditTimestamp() public {
        uint256 auditTime = block.timestamp - 15 days;
        ComplianceOracle.ComplianceReport memory report = _makeReport(
            bytes4("USDC"),
            10500,
            true,
            true,
            true,
            auditTime
        );

        vm.prank(reporter);
        oracle.updateReport(report);

        ComplianceOracle.ComplianceReport memory stored = oracle
            .getLatestReport();
        assertEq(stored.lastAuditTimestamp, auditTime);
    }

    // ─── Edge Cases ───

    function test_ZeroRatio() public {
        ComplianceOracle.ComplianceReport memory report = _makeReport(
            bytes4("USDC"),
            0,
            false,
            true,
            true,
            block.timestamp
        );

        vm.prank(reporter);
        oracle.updateReport(report);

        ComplianceOracle.ComplianceReport memory stored = oracle
            .getLatestReport();
        assertEq(stored.ratioBps, 0);
    }

    function test_MaxRatio() public {
        ComplianceOracle.ComplianceReport memory report = _makeReport(
            bytes4("USDC"),
            type(uint16).max,
            true,
            true,
            true,
            block.timestamp
        );

        vm.prank(reporter);
        oracle.updateReport(report);

        ComplianceOracle.ComplianceReport memory stored = oracle
            .getLatestReport();
        assertEq(stored.ratioBps, type(uint16).max);
    }
}
