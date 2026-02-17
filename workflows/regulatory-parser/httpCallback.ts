import {
    cre,
    type Runtime,
    type HTTPPayload,
    decodeJson,
} from "@chainlink/cre-sdk";
import { askGemini, type GeminiConfig } from "./gemini";

// Simple interface for HTTP payload
interface ParseRegulatoryPayload {
    text: string;
}

// Re-using the config type from main/gemini
type Config = GeminiConfig & {

};

export function onHttpTrigger(runtime: Runtime<Config>, payload: HTTPPayload): string {
    runtime.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    runtime.log("CRE Workflow: HTTP Trigger - Manual Regulatory Parse");
    runtime.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Step 1: Parse and validate the incoming payload
    if (!payload.input || payload.input.length === 0) {
        runtime.log("[ERROR] Empty request payload");
        return "Error: Empty request";
    }

    let inputData: ParseRegulatoryPayload;
    try {
        inputData = decodeJson(payload.input) as ParseRegulatoryPayload;
    } catch {
        runtime.log("[ERROR] Failed to decode JSON");
        return "Error: Invalid JSON";
    }

    runtime.log(`[Step 1] Received text length: ${inputData.text?.length ?? 0} chars`);

    if (!inputData.text || inputData.text.trim().length === 0) {
        runtime.log("[ERROR] 'text' field is required");
        return "Error: 'text' field is required";
    }

    // Step 2: Call Gemini
    runtime.log("[Step 2] Querying Gemini AI...");
    const result = askGemini(runtime, inputData.text);
    
    runtime.log("[Step 3] AI Response received");
    return result.geminiResponse;
}
