// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {ComplianceOracle} from "../src/ComplianceOracle.sol";
import {AlertController} from "../src/AlertController.sol";
import {ZKVerifier} from "../src/ZKVerifier.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy ComplianceOracle (Admin = Deployer)
        ComplianceOracle oracle = new ComplianceOracle(deployer);
        console.log("ComplianceOracle deployed at:", address(oracle));

        // 2. Deploy ZKVerifier
        ZKVerifier verifier = new ZKVerifier();
        console.log("ZKVerifier deployed at:", address(verifier));

        // 3. Deploy AlertController (references oracle only)
        AlertController controller = new AlertController(
            deployer,
            address(oracle)
        );
        console.log("AlertController deployed at:", address(controller));

        // 4. Grant REPORTER_ROLE to deployer (for CRE workflow / testing)
        oracle.grantRole(oracle.REPORTER_ROLE(), deployer);
        console.log("REPORTER_ROLE granted to deployer");

        vm.stopBroadcast();
    }
}
