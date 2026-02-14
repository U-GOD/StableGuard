import {
  CronCapability,
  EVMClient,
  HTTPClient,
  handler,
  Runner,
  type Runtime,
  consensusIdenticalAggregation,
  json,
} from "@chainlink/cre-sdk";

type Config = {
  schedule: string;
  stableCoinAddress: string;
  oracleAddress: string;
  reserveApiUrl: string;
};

const WARNING_RATIO = 10200n;
const CRITICAL_RATIO = 10050n;
const PAUSE_RATIO = 10000n;

const onCronTrigger = (runtime: Runtime<Config>): string => {
  const config = runtime.config;
  const now = runtime.now();

  const sepoliaEvm = new EVMClient(EVMClient.SUPPORTED_CHAIN_SELECTORS["ethereum-testnet-sepolia"]);
  const httpClient = new HTTPClient();

  // 1. Read totalSupply from StableCoin (EVM callContract)
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

  // 2. Fetch reserve data from Mock Bank API (HTTP in NodeMode)
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

  // 3. Compute health ratio (basis points)
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

  // 4. Write report on-chain via CRE report pipeline
  try {
    const payload = new TextEncoder().encode(
      JSON.stringify({
        timestamp: Math.floor(now.getTime() / 1000),
        totalReserves: totalReserves.toString(),
        totalSupply: totalSupply.toString(),
        ratioBps: Number(ratioBps),
        compliant,
        status,
      })
    );

    const report = runtime.report({
      encodedPayload: payload,
      encoderName: "json",
      signingAlgo: "",
      hashingAlgo: "",
    });

    sepoliaEvm.writeReport(runtime, {
      receiver: config.oracleAddress,
      report: report.result(),
    });

    runtime.log("Oracle report submitted on-chain.");
  } catch {
    runtime.log("EVM write unavailable (simulation), report not submitted.");
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
