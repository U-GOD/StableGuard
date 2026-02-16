import { DashboardLayout } from "@/components/DashboardLayout";
import { ReserveHealthPanel } from "@/components/ReserveHealthPanel";
import { RegulatoryComplianceCard } from "@/components/RegulatoryComplianceCard";
import { AssetAllocationChart } from "@/components/AssetAllocationChart";
import { HoldingsTable } from "@/components/HoldingsTable";
import { AttestationFeed } from "@/components/AttestationFeed";

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
            Real-time monitoring of collateral assets backing the issued
            stablecoin supply. Data verified by Chainlink oracles across 3 networks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-text-muted dark:hover:border-slate-500 dark:hover:text-white">
            <span className="material-icons-outlined text-sm">download</span>
            Export Report
          </button>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-primary/20 transition-colors hover:bg-yellow-600">
            Verify On-Chain
          </button>
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
        {/* Asset Holdings Table (8 cols) */}
        <HoldingsTable />

        {/* Events Feed (4 cols) */}
        <AttestationFeed />
      </div>
    </DashboardLayout>
  );
}
