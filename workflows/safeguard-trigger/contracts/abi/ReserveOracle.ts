import { parseAbi, toEventSelector } from "viem";

// Event Signature for Listener
export const REPORT_UPDATED_SIG = toEventSelector("ReportUpdated(uint256,uint16,bool)");

// ABI for Decoding (Bootcamp Style)
export const REPORT_UPDATED_ABI = parseAbi([
  "event ReportUpdated(uint256 indexed timestamp, uint16 ratioBps, bool compliant)"
]);
