import React from "react";
import { useReportHistory } from "@/lib/useComplianceData";
import { bpsToPercent, formatUsd } from "@/lib/constants";

export const HoldingsTable: React.FC = () => {
  const { reports, isLoading } = useReportHistory(5);

  // Reverse so newest is first
  const rows = [...reports].reverse();

  return (
    <div className="col-span-1 flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-card-dark shadow-xl lg:col-span-8">
      <div className="flex items-center justify-between border-b border-slate-700 p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
          Report History
        </h3>
        <span className="text-xs text-text-muted">
          {rows.length} recent reports
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/50 text-xs uppercase tracking-wider text-text-muted">
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Token</th>
              <th className="px-6 py-4 font-medium text-right">Ratio</th>
              <th className="px-6 py-4 font-medium text-right">Reserves</th>
              <th className="px-6 py-4 font-medium text-center">Score</th>
              <th className="px-6 py-4 font-medium text-center">Grade</th>
              <th className="px-6 py-4 font-medium text-center">Proof</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50 text-sm text-slate-300">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-text-muted">
                  Loading report history...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-text-muted">
                  No reports published yet on the ComplianceOracle contract.
                </td>
              </tr>
            ) : (
              rows.map((report, idx) => {
                const date = new Date(Number(report.timestamp) * 1000);
                const dateStr = date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <tr
                    key={idx}
                    className="group transition-colors hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-text-muted">
                      {dateStr}
                    </td>
                    <td className="flex items-center gap-3 px-6 py-4 font-medium text-white">
                      <span className="h-2 w-2 rounded-full bg-primary"></span>
                      {report.stablecoinSymbol}
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      {bpsToPercent(report.ratioBps)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      {formatUsd(report.totalReserves)}
                    </td>
                    <td className="px-6 py-4 text-center font-mono">
                      {report.complianceScore}/100
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: `${report.grade.color}20`,
                          color: report.grade.color,
                        }}
                      >
                        {report.grade.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {report.proofHash === "0x0000000000000000000000000000000000000000000000000000000000000000" ? (
                        <span className="text-xs text-slate-600">N/A</span>
                      ) : (
                        <span className="font-mono text-xs text-primary" title={report.proofHash}>
                          {report.proofHash.slice(0, 10)}...
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
