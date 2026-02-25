import React from "react";
import Head from "next/head";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { COMPLIANCE_ORACLE_ADDRESS, ALERT_CONTROLLER_ADDRESS } from "@/lib/constants";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const ETHERSCAN_BASE = "https://sepolia.etherscan.io";

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title = "StableGuard",
}) => {
  return (
    <>
      <Head>
        <title>{title} | GENIUS Act Compliance Monitor</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Real-time GENIUS Act compliance monitoring for stablecoins. Powered by Chainlink CRE and on-chain attestations." />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet" />
      </Head>

      <div className="flex min-h-screen flex-col bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-200">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-background-dark">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                <span className="material-icons-outlined text-primary">security</span>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  StableGuard
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-text-muted">
                  GENIUS Act Monitor
                </p>
              </div>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="border-b-2 border-primary pb-0.5 text-sm font-medium text-primary">
                Dashboard
              </Link>
              <a
                href={`${ETHERSCAN_BASE}/address/${COMPLIANCE_ORACLE_ADDRESS}#events`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-text-muted transition-colors hover:text-white"
              >
                Audit Logs
              </a>
              <a
                href={`${ETHERSCAN_BASE}/address/${COMPLIANCE_ORACLE_ADDRESS}#readContract`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-text-muted transition-colors hover:text-white"
              >
                Oracle
              </a>
              <a
                href={`${ETHERSCAN_BASE}/address/${ALERT_CONTROLLER_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-text-muted transition-colors hover:text-white"
              >
                Alerts
              </a>
            </div>

            {/* Wallet & Profile */}
            <div className="flex items-center gap-4">
              <div className="mr-2 hidden flex-col items-end sm:flex">
                <span className="text-xs text-text-muted">Network</span>
                <span className="font-mono text-xs text-success-emerald">
                  Sepolia
                </span>
              </div>
              <ConnectButton showBalance={false} accountStatus="avatar" chainStatus="icon" />
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col px-6 py-12">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-slate-800 bg-background-dark py-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
            <div className="text-xs text-text-muted">
              StableGuard — GENIUS Act Compliance Monitor. Powered by Chainlink CRE.
            </div>
            <div className="flex items-center gap-6">
              <a
                href={`${ETHERSCAN_BASE}/address/${COMPLIANCE_ORACLE_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-text-muted hover:text-white"
              >
                ComplianceOracle
              </a>
              <a
                href={`${ETHERSCAN_BASE}/address/${ALERT_CONTROLLER_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-text-muted hover:text-white"
              >
                AlertController
              </a>
              <a
                href="https://github.com/U-GOD/StableGuard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-text-muted hover:text-white"
              >
                GitHub
              </a>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success-emerald"></div>
                <span className="text-xs font-medium text-slate-300">
                  Sepolia Testnet
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};
