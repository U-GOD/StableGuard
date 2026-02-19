import {
  CronCapability,
  EVMClient,
  HTTPClient,
  handler,
  Runner,
  type Runtime,
  consensusIdenticalAggregation,
  json,
  hexToBase64,
  TxStatus,
  bytesToHex,
} from "@chainlink/cre-sdk";
import { encodeAbiParameters } from "viem";

type Config = {
  schedule: string;
  oracleAddress: string;
  usdcSepoliaAddress: string;
  defillamaUsdcEndpoint: string;
  defillamaUsdtEndpoint: string;
};

// GENIUS Act compliance thresholds (basis points: 10000 = 100%)
const WARNING_RATIO = 10200n;  // 102% — early warning
const CRITICAL_RATIO = 10050n; // 100.5% — critical
const BREACH_RATIO = 10000n;   // 100% — breach / depeg risk

// --- Main Workflow Handler ---

const onCronTrigger = (runtime: Runtime<Config>): string => {
  const config = runtime.config;
  const now = runtime.now();

  const sepoliaEvm = new EVMClient(
    EVMClient.SUPPORTED_CHAIN_SELECTORS["ethereum-testnet-sepolia"]
  );
  const httpClient = new HTTPClient();

  // -----------------------------------------------
  // Step 1: Fetch USDC Reserve Data (DeFiLlama)
  // -----------------------------------------------
  runtime.log("=== StableGuard Compliance Check ===");

  const usdcData = fetchStablecoinData(runtime, httpClient, config.defillamaUsdcEndpoint, "USDC");
  const usdtData = fetchStablecoinData(runtime, httpClient, config.defillamaUsdtEndpoint, "USDT");

  // -----------------------------------------------
  // Step 2: Read real USDC totalSupply on Sepolia
  // -----------------------------------------------
  let usdcOnChainSupply: bigint;
  try {
    const supplyResult = sepoliaEvm.callContract(runtime, {
      call: {
        to: config.usdcSepoliaAddress as `0x${string}`,
        data: "0x18160ddd", // totalSupply() selector
      },
    });
    const reply = supplyResult.result();
    usdcOnChainSupply = bytesToBigInt(reply.data);
    runtime.log(`[EVM Read] USDC Sepolia totalSupply: ${usdcOnChainSupply}`);
  } catch {
    usdcOnChainSupply = 0n;
    runtime.log("[EVM Read] Sepolia USDC read failed (simulation mode).");
  }

  // -----------------------------------------------
  // Step 3: Compute Compliance for Each Stablecoin
  // -----------------------------------------------
  const reportTimestamp = BigInt(Math.floor(now.getTime() / 1000));
  const proofHash = ("0x" + "0".repeat(64)) as `0x${string}`;

  // Process USDC
  const usdcReport = computeComplianceReport(
    runtime, usdcData, "USDC", reportTimestamp, proofHash
  );

  // Process USDT
  const usdtReport = computeComplianceReport(
    runtime, usdtData, "USDT", reportTimestamp, proofHash
  );

  // -----------------------------------------------
  // Step 4: Write Reports On-Chain
  // -----------------------------------------------
  writeReportOnChain(runtime, sepoliaEvm, config.oracleAddress, usdcReport);
  writeReportOnChain(runtime, sepoliaEvm, config.oracleAddress, usdtReport);

  const summary = `USDC: ${usdcReport.status} (${usdcReport.ratioBps}bps) | USDT: ${usdtReport.status} (${usdtReport.ratioBps}bps)`;
  runtime.log(`=== Result: ${summary} ===`);
  return summary;
};

// --- Helpers ---

interface StablecoinData {
  totalReserves: bigint;
  totalSupply: bigint;
  permittedAssetsOnly: boolean;
  noRehypothecation: boolean;
  lastAuditTimestamp: bigint;
}

interface ComplianceResult {
  ratioBps: number;
  status: string;
  compliant: boolean;
  encodedReport: `0x${string}`;
}

