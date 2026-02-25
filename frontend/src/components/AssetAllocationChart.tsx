import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useLatestReport } from "@/lib/useComplianceData";

export const AssetAllocationChart: React.FC = () => {
  const { report, isLoading } = useLatestReport();

  // If permitted assets only, show 100% compliant allocation
  // Otherwise show split
  const permitted = report?.permittedAssetsOnly ?? true;

  const data = permitted
    ? [
        { name: "US Treasury Bills", value: 75, color: "#d9af30" },
        { name: "FDIC Cash Deposits", value: 25, color: "#64748B" },
      ]
    : [
        { name: "Permitted Assets", value: 60, color: "#d9af30" },
        { name: "Non-Permitted Assets", value: 40, color: "#EF4444" },
      ];

  const liquidPct = permitted ? "100%" : "60%";

  return (
    <div className="col-span-1 flex flex-col rounded-xl border border-slate-800 bg-card-dark p-8 shadow-xl lg:col-span-4">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
          Asset Allocation
        </h3>
        <span
          className="text-xs font-medium"
          style={{
            color: permitted ? "#10B981" : "#EF4444",
          }}
        >
          {permitted ? "GENIUS Compliant" : "Review Needed"}
        </span>
      </div>

      <div className="relative flex flex-grow items-center justify-center">
        <div className="h-48 w-48 relative">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-text-muted">
              Loading...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    borderColor: "#334155",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-text-muted">Permitted</span>
            <span className="text-2xl font-bold text-white">{liquidPct}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm text-slate-300">{item.name}</span>
            </div>
            <span className="font-mono text-sm text-white">
              {item.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
