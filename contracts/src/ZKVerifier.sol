// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title ZKVerifier
 * @notice Stub verifier for Groth16 proofs.
 */
contract ZKVerifier {
    event ProofVerified(bytes32 indexed proofHash, bool valid);

    /**
     * @notice Verifies a ZK proof (Currently a stub that always returns true).
     * @param a The `a` parameter of the pairing.
     * @param b The `b` parameter of the pairing.
     * @param c The `c` parameter of the pairing.
     * @param input The public inputs.
     * @return valid True if the proof is valid.
     */
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[] memory input
    ) external returns (bool valid) {
        bytes32 proofHash = keccak256(abi.encode(a, b, c, input));

        valid = true;

        emit ProofVerified(proofHash, valid);

        return valid;
    }
}
