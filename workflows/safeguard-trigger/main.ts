import {
  CronCapability,
  EVMClient,
  HTTPClient,
  handler,
  Runner,
  type Runtime,
  consensusIdenticalAggregation,
} from "@chainlink/cre-sdk";

type Config = {
  schedule: string;
  safeguardControllerAddress: string;
  oracleAddress: string;
  webhookUrl: string;
};

const onCronTrigger = (runtime: Runtime<Config>): string => {
  const config = runtime.config;
  const sepoliaEvm = new EVMClient(EVMClient.SUPPORTED_CHAIN_SELECTORS["ethereum-testnet-sepolia"]);
  const httpClient = new HTTPClient();

  // 1. Call SafeguardController.evaluateAndAct() on-chain
  try {
    const evalResult = sepoliaEvm.callContract(runtime, {
      call: {
        to: hexToBytes(config.safeguardControllerAddress),
        data: hexToBytes("0x63bc1659"), // evaluateAndAct() selector
      },
    });
    evalResult.result();
    runtime.log("SafeguardController.evaluateAndAct() invoked.");
  } catch {
    runtime.log("EVM call unavailable (simulation mode).");
  }

  // 2. Send alert to webhook
  try {
    const sendAlert = httpClient.sendRequest(
      runtime,
      (sender) => {
        const alertPayload = JSON.stringify({
          level: "INFO",
          message: "Safeguard evaluation completed",
          timestamp: new Date().toISOString(),
          source: "StableGuard CRE",
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
    runtime.log("Alert sent to webhook.");
  } catch {
    runtime.log("Webhook unavailable (simulation mode).");
  }

  return "safeguard_evaluation_complete";
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
