# StableGuard

**Automated Stablecoin Compliance Oracle & Monitoring System**

Built for the **Chainlink Convergence Hackathon (Risk & Compliance track)**.

StableGuard is a **Chainlink Runtime Environment (CRE)** orchestration layer that continuously monitors **real-world stablecoin reserves** (USDC, USDT) against the **GENIUS Act** compliance standards. It writes cryptographic compliance attestations on-chain and triggers alerts for compliance breaches.

##  Key Features

*   **Real-Time Reserve Monitoring**: Fetches live reserve data for **USDC** and **USDT** from DeFiLlama and cross-references it with on-chain `totalSupply` from Sepolia.
*   **Automated GENIUS Act Compliance**:
    *   Verifies **1:1 Backing Ratio**.
    *   Checks for **Permitted Assets** (Treasuries, FDIC deposits).
    *   Ensures **No Rehypothecation**.
    *   Tracks **Audit Freshness** (monthly attestation enforcement).
*   **On-Chain Compliance Oracle**: Writes a signed `ComplianceReport` to the `ComplianceOracle` smart contract on Ethereum Sepolia.
*   **AI Regulatory Parser**: Uses **Google Gemini AI** (via CRE) to parse raw legislative text from Congress.gov and flag new compliance requirements automatically.
*   **Automated Alerting**: The `AlertController` smart contract emits events for breaches, which trigger CRE workflows to send notifications (Discord/Slack/Email).

##  Architecture 

```
[External Data]                 [Chainlink CRE]                    [On-Chain: Sepolia]
                                                                        
DeFiLlama API  ---->  (HTTP)    Workflow 1: Reserve Check   ---->  (EVM Write) ComplianceOracle.sol
Sepolia USDC   ---->  (EVM Read)   - Fetches Data                      - Stores Reports
                                   - Computes Compliance               - Emits ReportUpdated
                                   - Enforces GENIUS Act               
                                                                        
Congress.gov   ---->  (HTTP)    Workflow 3: Reg Parser      ---->  (Log Trigger) Workflow 2: Safeguard
Gemini AI      ---->  (AI)         - Parses Bill Text                  - Listens for ReportUpdated
                                   - Updates Rules                     - Checks Alerts
                                                                       - Emits Events / Webhooks
```

## Project Structure

*   `contracts/`: Solidity smart contracts (Foundry).
    *   `ComplianceOracle.sol`: Stores compliance reports.
    *   `AlertController.sol`: Emits alerts based on oracle data.
*   `workflows/`: Chainlink CRE Workflows (TypeScript).
    *   `reserve-health-check`: Main cron job for monitoring USDC/USDT.
    *   `safeguard-trigger`: Listens for on-chain events to send alerts.
    *   `regulatory-parser`: AI-powered legislative analysis.
*   `frontend/`: *Optional* Next.js dashboard for visualization.

## Quick Start

### Prerequisites

*   Node.js 18+
*   Foundry (`foundryup`)
*   CRE CLI (`npm install -g @chainlink/cre-cli`)

### 1. Installation

```bash
git clone https://github.com/U-GOD/StableGuard.git
cd StableGuard
npm install
```

### 2. Smart Contracts (Sepolia)

```bash
cd contracts
forge install
forge test
# Deploy (requires .env)
source .env && forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast
```

### 3. Run Workflows (Simulation)

You can simulate the entire loop locally using the CRE CLI:

```bash
cd workflows
# Simulate Reserve Health Check
cre workflow simulate ./reserve-health-check --target=staging-settings

# Simulate AI Parser
cre workflow simulate ./regulatory-parser --target=staging-settings
```

## Compliance Standards (GENIUS Act)

StableGuard hardcodes the following checks based on the **Stablecoin Transparency Act (GENIUS)**:

1.  **Reserve Ratio >= 100%**: `totalReserves >= totalSupply`
2.  **Permitted Assets**: Reserves must be Cash, T-Bills, or Repos.
3.  **No Rehypothecation**: Reserves cannot be pledged or lent out.
4.  **Audit Frequency**: Attestations must be < 30 days old.

## Tech Stack

*   **Orchestration**: Chainlink Runtime Environment (CRE)
*   **Contracts**: Solidity 0.8.30, Foundry
*   **AI**: Google Gemini 1.5 Flash
*   **Data**: DeFiLlama, Etherscan, Congress.gov
*   **Network**: Ethereum Sepolia

## License

MIT
