import React from "react";

export const HoldingsTable: React.FC = () => {
  return (
    <div className="col-span-1 flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-card-dark shadow-xl lg:col-span-8">
      <div className="flex items-center justify-between border-b border-slate-700 p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
          Holdings Breakdown
        </h3>
        <div className="flex gap-2">
          <button className="p-1 text-text-muted hover:text-white">
            <span className="material-icons-outlined text-sm">filter_list</span>
          </button>
          <button className="p-1 text-text-muted hover:text-white">
            <span className="material-icons-outlined text-sm">fullscreen</span>
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/50 text-xs uppercase tracking-wider text-text-muted">
              <th className="px-6 py-4 font-medium">Asset Class</th>
              <th className="px-6 py-4 font-medium">CUSIP / ID</th>
              <th className="px-6 py-4 font-medium text-right">Market Value</th>
              <th className="px-6 py-4 font-medium text-right">Weight</th>
              <th className="px-6 py-4 font-medium text-center">Custodian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50 text-sm text-slate-300">
            {/* Row 1 */}
            <tr className="group transition-colors hover:bg-slate-800/30">
              <td className="flex items-center gap-3 px-6 py-4 font-medium text-white">
                <span className="h-2 w-2 rounded-full bg-primary"></span>
                US Treasury Bill
              </td>
              <td className="px-6 py-4 font-mono text-xs text-text-muted">912796XG4</td>
              <td className="px-6 py-4 text-right font-mono">$1,250,000,000</td>
              <td className="px-6 py-4 text-right">29.2%</td>
              <td className="px-6 py-4 text-center">BNY Mellon</td>
            </tr>
            {/* Row 2 */}
            <tr className="group transition-colors hover:bg-slate-800/30">
              <td className="flex items-center gap-3 px-6 py-4 font-medium text-white">
                <span className="h-2 w-2 rounded-full bg-primary"></span>
                US Treasury Bill
              </td>
              <td className="px-6 py-4 font-mono text-xs text-text-muted">912796XH2</td>
              <td className="px-6 py-4 text-right font-mono">$890,500,000</td>
              <td className="px-6 py-4 text-right">20.8%</td>
              <td className="px-6 py-4 text-center">State Street</td>
            </tr>
            {/* Row 3 */}
            <tr className="group transition-colors hover:bg-slate-800/30">
              <td className="flex items-center gap-3 px-6 py-4 font-medium text-white">
                <span className="h-2 w-2 rounded-full bg-slate-500"></span>
                Cash Deposits
              </td>
              <td className="px-6 py-4 font-mono text-xs text-text-muted">USD-FIAT</td>
              <td className="px-6 py-4 text-right font-mono">$1,070,000,000</td>
              <td className="px-6 py-4 text-right">25.0%</td>
              <td className="px-6 py-4 text-center">Signature</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="border-t border-slate-700 bg-slate-800/20 p-4 text-center">
        <a href="#" className="text-xs font-medium text-primary transition-colors hover:text-white">
          View Full Holdings Report →
        </a>
      </div>
    </div>
  );
};
