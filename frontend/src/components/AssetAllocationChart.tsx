import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "US Treasury Bills", value: 75, color: "#d9af30" }, // Gold
  { name: "Fiat Cash Reserves", value: 25, color: "#64748B" }, // Slate
];

export const AssetAllocationChart: React.FC = () => {
  return (
    <div className="col-span-1 flex flex-col rounded-xl border border-slate-800 bg-card-dark p-8 shadow-xl lg:col-span-4">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
          Asset Allocation
        </h3>
        <button className="text-text-muted hover:text-white">
          <span className="material-icons-outlined text-sm">more_horiz</span>
        </button>
      </div>

      <div className="relative flex flex-grow items-center justify-center">
        <div className="h-48 w-48 relative">
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
                contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-text-muted">Liquid</span>
            <span className="text-2xl font-bold text-white">100%</span>
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
