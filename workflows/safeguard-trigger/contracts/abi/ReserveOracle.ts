import { parseAbi, toEventSelector } from "viem";

// Event Signature for Log Trigger
// Matches: event ReportUpdated(uint256 indexed timestamp, uint16 ratioBps, bool compliant, bytes4 stablecoinSymbol)
export const REPORT_UPDATED_SIG = toEventSelector(
  "ReportUpdated(uint256,uint16,bool,bytes4)"
);

// ABI for Decoding
export const REPORT_UPDATED_ABI = parseAbi([
  "event ReportUpdated(uint256 indexed timestamp, uint16 ratioBps, bool compliant, bytes4 stablecoinSymbol)",
]);
