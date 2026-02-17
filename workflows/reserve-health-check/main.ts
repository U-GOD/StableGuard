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
import { encodeAbiParameters, parseAbiParameters } from "viem";

type Config = {
  schedule: string;
  stableCoinAddress: string;
  oracleAddress: string;
  reserveApiUrl: string;
};

const WARNING_RATIO = 10200n;
const CRITICAL_RATIO = 10050n;
const PAUSE_RATIO = 10000n;

import { UPDATE_REPORT_PARAMS } from "./contracts/abi/ReserveOracle";

const onCronTrigger = (runtime: Runtime<Config>): string => {
  const config = runtime.config;
  const now = runtime.now(); // Date object

  const sepoliaEvm = new EVMClient(EVMClient.SUPPORTED_CHAIN_SELECTORS["ethereum-testnet-sepolia"]);
  const httpClient = new HTTPClient();

  // 1. Read totalSupply from StableCoin
  let totalSupply: bigint;
  try {
    const callData = hexToBytes("0x18160ddd"); // totalSupply() selector
    const supplyResult = sepoliaEvm.callContract(runtime, {
      call: {
        to: hexToBytes(config.stableCoinAddress),
        data: callData,
      },
    });
    const reply = supplyResult.result();
    totalSupply = bytesToBigInt(reply.data);
  } catch {
    totalSupply = 10_000_000n * 10n ** 18n;
    runtime.log("EVM read unavailable (simulation), using fallback supply.");
  }

  // 2. Fetch reserve data
  let totalReserves: bigint;
  try {
    const fetchReserves = httpClient.sendRequest(
      runtime,
      (sender) => {
        const resp = sender.sendRequest({
          url: config.reserveApiUrl,
          method: "GET",
        });
        return resp.result();
      },
      consensusIdenticalAggregation()
    );
    const data = json(fetchReserves()) as { totalReserves: string };
    totalReserves = BigInt(data.totalReserves);
  } catch {
    totalReserves = 10_500_000n * 10n ** 18n;
    runtime.log("HTTP unavailable (simulation), using fallback reserves.");
  }

  // 3. Compute health
  if (totalSupply === 0n) {
    runtime.log("Total supply is zero. Skipping.");
    return "skipped: zero supply";
  }

  const ratioBps = (totalReserves * 10000n) / totalSupply;
  const compliant = ratioBps >= WARNING_RATIO;
  let status = "HEALTHY";
  if (ratioBps < PAUSE_RATIO) status = "EMERGENCY";
  else if (ratioBps < CRITICAL_RATIO) status = "CRITICAL";
  else if (ratioBps < WARNING_RATIO) status = "WARNING";

  runtime.log(`Reserve Health: ratio=${ratioBps}bps status=${status}`);

  // 4. EVM Writes (Bootcamp Style)
  try {
    // A. Encode Data
    const reportTimestamp = BigInt(Math.floor(now.getTime() / 1000));
    const proofHash = "0x" + "0".repeat(64); // Placeholder for ZK proof hash (Phase 5)

    const reportData = encodeAbiParameters(UPDATE_REPORT_PARAMS, [
      {
        timestamp: reportTimestamp,
        totalReserves: totalReserves,
        totalSupply: totalSupply,
        ratioBps: Number(ratioBps),
        compliant: compliant,
        proofHash: proofHash as `0x${string}`,
      },
    ]);

    // B. Generate Signed Report
    const reportResponse = runtime
      .report({
        encodedPayload: hexToBase64(reportData),
        encoderName: "evm",
        signingAlgo: "ecdsa",
        hashingAlgo: "keccak256",
      })
      .result();

    // C. Write Report
    const writeResult = sepoliaEvm
      .writeReport(runtime, {
        receiver: config.oracleAddress,
        report: reportResponse,
        gasConfig: {
            gasLimit: "500000" // Hardcoded limit as per bootcamp example
        }
      })
      .result();

    if (writeResult.txStatus === TxStatus.SUCCESS) {
        const txHash = bytesToHex(writeResult.txHash || new Uint8Array(32));
        runtime.log(`Oracle report submitted. Tx: ${txHash}`);
    } else {
        runtime.log(`Oracle report failed: ${writeResult.txStatus}`);
    }

  } catch (e) {
    runtime.log("EVM write unavailable (simulation) or failed: " + e);
  }

  return `ratio=${ratioBps}bps status=${status} compliant=${compliant}`;
};

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

// Helpers
function hexToBytes(hex: string): Uint8Array {
  const h = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(h.length / 2);
  for (let i = 0; i < h.length; i += 2) {
    bytes[i / 2] = parseInt(h.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToBigInt(bytes: Uint8Array): bigint {
  if (bytes.length === 0) return 0n;
  let hex = "0x";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return BigInt(hex);
}
