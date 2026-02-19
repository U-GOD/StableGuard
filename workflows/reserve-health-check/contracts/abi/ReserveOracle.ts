import { parseAbiParameters, parseAbi, toEventSelector } from "viem";

// ─── ComplianceOracle ABI ───

// ComplianceReport struct for encoding
// Matches: struct ComplianceReport { uint256 timestamp; uint256 totalReserves; uint256 totalSupply;
//   uint16 ratioBps; bool compliant; bytes32 proofHash; bytes4 stablecoinSymbol;
//   bool permittedAssetsOnly; bool noRehypothecation; uint256 lastAuditTimestamp; }
export const COMPLIANCE_REPORT_PARAMS = parseAbiParameters(
  "tuple(uint256 timestamp, uint256 totalReserves, uint256 totalSupply, uint16 ratioBps, bool compliant, bytes32 proofHash, bytes4 stablecoinSymbol, bool permittedAssetsOnly, bool noRehypothecation, uint256 lastAuditTimestamp)"
);

// Event: ReportUpdated(uint256 indexed timestamp, uint16 ratioBps, bool compliant, bytes4 stablecoinSymbol)
export const REPORT_UPDATED_SIG = toEventSelector(
  "ReportUpdated(uint256,uint16,bool,bytes4)"
);

export const REPORT_UPDATED_ABI = parseAbi([
  "event ReportUpdated(uint256 indexed timestamp, uint16 ratioBps, bool compliant, bytes4 stablecoinSymbol)",
]);
