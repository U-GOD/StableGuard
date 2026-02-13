// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./StableCoin.sol";
import "./ReserveOracle.sol";

/**
 * @title SafeguardController
 * @notice Automates protective actions (pausing, alerts) based on reserve health reports.
 * @dev This contract should be the `owner` of the StableCoin to execute pauses.
 */
contract SafeguardController is Ownable {
    StableCoin public stableCoin;
    ReserveOracle public oracle;

    // Thresholds (Basis Points: 10000 = 100%)
    uint16 public constant WARNING_RATIO = 10200; // 102%
    uint16 public constant CRITICAL_RATIO = 10050; // 100.5%
    uint16 public constant PAUSE_RATIO = 10000; // 100%

    event WarningIssued(uint16 ratioBps);
    event RebalanceRequested(uint256 deficit);
    event EmergencyPause(uint16 ratioBps);
    event Healthy(uint16 ratioBps);

    constructor(
        address initialOwner,
        address _stableCoin,
        address _oracle
    ) Ownable(initialOwner) {
        stableCoin = StableCoin(_stableCoin);
        oracle = ReserveOracle(_oracle);
    }

    /**
     * @notice Evaluates the latest reserve report and takes action.
     *         Publicly callable to allow automation or manual checking.
     */
    function evaluateAndAct() external {
        ReserveOracle.ReserveReport memory report = oracle.getLatestReport();

        uint16 ratio = report.ratioBps;

        if (ratio < PAUSE_RATIO) {
            if (!stableCoin.paused()) {
                stableCoin.pause();
                emit EmergencyPause(ratio);
            }
        } else if (ratio < CRITICAL_RATIO) {
            uint256 deficit = 0;
            emit RebalanceRequested(deficit);
        } else if (ratio < WARNING_RATIO) {
            emit WarningIssued(ratio);
        } else {
            emit Healthy(ratio);
        }
    }

    /**
     * @notice Manually unpauses the StableCoin. Only owner (human admin).
     */
    function manualUnpause() external onlyOwner {
        stableCoin.unpause();
    }

    /**
     * @notice Manually pauses the StableCoin. Only owner.
     */
    function manualPause() external onlyOwner {
        stableCoin.pause();
    }
}
