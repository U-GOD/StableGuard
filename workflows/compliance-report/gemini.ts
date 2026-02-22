import {
  cre,
  ok,
  consensusIdenticalAggregation,
  type Runtime,
  type HTTPSendRequester,
} from "@chainlink/cre-sdk";

// --- Config Interface ---
export type GeminiConfig = {
  geminiModel: string;
};

// --- Response Types ---
interface GeminiData {
  system_instruction: {
    parts: Array<{ text: string }>;
  };
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

// --- Compliance Attestation Prompt ---

const SYSTEM_PROMPT = `
You are a stablecoin compliance auditor generating formal GENIUS Act attestation reports.
You produce professional, concise compliance attestation documents.

STRICT RULES:
- Output MUST be plain text (no markdown, no code fences).
- Reference specific GENIUS Act sections (4, 5, 8) for each check.
- State PASS or FAIL for each compliance check with a one-line explanation.
- Include the compliance score and grade.
- Keep the report under 500 words.
- Do NOT invent facts. Use only the data provided.
- End with a formal attestation statement.
`;

// --- Public API ---

export function askGemini(runtime: Runtime<GeminiConfig>, complianceData: string): GeminiResponse {
  runtime.log("[Gemini] Generating compliance attestation report...");

  let apiKey = "";
  try {
    const secret = runtime.getSecret({ id: "GEMINI_API_KEY" }).result();
    apiKey = secret.value;
  } catch (e) {
    runtime.log("[Gemini] Failed to retrieve GEMINI_API_KEY secret.");
    return {
      statusCode: 0,
      geminiResponse: `COMPLIANCE ATTESTATION - SIMULATION MODE\n\nGemini API Key not available. This is a simulated attestation.\nIn production, this would contain a full GENIUS Act compliance report.\n\nData provided:\n${complianceData}\n\nStatus: SIMULATION - No attestation generated.`,
      responseId: "simulation",
      rawJsonString: "",
    };
  }

  const httpClient = new cre.capabilities.HTTPClient();

  const result = httpClient
    .sendRequest(
      runtime,
      buildGeminiRequest(complianceData, apiKey),
      consensusIdenticalAggregation<GeminiResponse>()
    )(runtime.config)
    .result();

  runtime.log(`[Gemini] Attestation generated (${result.geminiResponse.length} chars)`);
  return result;
}

// --- Request Builder ---

const buildGeminiRequest =
  (complianceData: string, apiKey: string) =>
  (sendRequester: HTTPSendRequester, config: GeminiConfig): GeminiResponse => {
    const userPrompt = `Generate a formal GENIUS Act compliance attestation report based on the following on-chain data:\n\n${complianceData}\n\nProduce the attestation now.`;

    const requestData: GeminiData = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          parts: [{ text: userPrompt }],
        },
      ],
    };

    const bodyBytes = new TextEncoder().encode(JSON.stringify(requestData));
    const body = uint8ArrayToBase64(bodyBytes);

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

// --- WASM-safe base64 encoder ---

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
