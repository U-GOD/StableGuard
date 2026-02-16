import React from "react";

export const AttestationFeed: React.FC = () => {
  return (
    <div className="col-span-1 rounded-xl bg-card-dark p-8 shadow-xl lg:col-span-4 matte-card">
      <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-white">
        Attestation Feed
      </h3>
      <div className="relative space-y-8 pl-4 border-l border-slate-700">
        {/* Event 1 */}
        <div className="relative">
          <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-background-dark bg-primary"></div>
          <div className="flex flex-col">
            <span className="mb-1 font-mono text-xs text-text-muted">
              Today, 09:00 AM
            </span>
            <h4 className="text-sm font-medium text-white">
              Daily Attestation Published
            </h4>
            <p className="mt-1 text-xs text-text-muted">
              Independent verification confirmed by Grant Thornton.
            </p>
          </div>
        </div>
        
        {/* Event 2 */}
        <div className="relative">
          <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-background-dark bg-slate-600"></div>
          <div className="flex flex-col">
            <span className="mb-1 font-mono text-xs text-text-muted">
              Yesterday, 14:30 PM
            </span>
            <h4 className="text-sm font-medium text-slate-300">
              T-Bill Maturity Rollover
            </h4>
            <p className="mt-1 text-xs text-text-muted">
              Reinvested matured securities into 3-month bills.
            </p>
          </div>
        </div>
        
        {/* Event 3 */}
        <div className="relative">
          <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-background-dark bg-slate-600"></div>
          <div className="flex flex-col">
            <span className="mb-1 font-mono text-xs text-text-muted">
              Oct 24, 11:15 AM
            </span>
            <h4 className="text-sm font-medium text-slate-300">
              Mint Event: 50M STB
            </h4>
            <p className="mt-1 text-xs text-text-muted">
              Backed by incoming fiat wire transfer #88392.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
