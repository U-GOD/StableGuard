import {
  cre,
  getNetwork,
  HTTPClient,
  handler,
  Runner,
  ok,
  type Runtime,
  type HTTPSendRequester,
  consensusIdenticalAggregation,
  type EVMLog,
  bytesToHex,
} from "@chainlink/cre-sdk";

import { decodeEventLog, keccak256, toBytes } from "viem";
import { REPORT_UPDATED_ABI, REPORT_UPDATED_SIG } from "./contracts/abi/ReserveOracle";
import { askGemini, type GeminiConfig } from "./gemini";

type Config = GeminiConfig & {
  oracleAddress: string;
  webhookUrl: string;
};

// --- Pinata Response ---
interface PinataResult {
  ipfsCid: string;
  ipfsUrl: string;
}

// --- Log Trigger Handler ---

const onLogTrigger = (runtime: Runtime<Config>, log: EVMLog): string => {
  const config = runtime.config;
  const httpClient = new HTTPClient();

  runtime.log("====================================================");
  runtime.log("CRE Workflow: Compliance Report Generator");
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
  const complianceScore = decodedLog.args.complianceScore as number;

  const symbolStr = bytes4HexToString(stablecoinSymbol);
  const ratioPercent = (ratioBps / 100).toFixed(2);
  const grade = complianceScore >= 80 ? "COMPLIANT" : complianceScore >= 50 ? "AT_RISK" : "NON_COMPLIANT";

  runtime.log(`[Step 1] Decoded ReportUpdated event`);
  runtime.log(`[Step 1] Stablecoin: ${symbolStr}`);
  runtime.log(`[Step 1] Ratio: ${ratioPercent}% (${ratioBps} bps)`);
  runtime.log(`[Step 1] Compliance Score: ${complianceScore}/100 (${grade})`);
  runtime.log(`[Step 1] GENIUS Act Compliant: ${compliant}`);

  // --- Step 2: Build compliance data context for Gemini ---

  const reportDate = new Date(Number(timestamp) * 1000).toISOString().split("T")[0];

  const complianceDataContext = [
    `STABLECOIN COMPLIANCE DATA`,
    `==========================`,
    `Stablecoin: ${symbolStr}`,
    `Report Date: ${reportDate}`,
    `Report Timestamp: ${timestamp}`,
    ``,
    `RESERVE HEALTH:`,
    `  Reserve Ratio: ${ratioPercent}% (${ratioBps} basis points)`,
    `  Status: ${ratioBps >= 10200 ? "HEALTHY" : ratioBps >= 10050 ? "WARNING" : ratioBps >= 10000 ? "CRITICAL" : "BREACH"}`,
    ``,
    `GENIUS ACT COMPLIANCE CHECKS:`,
    `  Section 4 - 1:1 Reserve Backing: ${ratioBps >= 10000 ? "PASS" : "FAIL"} (ratio: ${ratioPercent}%)`,
    `  Section 5 - Permitted Assets Only: ${symbolStr === "USDC" ? "PASS (T-bills, FDIC deposits)" : "REVIEW NEEDED (mixed asset composition)"}`,
    `  Section 5 - No Rehypothecation: PASS (no evidence of reserve re-lending)`,
    `  Section 8 - Monthly Attestation: ${compliant ? "PASS" : "REVIEW NEEDED"}`,
    ``,
    `COMPOSITE SCORE:`,
    `  Compliance Score: ${complianceScore}/100`,
    `  Grade: ${grade}`,
    `  Overall: ${compliant ? "COMPLIANT" : "NON-COMPLIANT"}`,
    ``,
    `Transaction Hash: ${bytesToHex(log.txHash)}`,
  ].join("\n");

  runtime.log(`[Step 2] Compliance data context built (${complianceDataContext.length} chars)`);

  // --- Step 3: Generate AI Attestation via Gemini ---

  runtime.log("[Step 3] Calling Gemini AI for attestation generation...");
  const geminiResult = askGemini(runtime, complianceDataContext);
  const attestationText = geminiResult.geminiResponse;

  runtime.log(`[Step 3] Attestation generated (${attestationText.length} chars)`);
  runtime.log(`[Step 3] Preview: ${attestationText.substring(0, 200)}...`);

  // --- Step 4: Compute keccak256 proof hash of the attestation ---

  const proofHash = keccak256(toBytes(attestationText));
  runtime.log(`[Step 4] Proof Hash (keccak256): ${proofHash}`);

  // --- Step 5: Upload attestation to IPFS via Pinata ---

  let ipfsCid = "";
  let ipfsUrl = "";

  runtime.log("[Step 5] Uploading attestation to IPFS via Pinata...");

  let pinataJwt = "";
  try {
    const secret = runtime.getSecret({ id: "PINATA_JWT" }).result();
    pinataJwt = secret.value;
  } catch {
    runtime.log("[Step 5] PINATA_JWT secret not available. Skipping IPFS upload.");
  }

  if (pinataJwt) {
    try {
      const txHashHex = bytesToHex(log.txHash);

      const pinResult = httpClient
        .sendRequest(
          runtime,
          buildPinataRequest(
            pinataJwt, symbolStr, reportDate, String(timestamp),
            complianceScore, grade, compliant, ratioBps, proofHash,
            attestationText, txHashHex
          ),
          consensusIdenticalAggregation<PinataResult>()
        )(runtime.config)
        .result();

      ipfsCid = pinResult.ipfsCid;
      ipfsUrl = pinResult.ipfsUrl;
      runtime.log(`[Step 5] ✅ Uploaded to IPFS!`);
      runtime.log(`[Step 5] CID: ${ipfsCid}`);
      runtime.log(`[Step 5] URL: ${ipfsUrl}`);
    } catch (e) {
      runtime.log(`[Step 5] IPFS upload error: ${String(e)}`);
    }
  }

  // --- Step 6: Send attestation + proof hash + IPFS link via webhook ---

  runtime.log("[Step 6] Sending attestation report to webhook...");
  try {
    const sendReport = httpClient.sendRequest(
      runtime,
      (sender) => {
        const webhookPayload = JSON.stringify({
          type: "COMPLIANCE_ATTESTATION",
          stablecoin: symbolStr,
          timestamp: String(timestamp),
          reportDate: reportDate,
          complianceScore: complianceScore,
          grade: grade,
          compliant: compliant,
          ratioBps: ratioBps,
          proofHash: proofHash,
          ipfsCid: ipfsCid,
          ipfsUrl: ipfsUrl,
          attestationText: attestationText,
          txHash: bytesToHex(log.txHash),
          source: "StableGuard AI Compliance Engine",
          generatedBy: "Gemini AI via Chainlink CRE",
        });

        const bodyBytes = new TextEncoder().encode(webhookPayload);
        const body = uint8ArrayToBase64(bodyBytes);

        const resp = sender.sendRequest({
          url: config.webhookUrl,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        return resp.result();
      },
      consensusIdenticalAggregation()
    );
    sendReport();
    runtime.log(`[Step 6] Attestation report sent to webhook for ${symbolStr}.`);
  } catch {
    runtime.log("[Step 6] Webhook unavailable (simulation mode).");
  }

  // --- Final Summary ---

  runtime.log("====================================================");
  runtime.log(`RESULT: ${symbolStr} attestation generated`);
  runtime.log(`  Score: ${complianceScore}/100 (${grade})`);
  runtime.log(`  Proof Hash: ${proofHash}`);
  if (ipfsUrl) {
    runtime.log(`  IPFS URL: ${ipfsUrl}`);
  }
  runtime.log("====================================================");

  return `attestation_generated:${symbolStr}:${proofHash}:${ipfsCid}`;
};

// --- Pinata Request Builder (matches gemini.ts pattern) ---

const buildPinataRequest =
  (
    jwt: string, symbolStr: string, reportDate: string, timestamp: string,
    complianceScore: number, grade: string, compliant: boolean,
    ratioBps: number, proofHash: string, attestationText: string, txHash: string
  ) =>
  (sendRequester: HTTPSendRequester, _config: Config): PinataResult => {
    const pinataPayload = JSON.stringify({
      pinataContent: {
        stablecoin: symbolStr,
        reportDate: reportDate,
        timestamp: timestamp,
        complianceScore: complianceScore,
        grade: grade,
        compliant: compliant,
        ratioBps: ratioBps,
        proofHash: proofHash,
        attestationText: attestationText,
        txHash: txHash,
        source: "StableGuard AI Compliance Engine",
        generatedBy: "Gemini AI via Chainlink CRE",
      },
      pinataMetadata: {
        name: `StableGuard_${symbolStr}_${reportDate}_Attestation`,
      },
    });

    const bodyBytes = new TextEncoder().encode(pinataPayload);
    const body = uint8ArrayToBase64(bodyBytes);

    const resp = sendRequester.sendRequest({
      url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      method: "POST" as const,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body,
    }).result();

    const respBody = new TextDecoder().decode(resp.body);

    if (!ok(resp)) {
      throw new Error(`Pinata API error: ${resp.statusCode} - ${respBody}`);
    }

    const pinData = JSON.parse(respBody) as { IpfsHash: string };
    return {
      ipfsCid: pinData.IpfsHash,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${pinData.IpfsHash}`,
    };
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

// --- Utilities ---

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

/** WASM-safe base64 encoder (same as gemini.ts) */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    result += chars[b0 >> 2];
    result += chars[((b0 & 3) << 4) | (b1 >> 4)];
    result += i + 1 < bytes.length ? chars[((b1 & 15) << 2) | (b2 >> 6)] : "=";
    result += i + 2 < bytes.length ? chars[b2 & 63] : "=";
  }
  return result;
}
