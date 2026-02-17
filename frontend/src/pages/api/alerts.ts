import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Log the alert to the console (simulating a DB write or Slack webhook)
  console.log("------------------------------------------");
  console.log("🚨 RECEIVED ALERT WEBHOOK 🚨");
  console.log(JSON.stringify(req.body, null, 2));
  console.log("------------------------------------------");

  res.status(200).json({ received: true, timestamp: Date.now() });
}
