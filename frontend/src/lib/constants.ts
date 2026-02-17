export const STABLECOIN_ADDRESS = "0x5cD36F53BebAdd4c1c729b7FE3E36f28426bd17C";
export const RESERVE_ORACLE_ADDRESS = "0xA1b6d8b72448d50e9A2FaD472E6A0c2d887edc8B";
export const ZK_VERIFIER_ADDRESS = "0xf39344899FcA97AF4b9C60E9a21B657647E2F20E";
export const SAFEGUARD_CONTROLLER_ADDRESS = "0x5561Bca9505bF526cC0F8452459547E723E0C75a";

// Minimal ABIs for Frontend Interaction
export const ORACLE_ABI = [
  "function getLatestReport() view returns (tuple(uint256 timestamp, uint256 totalReserves, uint256 totalSupply, uint16 ratioBps, bool compliant, bytes32 proofHash))",
  "event ReportUpdated(uint256 indexed timestamp, uint16 ratioBps, bool compliant)"
];

export const CONTROLLER_ABI = [
  "function evaluateAndAct() external",
  "event WarningIssued(uint16 ratioBps)",
  "event RebalanceRequested(uint256 deficit)",
  "event EmergencyPause()",
  "event Healthy(uint16 ratioBps)"
];

export const STABLECOIN_ABI = [
  "function totalSupply() view returns (uint256)",
  "function paused() view returns (bool)",
  "function balanceOf(address) view returns (uint256)"
];