/**
 * Fetches stablecoin data from DeFiLlama and derives GENIUS Act compliance flags.
 */
function fetchStablecoinData(
  runtime: Runtime<Config>,
  httpClient: HTTPClient,
  endpoint: string,
  symbol: string
): StablecoinData {
  try {
    const fetchResult = httpClient.sendRequest(
      runtime,
      (sender) => {
        const resp = sender.sendRequest({ url: endpoint, method: "GET" });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return resp.result() as any;
      },
      consensusIdenticalAggregation()
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = json(fetchResult()) as any;

    // DeFiLlama returns { circulating: { peggedUSD: N }, ... }
    const circulatingUsd = body?.circulating?.peggedUSD ?? 0;
    const totalSupply = BigInt(Math.floor(circulatingUsd)) * 10n ** 18n;

    // For reserves, DeFiLlama doesn't separate reserves from supply
    // In a production system, we'd use Circle/Tether transparency APIs
    // For now: reserves = circulating (1:1 assumption, adjusted by compliance flags)
    const totalReserves = totalSupply;

    // GENIUS Act Compliance Flags
    // These are derived from known issuer transparency data:
    // - USDC (Circle): Publicly attests reserves in T-bills + FDIC deposits → compliant
    // - USDT (Tether): Has historically held commercial paper, crypto → often non-compliant
    const permittedAssetsOnly = symbol === "USDC"; // Circle uses only permitted assets
    const noRehypothecation = true; // Neither issuer publicly admits to rehypothecation

    // Last audit timestamps (Circle publishes monthly, Tether is less regular)
    // In production this would be fetched from Circle's API / Tether's transparency page
    const now = Math.floor(Date.now() / 1000);
    const lastAuditTimestamp = symbol === "USDC"
      ? BigInt(now - 15 * 86400) // Circle: ~15 days ago (monthly attestation)
      : BigInt(now - 45 * 86400); // Tether: ~45 days ago (less frequent)

    runtime.log(`[HTTP] ${symbol}: supply=$${circulatingUsd.toLocaleString()}, permittedAssets=${permittedAssetsOnly}`);

    return { totalReserves, totalSupply, permittedAssetsOnly, noRehypothecation, lastAuditTimestamp };
  } catch (e) {
    runtime.log(`[HTTP] ${symbol} fetch failed: ${e}. Using fallback.`);
    const fallback = symbol === "USDC" ? 45_000_000_000n : 140_000_000_000n;
    return {
      totalReserves: fallback * 10n ** 18n,
      totalSupply: fallback * 10n ** 18n,
      permittedAssetsOnly: symbol === "USDC",
      noRehypothecation: true,
      lastAuditTimestamp: 0n,
    };
  }
}

/**
 * Computes compliance status and encodes the report for on-chain submission.
 */
function computeComplianceReport(
  runtime: Runtime<Config>,
  data: StablecoinData,
  symbol: string,
  timestamp: bigint,
  proofHash: `0x${string}`
): ComplianceResult {
  if (data.totalSupply === 0n) {
    runtime.log(`[Compute] ${symbol}: zero supply, skipping.`);
    return { ratioBps: 0, status: "SKIPPED", compliant: false, encodedReport: "0x" as `0x${string}` };
  }

  const ratioBps = Number((data.totalReserves * 10000n) / data.totalSupply);

  // Reserve ratio status
  let status = "HEALTHY";
  if (ratioBps < Number(BREACH_RATIO)) status = "BREACH";
  else if (ratioBps < Number(CRITICAL_RATIO)) status = "CRITICAL";
  else if (ratioBps < Number(WARNING_RATIO)) status = "WARNING";

  // Overall GENIUS Act compliance: ratio OK + all flags pass + audit not overdue
  const auditOverdue = data.lastAuditTimestamp > 0n &&
    (timestamp - data.lastAuditTimestamp > 30n * 86400n);
  const compliant = ratioBps >= Number(WARNING_RATIO) &&
    data.permittedAssetsOnly &&
    data.noRehypothecation &&
    !auditOverdue;

  runtime.log(`[Compute] ${symbol}: ratio=${ratioBps}bps status=${status} compliant=${compliant}`);

  if (!data.permittedAssetsOnly) runtime.log(`  WARNING: ${symbol}: Non-permitted asset types in reserves`);
  if (!data.noRehypothecation) runtime.log(`  WARNING: ${symbol}: Possible rehypothecation detected`);
  if (auditOverdue) runtime.log(`  WARNING: ${symbol}: Audit overdue (>30 days)`);

  // Encode for on-chain submission
  // Symbol as bytes4: "USDC" → 0x55534443, "USDT" → 0x55534454
  const symbolBytes = stringToBytes4Hex(symbol);

  // Use raw ABI type definition — parseAbiParameters can't handle complex tuples in abitype@1.0.8
  const encodedReport = encodeAbiParameters(
    [
      {
        type: 'tuple',
        components: [
          { type: 'uint256', name: 'timestamp' },
          { type: 'uint256', name: 'totalReserves' },
          { type: 'uint256', name: 'totalSupply' },
          { type: 'uint16', name: 'ratioBps' },
          { type: 'bool', name: 'compliant' },
          { type: 'bytes32', name: 'proofHash' },
          { type: 'bytes4', name: 'stablecoinSymbol' },
          { type: 'bool', name: 'permittedAssetsOnly' },
          { type: 'bool', name: 'noRehypothecation' },
          { type: 'uint256', name: 'lastAuditTimestamp' },
        ],
      },
    ] as const,
    [
      {
        timestamp,
        totalReserves: data.totalReserves,
        totalSupply: data.totalSupply,
        ratioBps,
        compliant,
        proofHash,
        stablecoinSymbol: symbolBytes,
        permittedAssetsOnly: data.permittedAssetsOnly,
        noRehypothecation: data.noRehypothecation,
        lastAuditTimestamp: data.lastAuditTimestamp,
      },
    ]
  );

  return { ratioBps, status, compliant, encodedReport };
}

/**
 * Writes a compliance report to the ComplianceOracle on Sepolia.
 */
function writeReportOnChain(
  runtime: Runtime<Config>,
  evm: EVMClient,
  oracleAddress: string,
  report: ComplianceResult
): void {
  if (report.status === "SKIPPED") return;

  try {
    const reportResponse = runtime
      .report({
        encodedPayload: hexToBase64(report.encodedReport),
        encoderName: "evm",
        signingAlgo: "ecdsa",
        hashingAlgo: "keccak256",
      })
      .result();

    const writeResult = evm
      .writeReport(runtime, {
        receiver: oracleAddress,
        report: reportResponse,
        gasConfig: { gasLimit: "500000" },
      })
      .result();

    if (writeResult.txStatus === TxStatus.SUCCESS) {
      const txHash = bytesToHex(writeResult.txHash || new Uint8Array(32));
      runtime.log(`[EVM Write] Report submitted. Tx: ${txHash}`);
    } else {
      runtime.log(`[EVM Write] Report failed: ${writeResult.txStatus}`);
    }
  } catch (e) {
    runtime.log(`[EVM Write] Unavailable (simulation): ${e}`);
  }
}

// --- Workflow Setup ---

const initWorkflow = (config: Config) => {
  const cron = new CronCapability();
  return [
    handler(cron.trigger({ schedule: config.schedule }), onCronTrigger),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}

// --- Utility Functions ---

function bytesToBigInt(bytes: Uint8Array): bigint {
  if (bytes.length === 0) return 0n;
  let hex = "0x";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return BigInt(hex);
}

/** Convert a string like "USDC" to bytes4 hex: "0x55534443" */
function stringToBytes4Hex(str: string): `0x${string}` {
  const padded = str.padEnd(4, "\0");
  let hex = "0x";
  for (let i = 0; i < 4; i++) {
    hex += padded.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return hex as `0x${string}`;
}
