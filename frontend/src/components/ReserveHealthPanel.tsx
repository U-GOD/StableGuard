import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLatestReport, useReportHistory } from "@/lib/useComplianceData";
import { bpsToPercent, formatUsd } from "@/lib/constants";

export const ReserveHealthPanel: React.FC = () => {
  const { report, isLoading } = useLatestReport();
  const { reports: history } = useReportHistory(7);

  const chartData = history.map((r, i) => ({
    name: `Report ${i + 1}`,
    ratio: r.ratioBps / 100,
  }));

  const ratioDisplay = report ? bpsToPercent(report.ratioBps) : "--";
  const gradeColor = report?.grade.color ?? "#94A3B8";
  const gradeLabel = report?.grade.label ?? "Loading...";

  return (
    <div className="col-span-1 flex flex-col justify-between overflow-hidden rounded-xl border border-slate-800 bg-card-dark p-8 shadow-xl lg:col-span-5 relative group">
      {/* Background Icon */}
      <div className="pointer-events-none absolute right-0 top-0 p-8 opacity-5 transition-opacity group-hover:opacity-10">
        <span className="material-icons-outlined text-9xl text-primary">
          account_balance
        </span>
      </div>

      <div className="relative z-10">
        <div className="mb-6 flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full animate-pulse-dot"
            style={{ backgroundColor: gradeColor }}
          ></div>
          <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Current Ratio
          </span>
        </div>
        <div className="mb-2">
          {isLoading ? (
            <span className="font-serif text-6xl font-bold tracking-tight text-slate-500 md:text-7xl">
              --.---%
            </span>
          ) : (
            <span className="font-serif text-6xl font-bold tracking-tight text-white md:text-7xl">
              {ratioDisplay}
            </span>
          )}
        </div>
        <div
          className="mb-8 flex items-center gap-2 rounded-full px-3 py-1 w-fit border"
          style={{
            backgroundColor: `${gradeColor}15`,
            borderColor: `${gradeColor}30`,
          }}
        >
          <span
            className="material-icons-outlined text-sm"
            style={{ color: gradeColor }}
          >
            {report?.complianceScore !== undefined && report.complianceScore >= 80
              ? "verified"
              : report?.complianceScore !== undefined && report.complianceScore >= 50
              ? "warning"
              : "error"}
          </span>
          <span className="text-xs font-medium" style={{ color: gradeColor }}>
            {gradeLabel}
            {report ? ` (${report.complianceScore}/100)` : ""}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRatio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d9af30" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d9af30" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1E293B",
                  borderColor: "#334155",
                  borderRadius: "8px",
                }}
                itemStyle={{ color: "#d9af30" }}
                formatter={(value?: number) => [`${(value ?? 0).toFixed(2)}%`, "Ratio"]}
              />
              <Area
                type="monotone"
                dataKey="ratio"
                stroke="#d9af30"
                fillOpacity={1}
                fill="url(#colorRatio)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-text-muted">
            {isLoading ? "Loading chart data..." : "No report history yet"}
          </div>
        )}
      </div>

      <div className="relative z-10 mt-auto grid grid-cols-2 gap-8 border-t border-slate-700/50 pt-6">
        <div>
          <span className="mb-1 block text-xs text-text-muted">
            Total Reserves (USD)
          </span>
          <span className="font-mono text-xl font-medium text-white">
            {report ? formatUsd(report.totalReserves) : "--"}
          </span>
        </div>
        <div>
          <span className="mb-1 block text-xs text-text-muted">
            Total Supply
          </span>
          <span className="font-mono text-xl font-medium text-white">
            {report ? formatUsd(report.totalSupply) : "--"}
          </span>
        </div>
      </div>
    </div>
  );
};
