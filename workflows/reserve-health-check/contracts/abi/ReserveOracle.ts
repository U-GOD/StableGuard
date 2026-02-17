import { parseAbiParameters } from "viem";

// ABI for ReserveReport struct
// struct ReserveReport { uint256 timestamp; uint256 totalReserves; uint256 totalSupply; uint16 ratioBps; bool compliant; bytes32 proofHash; }
export const UPDATE_REPORT_PARAMS = parseAbiParameters(
  "tuple(uint256 timestamp, uint256 totalReserves, uint256 totalSupply, uint16 ratioBps, bool compliant, bytes32 proofHash)"
);
