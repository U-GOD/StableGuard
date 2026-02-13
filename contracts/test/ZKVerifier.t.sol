// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../src/ZKVerifier.sol";

contract ZKVerifierTest is Test {
    ZKVerifier public verifier;

    event ProofVerified(bytes32 indexed proofHash, bool valid);

    function setUp() public {
        verifier = new ZKVerifier();
    }

    function test_VerifyProof_Stub() public {
        uint256[2] memory a = [uint256(0), uint256(0)];
        uint256[2][2] memory b = [
            [uint256(0), uint256(0)],
            [uint256(0), uint256(0)]
        ];
        uint256[2] memory c = [uint256(0), uint256(0)];
        uint256[] memory input = new uint256[](0);

        vm.expectEmit(false, false, false, true);
        emit ProofVerified(bytes32(0), true);

        bool isValid = verifier.verifyProof(a, b, c, input);
        assertTrue(isValid);
    }
}
