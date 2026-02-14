import {
  CronCapability,
  HTTPClient,
  handler,
  Runner,
  type Runtime,
  consensusIdenticalAggregation,
  text,
  json,
} from "@chainlink/cre-sdk";

type Config = {
  schedule: string;
  regulatoryTextUrl: string;
  geminiApiUrl: string;
  webhookUrl: string;
};

const onTrigger = (runtime: Runtime<Config>): string => {
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
    regText = text(fetchRegText());
  } catch {
    regText = "No new regulatory updates available.";
    runtime.log("Regulatory API unavailable (simulation), using fallback.");
  }

  runtime.log(`Fetched regulatory text (${regText.length} chars).`);

  // 2. Send to Gemini API for analysis
  let analysisResult: string;
  try {
    const prompt = JSON.stringify({
      contents: [{
        parts: [{
          text: `Analyze the following stablecoin regulatory update and extract structured data.
Return ONLY valid JSON with this schema:
{
  "restrictions": string[],
  "reportingFrequency": string | null,
  "yieldRules": string | null,
  "requiresAction": boolean,
  "summary": string
}

Regulatory text:
"${regText.substring(0, 2000)}"`
        }]
      }],
      generationConfig: { temperature: 0 }
    });

    const analyzeText = httpClient.sendRequest(
      runtime,
      (sender) => {
        const resp = sender.sendRequest({
          url: config.geminiApiUrl,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: new TextEncoder().encode(prompt),
        });
        return resp.result();
      },
      consensusIdenticalAggregation()
    );

    const geminiData = json(analyzeText()) as any;
    analysisResult = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "No analysis available";
  } catch {
    runtime.log("Gemini API unavailable (simulation), using fallback.");
    analysisResult = JSON.stringify({
      restrictions: [],
      reportingFrequency: null,
      yieldRules: null,
      requiresAction: false,
      summary: "Unable to parse regulatory text at this time."
    });
  }

  runtime.log(`AI Analysis complete: ${analysisResult.substring(0, 200)}`);

  // 3. Check if action is required
  let requiresAction = false;
  try {
    const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      requiresAction = analysis.requiresAction === true;
    }
  } catch {
    runtime.log("Could not parse AI analysis JSON.");
  }

  // 4. Send compliance alert if action required
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
            timestamp: new Date().toISOString(),
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
      sendAlert().result();
    } catch {
      runtime.log("Webhook notification failed (non-critical).");
    }
  }

  return requiresAction ? "action_required" : "compliant";
};

const initWorkflow = (config: Config) => {
  const cron = new CronCapability();
  return [
    handler(cron.trigger({ schedule: config.schedule }), onTrigger),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
