import {
  CronCapability,
  HTTPCapability, // Import HTTPCapability
  HTTPClient,
  handler,
  Runner,
  type Runtime,
  consensusIdenticalAggregation,
  text,
} from "@chainlink/cre-sdk";
import { askGemini, type GeminiConfig } from "./gemini";
import { onHttpTrigger } from "./httpCallback"; // Import the new callback

// Config needs to satisfy GeminiConfig and Workflow Config
type Config = GeminiConfig & {
  schedule: string;
  regulatoryTextUrl: string;
  webhookUrl: string;
};

// Rename original onTrigger to onCronTrigger for clarity
const onCronTrigger = (runtime: Runtime<Config>): string => {
  const config = runtime.config;
  const httpClient = new HTTPClient();

  // 1. Fetch Regulatory Text
  let regText: string;
  try {
    const fetchRegText = httpClient.sendRequest(
      runtime,
      (sender) => {
        const resp = sender.sendRequest({
          url: config.regulatoryTextUrl,
          method: "GET",
        });
        return resp.result();
      },
      consensusIdenticalAggregation()
    );
    // Helper 'text()' decodes the Uint8Array body
    regText = text(fetchRegText());
  } catch {
    regText = "No new regulatory updates available.";
    runtime.log("Regulatory API unavailable (simulation), using fallback.");
  }

  runtime.log(`Fetched regulatory text (${regText.length} chars).`);

  // 2. Ask Gemini (using our new module)
  let analysisResult: string;
  try {
    const geminiResult = askGemini(runtime, regText);
    analysisResult = geminiResult.geminiResponse;
  } catch (e) {
    runtime.log("Gemini module execution failed. " + e);
    analysisResult = JSON.stringify({ requiresAction: false, summary: "AI Module Failed" });
  }

  runtime.log(`AI Analysis complete: ${analysisResult.substring(0, 200)}`);

  // 3. Check if action is required
  let requiresAction = false;
  try {
    // Extract JSON if wrapped in markdown code blocks
    const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      requiresAction = analysis.requiresAction === true;
    }
  } catch {
    runtime.log("Could not parse AI analysis JSON.");
  }

  // 4. Send compliance alert functionality
  if (requiresAction) {
    runtime.log("Action required! Sending compliance alert.");
    try {
       const sendAlert = httpClient.sendRequest(
        runtime,
        (sender) => {
          const alertPayload = JSON.stringify({
            level: "WARNING",
            message: "New Regulatory Compliance Requirement Detected",
            analysis: analysisResult.substring(0, 500),
            timestamp: String(Math.floor(Date.now() / 1000)),
            source: "StableGuard AI Regulatory Parser",
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
    } catch {
      runtime.log("Webhook notification failed.");
    }
  }

  return requiresAction ? "action_required" : "compliant";
};

const initWorkflow = (config: Config) => {
  const cron = new CronCapability();
  const http = new HTTPCapability(); // Initialize HTTP Capability

  return [
    // Trigger 1: Automatic Cron Job
    handler(
        cron.trigger({ schedule: config.schedule }), 
        onCronTrigger
    ),
    // Trigger 2: Manual HTTP Request (for testing/adhoc analysis)
    handler(
        http.trigger({}), // No auth for simulation/local
        onHttpTrigger
    )
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
