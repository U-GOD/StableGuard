import {
  cre,
  ok,
  consensusIdenticalAggregation,
  type Runtime,
  type HTTPSendRequester,
} from "@chainlink/cre-sdk";

// Helper Interface for Config
export type GeminiConfig = {
  geminiModel: string;
};

interface GeminiData {
  system_instruction: {
    parts: Array<{ text: string }>;
  };
  tools: Array<{ google_search: object }>;
  contents: Array<{
    parts: Array<{ text: string }>;
  }>;
}

interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  responseId?: string;
}

interface GeminiResponse {
  statusCode: number;
  geminiResponse: string;
  responseId: string;
  rawJsonString: string;
}

const SYSTEM_PROMPT = `
You are a regulatory compliance analyst for stablecoins.
Analyze the provided text and extract structured data.

OUTPUT FORMAT (CRITICAL):
- You MUST respond with a SINGLE JSON object with this exact structure:
  {"restrictions": [], "reportingFrequency": null, "yieldRules": null, "requiresAction": false, "summary": ""}

STRICT RULES:
- Output MUST be valid JSON. No markdown, no backticks, no code fences, no prose.
- Output MUST be MINIFIED (one line).
- "requiresAction": true ONLY if there are new mandatory restrictions or reporting requirements.
`;

const USER_PROMPT = `Analyze this regulatory text for stablecoin compliance implications and return the result as JSON:

Regulatory Text:
`;

export function askGemini(runtime: Runtime<GeminiConfig>, regulatoryText: string): GeminiResponse {
  runtime.log("[Gemini] Querying AI for regulatory analysis...");

  let apiKey = "";
  try {
    const secret = runtime.getSecret({ id: "GEMINI_API_KEY" }).result();
    apiKey = secret.value;
  } catch (e) {
    runtime.log("Failed to retrieve GEMINI_API_KEY secret.");
    return {
      statusCode: 0,
      geminiResponse: JSON.stringify({
        restrictions: [],
        requiresAction: false,
        summary: "Gemini API Key missing (Simulation)"
      }),
      responseId: "",
      rawJsonString: "",
    };
  }

  const httpClient = new cre.capabilities.HTTPClient();

  const result = httpClient
    .sendRequest(
      runtime,
      buildGeminiRequest(regulatoryText, apiKey),
      consensusIdenticalAggregation<GeminiResponse>()
    )(runtime.config)
    .result();

  runtime.log(`[Gemini] Response received: ${result.geminiResponse}`);
  return result;
}

const buildGeminiRequest =
  (text: string, apiKey: string) =>
  (sendRequester: HTTPSendRequester, config: GeminiConfig): GeminiResponse => {
    const requestData: GeminiData = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      tools: [
        {
          google_search: {},
        },
      ],
      contents: [
        {
          parts: [{ text: USER_PROMPT + text.substring(0, 5000) }],
        },
      ],
    };

    const bodyBytes = new TextEncoder().encode(JSON.stringify(requestData));
    const body = Buffer.from(bodyBytes).toString("base64");

    const req = {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent`,
      method: "POST" as const,
      body,
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      cacheSettings: {
        store: true,
        maxAge: "60s",
      },
    };

    const resp = sendRequester.sendRequest(req).result();
    const bodyText = new TextDecoder().decode(resp.body);

    if (!ok(resp)) {
      throw new Error(`Gemini API error: ${resp.statusCode} - ${bodyText}`);
    }

    const apiResponse = JSON.parse(bodyText) as GeminiApiResponse;
    const resultText = apiResponse?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error("Malformed Gemini response: missing text");
    }

    return {
      statusCode: resp.statusCode,
      geminiResponse: resultText,
      responseId: apiResponse.responseId || "",
      rawJsonString: bodyText,
    };
  };
