import React from "react";
import { useLatestReport } from "@/lib/useComplianceData";
import { cn } from "@/lib/utils";

export const RegulatoryComplianceCard: React.FC = () => {
  const { report, isLoading } = useLatestReport();

  const now = Math.floor(Date.now() / 1000);
  const auditAge = report
    ? now - Number(report.lastAuditTimestamp)
    : 0;
  const auditFresh = auditAge < 30 * 24 * 60 * 60; // < 30 days

  const checks = report
    ? [
        {
          label: "S4: 1:1 Reserve Backing",
          passed: report.ratioBps >= 10000,
          detail: `${(report.ratioBps / 100).toFixed(2)}% ratio`,
        },
        {
          label: "S5: Permitted Assets Only",
          passed: report.permittedAssetsOnly,
          detail: report.permittedAssetsOnly
            ? "T-bills, FDIC deposits"
            : "Non-permitted assets detected",
        },
        {
          label: "S5: No Rehypothecation",
          passed: report.noRehypothecation,
          detail: report.noRehypothecation
            ? "No re-lending detected"
            : "Reserves may be re-lent",
        },
        {
          label: "S8: Monthly Attestation",
          passed: auditFresh,
          detail: auditFresh
            ? `Last audit: ${Math.floor(auditAge / 86400)}d ago`
            : "Audit overdue (>30 days)",
        },
      ]
    : [];

  return (
    <div className="col-span-1 flex flex-col rounded-xl border border-slate-800 bg-card-dark p-8 shadow-xl lg:col-span-3">
      <div className="mb-6 flex items-center gap-2">
        <span className="material-icons-outlined text-success-emerald">
          verified_user
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
          GENIUS Act Compliance
        </h3>
      </div>

      {isLoading ? (
        <div className="flex flex-grow items-center justify-center text-sm text-text-muted">
          Loading compliance data...
        </div>
      ) : (
        <div className="flex-grow space-y-4">
          {checks.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 p-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full",
                    item.passed ? "bg-success-emerald/20" : "bg-red-500/20"
                  )}
                >
                  <span
                    className={cn(
                      "material-icons-outlined text-xs",
                      item.passed ? "text-success-emerald" : "text-red-400"
                    )}
                  >
                    {item.passed ? "check" : "close"}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-200">
                    {item.label}
                  </span>
                  <p className="text-xs text-text-muted">{item.detail}</p>
                </div>
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  item.passed ? "text-success-emerald" : "text-red-400"
                )}
              >
                {item.passed ? "PASS" : "FAIL"}
              </span>
            </div>
          ))}

          {/* Score Badge */}
          {report && (
            <div
              className="mt-4 flex items-center justify-between rounded-lg p-3 border"
              style={{
                backgroundColor: `${report.grade.color}10`,
                borderColor: `${report.grade.color}30`,
              }}
            >
              <span className="text-sm font-medium text-white">
                Composite Score
              </span>
              <span
                className="text-lg font-bold"
                style={{ color: report.grade.color }}
              >
                {report.complianceScore}/100
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
