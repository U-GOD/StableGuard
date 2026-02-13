// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeguardController} from "../src/SafeguardController.sol";
import {StableCoin} from "../src/StableCoin.sol";
import {ReserveOracle} from "../src/ReserveOracle.sol";

contract SafeguardControllerTest is Test {
    SafeguardController public controller;
    StableCoin public stableCoin;
    ReserveOracle public oracle;

    address public admin;
    address public reporter;

    event WarningIssued(uint16 ratioBps);
    event RebalanceRequested(uint256 deficit);
    event EmergencyPause(uint16 ratioBps);
    event Healthy(uint16 ratioBps);

    function setUp() public {
        admin = address(this);
        reporter = address(0x1);

        // 1. Deploy Oracle
        oracle = new ReserveOracle(admin);
        oracle.grantRole(oracle.REPORTER_ROLE(), reporter);

        // 2. Deploy StableCoin (admin owns it initially)
        stableCoin = new StableCoin(admin);

        // 3. Deploy Controller
        controller = new SafeguardController(
            admin,
            address(stableCoin),
            address(oracle)
        );

        // 4. Transfer StableCoin ownership to Controller so it can pause
        stableCoin.transferOwnership(address(controller));
    }

    function test_Evaluate_Healthy() public {
        _mockReport(11000); // 110%

        vm.expectEmit(true, false, false, true);
        emit Healthy(11000);

        controller.evaluateAndAct();
        assertFalse(stableCoin.paused());
    }

    function test_Evaluate_Warning() public {
        _mockReport(10150); // 101.5% (Warning is < 10200)

        vm.expectEmit(true, false, false, true);
        emit WarningIssued(10150);

        controller.evaluateAndAct();
        assertFalse(stableCoin.paused());
    }

    function test_Evaluate_Critical() public {
        _mockReport(10020); // 100.2% (Critical is < 10050)

        vm.expectEmit(true, false, false, true);
        emit RebalanceRequested(0);

        controller.evaluateAndAct();
        assertFalse(stableCoin.paused());
    }

    function test_Evaluate_EmergencyPause() public {
        _mockReport(9900); // 99% (Pause is < 10000)

        vm.expectEmit(true, false, false, true);
        emit EmergencyPause(9900);

        controller.evaluateAndAct();
        assertTrue(stableCoin.paused());
    }

    function test_ManualPauseUnpause() public {
        assertFalse(stableCoin.paused());

        controller.manualPause();
        assertTrue(stableCoin.paused());

        controller.manualUnpause();
        assertFalse(stableCoin.paused());
    }

    function test_ManualPause_RevertIf_NotOwner() public {
        vm.prank(address(0xBad));
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                address(0xBad)
            )
        );
        controller.manualPause();
    }

    function _mockReport(uint16 ratio) internal {
        ReserveOracle.ReserveReport memory report = ReserveOracle
            .ReserveReport({
                timestamp: block.timestamp,
                totalReserves: 0,
                totalSupply: 0,
                ratioBps: ratio,
                compliant: true,
                proofHash: bytes32(0)
            });
        vm.prank(reporter);
        oracle.updateReport(report);
    }
}
