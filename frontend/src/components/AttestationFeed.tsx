import React from "react";
import { useReportHistory } from "@/lib/useComplianceData";
import { COMPLIANCE_ORACLE_ADDRESS } from "@/lib/constants";

const ETHERSCAN_BASE = "https://sepolia.etherscan.io";

export const AttestationFeed: React.FC = () => {
  const { reports, isLoading } = useReportHistory(5);

  // Reverse so newest is first
  const feed = [...reports].reverse();

  return (
    <div className="col-span-1 rounded-xl bg-card-dark p-8 shadow-xl lg:col-span-4 matte-card">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
          Attestation Feed
        </h3>
        <a
          href={`${ETHERSCAN_BASE}/address/${COMPLIANCE_ORACLE_ADDRESS}#events`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline"
        >
          View all
        </a>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-sm text-text-muted">
          Loading events...
        </div>
      ) : feed.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-sm text-text-muted">
          No reports published yet.
        </div>
      ) : (
        <div className="relative space-y-8 pl-4 border-l border-slate-700">
          {feed.map((report, idx) => {
            const date = new Date(Number(report.timestamp) * 1000);
            const timeStr =
              date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }) +
              ", " +
              date.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              });

            const isLatest = idx === 0;
            const ratioStr = (report.ratioBps / 100).toFixed(2);
            const isZeroHash = report.proofHash === "0x0000000000000000000000000000000000000000000000000000000000000000";

            return (
              <div key={idx} className="relative">
                <div
                  className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-background-dark"
                  style={{
                    backgroundColor: isLatest ? "#d9af30" : "#475569",
                  }}
                ></div>
                <div className="flex flex-col">
                  <span className="mb-1 font-mono text-xs text-text-muted">
                    {timeStr}
                  </span>
                  <h4 className="text-sm font-medium text-white">
                    {report.stablecoinSymbol} Report — {ratioStr}% ratio
                  </h4>
                  <p className="mt-1 text-xs text-text-muted">
                    Score: {report.complianceScore}/100 ({report.grade.label}).
                    {report.compliant
                      ? " GENIUS Compliant."
                      : " Non-compliant."}
                  </p>
                  {isZeroHash ? (
                    <span className="mt-1 font-mono text-xs text-slate-600">
                      No proof hash recorded
                    </span>
                  ) : (
                    <a
                      href={`${ETHERSCAN_BASE}/address/${COMPLIANCE_ORACLE_ADDRESS}#events`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 font-mono text-xs text-primary hover:underline"
                      title={`Proof hash: ${report.proofHash}`}
                    >
                      Proof: {report.proofHash.slice(0, 10)}...
                      {report.proofHash.slice(-8)}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
