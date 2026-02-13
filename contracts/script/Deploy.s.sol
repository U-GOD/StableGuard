// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {StableCoin} from "../src/StableCoin.sol";
import {ReserveOracle} from "../src/ReserveOracle.sol";
import {SafeguardController} from "../src/SafeguardController.sol";
import {ZKVerifier} from "../src/ZKVerifier.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy StableCoin (Owner = Deployer initially)
        StableCoin stableCoin = new StableCoin(deployer);
        console.log("StableCoin deployed at:", address(stableCoin));

        // 2. Deploy ReserveOracle (Admin = Deployer)
        ReserveOracle oracle = new ReserveOracle(deployer);
        console.log("ReserveOracle deployed at:", address(oracle));

        // 3. Deploy ZKVerifier
        ZKVerifier verifier = new ZKVerifier();
        console.log("ZKVerifier deployed at:", address(verifier));

        // 4. Deploy SafeguardController
        SafeguardController controller = new SafeguardController(
            deployer,
            address(stableCoin),
            address(oracle)
        );
        console.log("SafeguardController deployed at:", address(controller));

        // 5. Transfer StableCoin ownership to Controller
        stableCoin.transferOwnership(address(controller));
        console.log("StableCoin ownership transferred to SafeguardController");

        // 6. Grant REPORTER_ROLE to deployer (for testing/demo purposes)
        oracle.grantRole(oracle.REPORTER_ROLE(), deployer);
        console.log("REPORTER_ROLE granted to deployer");

        vm.stopBroadcast();
    }
}
