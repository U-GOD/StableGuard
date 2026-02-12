# StableGuard

Automated stablecoin reserve-health monitoring and safeguard system built for the Chainlink Convergence Hackathon (Risk & Compliance track). StableGuard uses Chainlink Runtime Environment (CRE) workflows to continuously verify reserve backing, enforce strict compliance standards, and trigger on-chain protective actions when risk thresholds are breached.

## Problem

In today’s rapidly growing stablecoin ecosystem, issuers face a critical challenge: providing continuous, tamper-proof, and real-time proof of reserve health. Without verifiable, automated monitoring, even well-managed stablecoins remain vulnerable to sudden loss of confidence, depegging events, and run risks. This lack of transparency slows institutional adoption and limits the safe use of stablecoins for payments, remittances, and treasury management worldwide — especially in emerging markets where stablecoins are increasingly used to hedge local currency volatility.

StableGuard solves this by automating the enforcement loop on-chain.

## How It Works

1. **CRE Workflows** run on a cron schedule and on mint/burn events, fetching reserve data from external APIs and on-chain supply data.
2. A **health ratio** (`totalReserves / totalSupply`) is computed and pushed to an on-chain oracle (`ReserveOracle.sol`).
3. A **SafeguardController** evaluates the ratio against configurable thresholds and can pause the stablecoin token, request rebalancing, or issue warnings automatically.
4. An **AI Regulatory Parser** (Google Gemini via CRE HTTP capability) scans for regulatory updates and changes to compliance standards.
5. A **Zero-Knowledge Proof** circuit (Circom/Groth16) proves reserve solvency without revealing exact reserve amounts.
6. A **Next.js Dashboard** displays reserve health, compliance status, alerts, and ZK proof verification in real time.

## Architecture

```
Triggers (Cron / EVM Log / Webhook)
        |
        v
CRE Workflow (Health Check)
  |-- HTTP: Fetch reserve data from mock bank API
  |-- EVM Read: totalSupply from StableCoin.sol
  |-- Compute: ratio, compliance checks
  |-- EVM Write: push report to ReserveOracle.sol
  |-- Conditional: invoke Safeguard workflow if ratio < threshold
        |
        v
SafeguardController.sol
  |-- Pause StableCoin if ratio < 100%
  |-- Emit RebalanceRequested if ratio < 100.5%
  |-- Emit Warning if ratio < 102%
        |
        v
Next.js Dashboard (reads events + oracle data)
```

## Project Structure

```
StableGuard/
  contracts/          Solidity smart contracts (Foundry)
    src/              Contract source files
    test/             Foundry test files
    script/           Deployment scripts
  cre-workflows/      Chainlink CRE workflows (TypeScript)
  frontend/           Next.js dashboard
  circuits/           Zero-knowledge proof circuits (Circom)
```

## Smart Contracts

- **StableCoin.sol** -- ERC-20 token with mint, burn, and pause functionality. Emits events consumed by CRE workflows.
- **ReserveOracle.sol** -- On-chain data store for reserve health reports. Access-controlled to authorized CRE reporters.
- **SafeguardController.sol** -- Evaluates reserve reports against risk thresholds and executes protective actions.
- **ZKVerifier.sol** -- Groth16 verifier for zero-knowledge reserve solvency proofs.

## Tech Stack

- **Smart Contracts:** Solidity 0.8.24, Foundry, OpenZeppelin Contracts v5
- **Automation:** Chainlink CRE (Runtime Environment)
- **Frontend:** Next.js, ethers.js, Recharts
- **ZK Proofs:** Circom, snarkjs, Groth16
- **AI:** Google Gemini API (regulatory text parsing)
- **Network:** Ethereum Sepolia testnet

## Getting Started

### Prerequisites

- Node.js 18+
- Foundry (`foundryup`)
- Git

### Setup

```bash
git clone https://github.com/U-GOD/StableGuard.git
cd StableGuard

# Contracts
cd contracts
forge install
forge build
forge test

# Frontend
cd ../frontend
npm install
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```
SEPOLIA_RPC_URL=
PRIVATE_KEY=
GEMINI_API_KEY=
ETHERSCAN_API_KEY=
```

## Regulatory Compliance

StableGuard automates verification of key compliance requirements for modern stablecoins:

- 1:1 reserve backing ratio
- Permitted asset types only (T-bills, FDIC-insured deposits)
- No yield or interest payments to holders (where applicable)
- No rehypothecation of reserves
- Monthly reporting cadence enforcement
- Regulatory update tracking via AI parser

## License

MIT
