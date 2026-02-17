export const STABLECOIN_ADDRESS = "0x646EeB4af654c5dDBF245142Eedc196728FbfB70";
export const RESERVE_ORACLE_ADDRESS = "0xe10bc2a2C464ba43c13135C6C812a78C69bf14B5";
export const ZK_VERIFIER_ADDRESS = "0x2CE16A90fEd3c01257603ae426e9eDCB5B4FC7Bf";
export const SAFEGUARD_CONTROLLER_ADDRESS = "0xA2EA4B31f0E36f18DBd5C21De4f82083d6d64E2d";

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
