import type { NextApiRequest, NextApiResponse } from "next";

type Asset = {
  type: string;
  value: number;
  currency: string;
};

type ReserveData = {
  totalReserves: number;
  timestamp: number;
  assets: Asset[];
  scenario: string;
  breakdown: {
    tBills: number;
    cash: number;
  };
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReserveData>
) {
  // Scenario selector via query param: ?scenario=healthy (default), warning, critical, crash
  const scenario = (req.query.scenario as string) || "healthy";

  // Base reserves: $1 Billion USD
  const BASE_RESERVES = 1_000_000_000;
  
  let modifier = 1.0;
  
  switch (scenario) {
    case "healthy":
      modifier = 1.02; // 102% Over-collateralized
      break;
    case "warning":
      modifier = 1.015; // 101.5% (Warning Threshold)
      break;
    case "critical":
      modifier = 1.002; // 100.2% (Use safeguards!)
      break;
    case "crash":
      modifier = 0.95; // 95% (Under-collateralized - PAUSE!)
      break;
  }

  const totalValue = BASE_RESERVES * modifier;
  const tBillValue = totalValue * 0.75;
  const cashValue = totalValue * 0.25;

  const data: ReserveData = {
    totalReserves: totalValue,
    timestamp: Date.now(),
    scenario: scenario,
    assets: [
      {
        type: "US_TREASURY_BILL_3M",
        value: tBillValue,
        currency: "USD",
      },
      {
        type: "FIAT_CASH_USD",
        value: cashValue,
        currency: "USD",
      },
    ],
    breakdown: {
      tBills: tBillValue,
      cash: cashValue,
    },
  };

  res.status(200).json(data);
}
