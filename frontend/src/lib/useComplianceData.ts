import { useReadContract } from "wagmi";
import {
  COMPLIANCE_ORACLE_ADDRESS,
  COMPLIANCE_ORACLE_ABI,
  TARGET_CHAIN,
  bytes4ToString,
  getGrade,
} from "./constants";

// --- Types ---

export interface ComplianceReport {
  timestamp: bigint;
  totalReserves: bigint;
  totalSupply: bigint;
  ratioBps: number;
  compliant: boolean;
  proofHash: `0x${string}`;
  stablecoinSymbol: string; // decoded, e.g. "USDC"
  rawSymbol: `0x${string}`; // raw bytes4
  permittedAssetsOnly: boolean;
  noRehypothecation: boolean;
  lastAuditTimestamp: bigint;
  complianceScore: number;
  grade: { label: string; color: string };
}

// --- Raw object type from wagmi ---
interface RawReport {
  timestamp: bigint;
  totalReserves: bigint;
  totalSupply: bigint;
  ratioBps: number;
  compliant: boolean;
  proofHash: `0x${string}`;
  stablecoinSymbol: `0x${string}`;
  permittedAssetsOnly: boolean;
  noRehypothecation: boolean;
  lastAuditTimestamp: bigint;
  complianceScore: number;
}

function parseReport(raw: RawReport): ComplianceReport {
  const score = Number(raw.complianceScore);
  return {
    timestamp: raw.timestamp,
    totalReserves: raw.totalReserves,
    totalSupply: raw.totalSupply,
    ratioBps: Number(raw.ratioBps),
    compliant: raw.compliant,
    proofHash: raw.proofHash,
    rawSymbol: raw.stablecoinSymbol,
    stablecoinSymbol: bytes4ToString(raw.stablecoinSymbol ?? "0x00000000"),
    permittedAssetsOnly: raw.permittedAssetsOnly,
    noRehypothecation: raw.noRehypothecation,
    lastAuditTimestamp: raw.lastAuditTimestamp,
    complianceScore: score,
    grade: getGrade(score),
  };
}

// --- Hooks ---

export function useLatestReport() {
  const { data, isLoading, isError, refetch } = useReadContract({
    address: COMPLIANCE_ORACLE_ADDRESS,
    abi: COMPLIANCE_ORACLE_ABI,
    functionName: "getLatestReport",
    chainId: TARGET_CHAIN.id,
  });

  const report = data ? parseReport(data as unknown as RawReport) : null;

  return { report, isLoading, isError, refetch };
}

export function useReportCount() {
  const { data, isLoading } = useReadContract({
    address: COMPLIANCE_ORACLE_ADDRESS,
    abi: COMPLIANCE_ORACLE_ABI,
    functionName: "getReportCount",
    chainId: TARGET_CHAIN.id,
  });

  return { count: data ? Number(data) : 0, isLoading };
}

export function useReportHistory(count: number) {
  const { count: totalCount } = useReportCount();

  const startIndex = totalCount > count ? totalCount - count : 0;
  const fetchCount = totalCount > count ? count : totalCount;

  const { data, isLoading } = useReadContract({
    address: COMPLIANCE_ORACLE_ADDRESS,
    abi: COMPLIANCE_ORACLE_ABI,
    functionName: "getReports",
    args: [BigInt(startIndex), BigInt(fetchCount)],
    chainId: TARGET_CHAIN.id,
    query: { enabled: totalCount > 0 },
  });

  const reports = data
    ? (data as unknown as RawReport[]).map(parseReport)
    : [];

  return { reports, isLoading };
}
