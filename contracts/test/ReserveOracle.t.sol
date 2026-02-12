// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../src/ReserveOracle.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";

contract ReserveOracleTest is Test {
    ReserveOracle public oracle;
    address public admin;
    address public reporter;
    address public unauthorized;

    event ReportUpdated(
        uint256 indexed timestamp,
        uint16 ratioBps,
        bool compliant
    );

    function setUp() public {
        admin = address(this);
        reporter = address(0x1);
        unauthorized = address(0x2);

        oracle = new ReserveOracle(admin);
        oracle.grantRole(oracle.REPORTER_ROLE(), reporter);
    }

    function test_InitialState() public {
        assertTrue(oracle.hasRole(oracle.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(oracle.hasRole(oracle.REPORTER_ROLE(), admin)); // Constructor grants to deployer
        assertTrue(oracle.hasRole(oracle.REPORTER_ROLE(), reporter));
        assertEq(oracle.getReportCount(), 0);
    }

    function test_UpdateReport() public {
        ReserveOracle.ReserveReport memory report = ReserveOracle
            .ReserveReport({
                timestamp: block.timestamp,
                totalReserves: 1000 * 10 ** 18,
                totalSupply: 900 * 10 ** 18,
                ratioBps: 11111, // 111.11%
                compliant: true,
                proofHash: bytes32(0)
            });

        vm.prank(reporter);
        vm.expectEmit(true, false, false, true);
        emit ReportUpdated(block.timestamp, 11111, true);

        oracle.updateReport(report);

        assertEq(oracle.getReportCount(), 1);

        ReserveOracle.ReserveReport memory stored = oracle.getLatestReport();
        assertEq(stored.totalReserves, 1000 * 10 ** 18);
        assertEq(stored.ratioBps, 11111);
    }

    function test_UpdateReport_RevertIf_Unauthorized() public {
        ReserveOracle.ReserveReport memory report = ReserveOracle
            .ReserveReport({
                timestamp: block.timestamp,
                totalReserves: 1000,
                totalSupply: 1000,
                ratioBps: 10000,
                compliant: true,
                proofHash: bytes32(0)
            });

        vm.prank(unauthorized);
        vm.expectRevert(); // Expect any revert
        oracle.updateReport(report);
    }
}
