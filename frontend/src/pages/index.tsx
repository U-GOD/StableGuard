import { DashboardLayout } from "@/components/DashboardLayout";
import { ReserveHealthPanel } from "@/components/ReserveHealthPanel";
import { RegulatoryComplianceCard } from "@/components/RegulatoryComplianceCard";
import { AssetAllocationChart } from "@/components/AssetAllocationChart";
import { HoldingsTable } from "@/components/HoldingsTable";
import { AttestationFeed } from "@/components/AttestationFeed";
import { COMPLIANCE_ORACLE_ADDRESS } from "@/lib/constants";

const ETHERSCAN_BASE = "https://sepolia.etherscan.io";

export default function Home() {
  return (
    <DashboardLayout>
      {/* Header Section */}
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="mb-2 text-3xl font-light text-slate-900 dark:text-white">
            Reserve Overview
          </h2>
          <p className="max-w-xl text-sm text-text-muted">
            Real-time GENIUS Act compliance monitoring powered by Chainlink CRE
            workflows. Data sourced from on-chain ComplianceOracle attestations
            on Sepolia.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`${ETHERSCAN_BASE}/address/${COMPLIANCE_ORACLE_ADDRESS}#events`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-text-muted dark:hover:border-slate-500 dark:hover:text-white"
          >
            <span className="material-icons-outlined text-sm">receipt_long</span>
            View Events
          </a>
          <a
            href={`${ETHERSCAN_BASE}/address/${COMPLIANCE_ORACLE_ADDRESS}#readContract`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-primary/20 transition-colors hover:bg-yellow-600"
          >
            Verify On-Chain
          </a>
        </div>
      </div>

      {/* Top Grid: Hero Metric & Charts */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Hero Card (5 cols) */}
        <ReserveHealthPanel />

        {/* Asset Allocation Donut (4 cols) */}
        <AssetAllocationChart />

        {/* Regulatory Checklist (3 cols) */}
        <RegulatoryComplianceCard />
      </div>

      {/* Bottom Grid: Detailed Table & Feed */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Report History Table (8 cols) */}
        <HoldingsTable />

        {/* Events Feed (4 cols) */}
        <AttestationFeed />
      </div>
    </DashboardLayout>
  );
}
