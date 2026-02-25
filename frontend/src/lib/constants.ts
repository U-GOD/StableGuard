import { sepolia } from "wagmi/chains";

// --- Deployed Contract Addresses (Sepolia) ---

export const COMPLIANCE_ORACLE_ADDRESS = "0xbd4c9697814443851381f50A99768DDE0F9C0597" as const;
export const ALERT_CONTROLLER_ADDRESS = "0x076f94aB28C679E4Ec977634C78AC6491ADc0e48" as const;

// Legacy contracts (for reference)
export const STABLECOIN_ADDRESS = "0x646EeB4af654c5dDBF245142Eedc196728FbfB70" as const;
export const RESERVE_ORACLE_ADDRESS = "0xe10bc2a2C464ba43c13135C6C812a78C69bf14B5" as const;
export const SAFEGUARD_CONTROLLER_ADDRESS = "0xA2EA4B31f0E36f18DBd5C21De4f82083d6d64E2d" as const;

// --- Chain ---
export const TARGET_CHAIN = sepolia;

// --- ComplianceOracle ABI (matches deployed contract) ---
export const COMPLIANCE_ORACLE_ABI = [
  {
    name: "getLatestReport",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "timestamp", type: "uint256" },
          { name: "totalReserves", type: "uint256" },
          { name: "totalSupply", type: "uint256" },
          { name: "ratioBps", type: "uint16" },
          { name: "compliant", type: "bool" },
          { name: "proofHash", type: "bytes32" },
          { name: "stablecoinSymbol", type: "bytes4" },
          { name: "permittedAssetsOnly", type: "bool" },
          { name: "noRehypothecation", type: "bool" },
          { name: "lastAuditTimestamp", type: "uint256" },
          { name: "complianceScore", type: "uint8" },
        ],
      },
    ],
  },
  {
    name: "getReportCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getReports",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "startIndex", type: "uint256" },
      { name: "count", type: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "timestamp", type: "uint256" },
          { name: "totalReserves", type: "uint256" },
          { name: "totalSupply", type: "uint256" },
          { name: "ratioBps", type: "uint16" },
          { name: "compliant", type: "bool" },
          { name: "proofHash", type: "bytes32" },
          { name: "stablecoinSymbol", type: "bytes4" },
          { name: "permittedAssetsOnly", type: "bool" },
          { name: "noRehypothecation", type: "bool" },
          { name: "lastAuditTimestamp", type: "uint256" },
          { name: "complianceScore", type: "uint8" },
        ],
      },
    ],
  },
  {
    name: "getLatestReportForSymbol",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "symbol", type: "bytes4" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "timestamp", type: "uint256" },
          { name: "totalReserves", type: "uint256" },
          { name: "totalSupply", type: "uint256" },
          { name: "ratioBps", type: "uint16" },
          { name: "compliant", type: "bool" },
          { name: "proofHash", type: "bytes32" },
          { name: "stablecoinSymbol", type: "bytes4" },
          { name: "permittedAssetsOnly", type: "bool" },
          { name: "noRehypothecation", type: "bool" },
          { name: "lastAuditTimestamp", type: "uint256" },
          { name: "complianceScore", type: "uint8" },
        ],
      },
    ],
  },
  {
    name: "ReportUpdated",
    type: "event",
    inputs: [
      { name: "timestamp", type: "uint256", indexed: true },
      { name: "ratioBps", type: "uint16", indexed: false },
      { name: "compliant", type: "bool", indexed: false },
      { name: "stablecoinSymbol", type: "bytes4", indexed: false },
      { name: "complianceScore", type: "uint8", indexed: false },
    ],
  },
] as const;

// --- AlertController ABI ---
export const ALERT_CONTROLLER_ABI = [
  {
    name: "evaluateAndAlert",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "Healthy",
    type: "event",
    inputs: [
      { name: "stablecoin", type: "bytes4", indexed: true },
      { name: "ratioBps", type: "uint16", indexed: false },
    ],
  },
  {
    name: "WarningIssued",
    type: "event",
    inputs: [
      { name: "stablecoin", type: "bytes4", indexed: true },
      { name: "ratioBps", type: "uint16", indexed: false },
    ],
  },
  {
    name: "CriticalAlert",
    type: "event",
    inputs: [
      { name: "stablecoin", type: "bytes4", indexed: true },
      { name: "ratioBps", type: "uint16", indexed: false },
    ],
  },
  {
    name: "BreachDetected",
    type: "event",
    inputs: [
      { name: "stablecoin", type: "bytes4", indexed: true },
      { name: "ratioBps", type: "uint16", indexed: false },
    ],
  },
  {
    name: "ComplianceGradeChanged",
    type: "event",
    inputs: [
      { name: "stablecoin", type: "bytes4", indexed: true },
      { name: "score", type: "uint8", indexed: false },
      { name: "grade", type: "string", indexed: false },
    ],
  },
] as const;

// --- Helpers ---

/** Decode a bytes4 hex like "0x55534443" to "USDC" */
export function bytes4ToString(hex: string): string {
  const h = hex.startsWith("0x") ? hex.slice(2) : hex;
  let str = "";
  for (let i = 0; i < h.length; i += 2) {
    const code = parseInt(h.substring(i, i + 2), 16);
    if (code === 0) break;
    str += String.fromCharCode(code);
  }
  return str;
}

/** Get compliance grade string from score */
export function getGrade(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "COMPLIANT", color: "#10B981" };
  if (score >= 50) return { label: "AT RISK", color: "#F59E0B" };
  return { label: "NON-COMPLIANT", color: "#EF4444" };
}

/** Format a bigint wei value to USD string */
export function formatUsd(wei: bigint): string {
  const usd = Number(wei) / 1e18;
  return usd.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

/** Format basis points to percentage string */
export function bpsToPercent(bps: number): string {
  return (bps / 100).toFixed(2) + "%";
}
