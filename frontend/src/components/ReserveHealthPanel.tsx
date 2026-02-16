import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

const mockData = [
  { name: "Day 1", ratio: 101.2 },
  { name: "Day 2", ratio: 101.5 },
  { name: "Day 3", ratio: 101.8 },
  { name: "Day 4", ratio: 102.1 },
  { name: "Day 5", ratio: 102.4 },
  { name: "Day 6", ratio: 102.2 },
  { name: "Day 7", ratio: 102.4 },
];

export const ReserveHealthPanel: React.FC = () => {
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
          <div className="h-2 w-2 animate-pulse rounded-full bg-success-emerald"></div>
          <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Current Ratio
          </span>
        </div>
        <div className="mb-2">
          <span className="font-serif text-6xl font-bold tracking-tight text-white md:text-7xl">
            102.4%
          </span>
        </div>
        <div className="mb-8 flex items-center gap-2 rounded-full bg-success-emerald/10 px-3 py-1 w-fit border border-success-emerald/20">
             <span className="material-icons-outlined text-sm text-success-emerald">verified</span>
            <span className="text-xs font-medium text-success-emerald">GENIUS Compliant</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockData}>
            <defs>
              <linearGradient id="colorRatio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d9af30" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#d9af30" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip 
                contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px' }}
                itemStyle={{ color: '#d9af30' }}
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
      </div>

      <div className="relative z-10 mt-auto grid grid-cols-2 gap-8 border-t border-slate-700/50 pt-6">
        <div>
          <span className="mb-1 block text-xs text-text-muted">
            Total Assets (USD)
          </span>
          <span className="font-mono text-xl font-medium text-white">
            $4,281,902,400
          </span>
        </div>
        <div>
          <span className="mb-1 block text-xs text-text-muted">
            Circulating Supply
          </span>
          <span className="font-mono text-xl font-medium text-white">
            4,180,000,000
          </span>
        </div>
      </div>
    </div>
  );
};
