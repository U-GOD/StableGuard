import {
  cre,
  getNetwork,
  HTTPClient,
  handler,
  Runner,
  type Runtime,
  consensusIdenticalAggregation,
  type EVMLog,
  bytesToHex,
} from "@chainlink/cre-sdk";

import { decodeEventLog } from "viem";
import { REPORT_UPDATED_ABI, REPORT_UPDATED_SIG } from "./contracts/abi/ReserveOracle";

type Config = {
  alertControllerAddress: string;
  oracleAddress: string;
  webhookUrl: string;
};

const onLogTrigger = (runtime: Runtime<Config>, log: EVMLog): string => {
  const config = runtime.config;
  const httpClient = new HTTPClient();

  runtime.log("====================================================");
  runtime.log("CRE Workflow: Log Trigger - Compliance Alert Monitor");
  runtime.log("====================================================");

  // --- Step 1: Decode the ComplianceOracle ReportUpdated event ---

  const topics = log.topics.map((t: Uint8Array) => bytesToHex(t)) as [
    `0x${string}`,
    ...`0x${string}`[]
  ];
  const data = bytesToHex(log.data);

  const decodedLog = decodeEventLog({ abi: REPORT_UPDATED_ABI, data, topics });

  const timestamp = decodedLog.args.timestamp as bigint;
  const ratioBps = decodedLog.args.ratioBps as number;
  const compliant = decodedLog.args.compliant as boolean;
  const stablecoinSymbol = decodedLog.args.stablecoinSymbol as string;

  // Decode bytes4 symbol to readable string
  const symbolStr = bytes4HexToString(stablecoinSymbol);

  runtime.log(`[Step 1] ComplianceOracle Update Detected`);
  runtime.log(`[Step 1] Stablecoin: ${symbolStr}`);
  runtime.log(`[Step 1] Timestamp: ${timestamp}`);
  runtime.log(`[Step 1] Ratio: ${ratioBps} bps`);
  runtime.log(`[Step 1] GENIUS Act Compliant: ${compliant}`);

  // --- Step 2: Alert if Non-Compliant ---

  if (!compliant) {
    runtime.log(`[Step 2] WARNING: ${symbolStr} COMPLIANCE BREACH! Sending Alert...`);

    try {
      const sendAlert = httpClient.sendRequest(
        runtime,
        (sender) => {
          const alertPayload = JSON.stringify({
            level: ratioBps < 10000 ? "EMERGENCY" : "CRITICAL",
            stablecoin: symbolStr,
            message: `${symbolStr} failed GENIUS Act compliance check`,
            ratio: ratioBps,
            compliant: false,
            txHash: bytesToHex(log.txHash),
            timestamp: String(Math.floor(Date.now() / 1000)),
            source: "StableGuard Compliance Monitor",
          });

          const resp = sender.sendRequest({
            url: config.webhookUrl,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: new TextEncoder().encode(alertPayload),
          });
          return resp.result();
        },
        consensusIdenticalAggregation()
      );
      sendAlert();
      runtime.log(`[Step 2] Alert sent to webhook for ${symbolStr}.`);
    } catch {
      runtime.log("[Step 2] Webhook unavailable (simulation mode).");
    }
    return `breach_alert_sent:${symbolStr}`;
  } else {
    runtime.log(`[Step 2] OK: ${symbolStr} is GENIUS Act compliant. No action needed.`);
    return `compliant:${symbolStr}`;
  }
};

// --- Workflow Setup ---

const initWorkflow = (config: Config) => {
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: "ethereum-testnet-sepolia",
    isTestnet: true,
  });

  if (!network) throw new Error("Network not found");

  const evmClient = new cre.capabilities.EVMClient(
    network.chainSelector.selector
  );

  return [
    handler(
      evmClient.logTrigger({
        addresses: [config.oracleAddress],
        topics: [{ values: [REPORT_UPDATED_SIG] }],
        confidence: "CONFIDENCE_LEVEL_FINALIZED",
      }),
      onLogTrigger
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}

/** Decode a bytes4 hex string like "0x55534443" to "USDC" */
function bytes4HexToString(hex: string): string {
  const h = hex.startsWith("0x") ? hex.slice(2) : hex;
  let str = "";
  for (let i = 0; i < h.length; i += 2) {
    const code = parseInt(h.substring(i, i + 2), 16);
    if (code === 0) break;
    str += String.fromCharCode(code);
  }
  return str;
}
