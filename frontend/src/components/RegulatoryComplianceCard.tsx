import React from "react";
import { cn } from "@/lib/utils";

const complianceItems = [
  { label: "SEC Audit", status: "passed", icon: "check" },
  { label: "SOC 2 Type II", status: "active", icon: "check" },
  { label: "Proof of Reserves", status: "daily", icon: "check" },
  { label: "MiCA License", status: "pending", icon: "hourglass_empty" },
];

export const RegulatoryComplianceCard: React.FC = () => {
  return (
    <div className="col-span-1 flex flex-col rounded-xl border border-slate-800 bg-card-dark p-8 shadow-xl lg:col-span-3">
      <div className="mb-6 flex items-center gap-2">
        <span className="material-icons-outlined text-success-emerald">
          verified_user
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
          Compliance
        </h3>
      </div>
      
      <div className="flex-grow space-y-4">
        {complianceItems.map((item, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 p-3",
              item.status === "pending" && "opacity-60"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full",
                  item.status === "pending"
                    ? "bg-slate-600"
                    : "bg-success-emerald/20"
                )}
              >
                <span
                  className={cn(
                    "material-icons-outlined text-xs",
                    item.status === "pending"
                      ? "text-slate-400"
                      : "text-success-emerald"
                  )}
                >
                  {item.icon}
                </span>
              </div>
              <span className="text-sm font-medium text-slate-200">
                {item.label}
              </span>
            </div>
            <span
              className={cn(
                "text-xs font-medium",
                item.status === "pending"
                  ? "text-slate-400"
                  : "text-success-emerald"
              )}
            >
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
