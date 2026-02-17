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
import { decodeEventLog, parseAbi, toEventSelector } from "viem";

type Config = {
  safeguardControllerAddress: string;
  oracleAddress: string;
  webhookUrl: string;
};

import { REPORT_UPDATED_SIG, REPORT_UPDATED_ABI } from "./contracts/abi/ReserveOracle";

const onLogTrigger = (runtime: Runtime<Config>, log: EVMLog): string => {
  const config = runtime.config;
  const httpClient = new HTTPClient();

  runtime.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  runtime.log("CRE Workflow: Log Trigger - Reserve Audit");
  runtime.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // ─────────────────────────────────────────────────────────────
  // Step 1: Decode the event log (Bootcamp Pattern)
  // ─────────────────────────────────────────────────────────────
  
  // Convert topics to hex format for viem
  const topics = log.topics.map((t: Uint8Array) => bytesToHex(t)) as [
    `0x${string}`,
    ...`0x${string}`[]
  ];
  const data = bytesToHex(log.data);

  // Decode the event
  const decodedLog = decodeEventLog({ abi: REPORT_UPDATED_ABI, data, topics });
  
  // Extract values
  const timestamp = decodedLog.args.timestamp as bigint;
  const ratioBps = decodedLog.args.ratioBps as number;
  const compliant = decodedLog.args.compliant as boolean;

  runtime.log(`[Step 1] Oracle Update Detected`);
  runtime.log(`[Step 1] Timestamp: ${timestamp}`);
  runtime.log(`[Step 1] Ratio: ${ratioBps} bps`);
  runtime.log(`[Step 1] Compliant: ${compliant}`);

  // ─────────────────────────────────────────────────────────────
  // Step 2: Conditional Logic (Action)
  // ─────────────────────────────────────────────────────────────
  
  if (!compliant) {
      runtime.log(`[Step 2] ⚠️ COMPLIANCE BREACH DETECTED! Sending Alert...`);
      
      try {
        const sendAlert = httpClient.sendRequest(
          runtime,
          (sender) => {
            const alertPayload = JSON.stringify({
              level: "CRITICAL",
              message: "Stablecoin Depeg / Reserve Breach Detected",
              ratio: ratioBps,
              compliant: compliant,
              txHash: bytesToHex(log.txHash),
              timestamp: new Date().toISOString(),
              source: "StableGuard Log Monitor",
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
        sendAlert().result();
        runtime.log("[Step 2] ✓ Alert sent to webhook.");
      } catch {
        runtime.log("[Step 2] Webhook unavailable (simulation mode).");
      }
      return "breach_alert_sent";
  } else {
      runtime.log(`[Step 2] Reserve is healthy. No action required.`);
      return "healthy";
  }
};

const initWorkflow = (config: Config) => {
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: "ethereum-testnet-sepolia",
    isTestnet: true,
  });

  if (!network) throw new Error("Network not found");

  const evmClient = new cre.capabilities.EVMClient(network.chainSelector.selector);

  return [
    handler(
        evmClient.logTrigger({
            addresses: [config.oracleAddress],
            topics: [{ values: [REPORT_UPDATED_SIG] }],
            confidence: "CONFIDENCE_LEVEL_FINALIZED"
        }), 
        onLogTrigger
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
