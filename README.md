# StableGuard

**Automated GENIUS Act Stablecoin Compliance Monitor powered by Chainlink CRE**

Built for the **Chainlink Convergence Hackathon** -- Risk & Compliance Track.

StableGuard is a **Chainlink Runtime Environment (CRE)** orchestration layer that continuously monitors **real-world stablecoin reserves** (USDC, USDT) against the **GENIUS Act** compliance standards. It writes cryptographic compliance attestations on-chain, generates **AI-powered compliance reports via Google Gemini**, pins them to **IPFS via Pinata**, and triggers automated alerts for compliance breaches.

---

## Key Features

- **Real-Time Reserve Monitoring**: Fetches live reserve data for USDC and USDT from DeFiLlama and cross-references it with on-chain `totalSupply` from Sepolia.
- **GENIUS Act Compliance Checks**:
  - Section 4 -- Verifies **1:1 Reserve Backing Ratio**
  - Section 5 -- Checks for **Permitted Assets Only** (T-bills, FDIC deposits)
  - Section 5 -- Ensures **No Rehypothecation** (reserves not re-lent or pledged)
  - Section 8 -- Tracks **Audit Freshness** (monthly attestation enforcement)
- **Compliance Score (0-100)**: Composite scoring system with letter grades (COMPLIANT / AT_RISK / NON_COMPLIANT)
- **On-Chain Compliance Oracle**: Writes signed `ComplianceReport` structs to the `ComplianceOracle` smart contract on Ethereum Sepolia
- **AI Compliance Attestation**: Uses **Google Gemini 2.0 Flash** (via CRE HTTP) to generate formal GENIUS Act attestation reports from on-chain data, then pins them to **IPFS via Pinata** for decentralized, permanent storage
- **AI Regulatory Parser**: Uses **Google Gemini** to parse raw legislative text from Congress.gov and flag new compliance requirements automatically
- **Automated Alerting**: The `AlertController` smart contract evaluates reports and emits graded alert events, which trigger CRE workflows to send webhook notifications

---

## Architecture

```
[External Data Sources]           [Chainlink CRE Workflows]           [On-Chain: Sepolia]

DeFiLlama API  -------->  WF1: Reserve Health Check  ----------->  ComplianceOracle.sol
Sepolia USDC   -------->    - Fetches reserve data                   - Stores ComplianceReport
                            - Computes GENIUS Act checks              - Emits ReportUpdated event
                            - Calculates compliance score             
                                                                     
                         WF2: Safeguard Trigger  <-----------  (Listens for ReportUpdated)
                            - Decodes compliance data                AlertController.sol
                            - Evaluates alert thresholds              - Emits Healthy/Warning/Critical
                            - Sends webhook notifications             - Emits ComplianceGradeChanged
                                                                     
Congress.gov   -------->  WF3: Regulatory Parser                 
Gemini AI      -------->    - Fetches bill text via HTTP             
                            - AI analysis of regulatory impact        
                            - Flags new compliance requirements       
                                                                     
Gemini AI      -------->  WF4: Compliance Report  <-----------  (Listens for ReportUpdated)
Pinata IPFS    <--------    - Generates AI attestation text          
                            - Computes keccak256 proof hash          
                            - Pins full report to IPFS               
                            - Returns IPFS URL + CID                 
```

---

## Chainlink Files

> **Required by hackathon**: Links to all files that use Chainlink CRE.

### CRE Workflows

| Workflow | Main Logic | Config | Description |
|---|---|---|---|
| Reserve Health Check | [main.ts](workflows/reserve-health-check/main.ts) | [config.staging.json](workflows/reserve-health-check/config.staging.json) | Cron-scheduled reserve monitoring + compliance scoring |
| Safeguard Trigger | [main.ts](workflows/safeguard-trigger/main.ts) | [config.staging.json](workflows/safeguard-trigger/config.staging.json) | Event-driven alerting on compliance breaches |
| Regulatory Parser | [main.ts](workflows/regulatory-parser/main.ts) | [config.staging.json](workflows/regulatory-parser/config.staging.json) | AI-powered legislative text analysis |
| Compliance Report | [main.ts](workflows/compliance-report/main.ts) | [config.staging.json](workflows/compliance-report/config.staging.json) | AI attestation generation + IPFS storage |

### Supporting Workflow Files

| File | Purpose |
|---|---|
| [compliance-report/gemini.ts](workflows/compliance-report/gemini.ts) | Gemini API client for attestation generation |
| [project.yaml](workflows/project.yaml) | CRE project configuration |
| [secrets.yaml](workflows/secrets.yaml) | Secret mappings for API keys (Gemini, Pinata) |

### Smart Contracts (Solidity)

| Contract | Source | Description |
|---|---|---|
| ComplianceOracle | [ComplianceOracle.sol](contracts/src/ComplianceOracle.sol) | Stores GENIUS Act compliance reports on-chain |
| AlertController | [AlertController.sol](contracts/src/AlertController.sol) | Evaluates reports, emits alert + grade events |
| ReserveOracle | [ReserveOracle.sol](contracts/src/ReserveOracle.sol) | Stores reserve health reports |
| SafeguardController | [SafeguardController.sol](contracts/src/SafeguardController.sol) | Automates pause/unpause based on reserve health |
| StableCoin | [StableCoin.sol](contracts/src/StableCoin.sol) | Mock ERC20 stablecoin (SGUSD) |
| ZKVerifier | [ZKVerifier.sol](contracts/src/ZKVerifier.sol) | Stub for Groth16 ZK proof verification |

### Contract Tests

| Test | Source |
|---|---|
| ComplianceOracle Tests | [ComplianceOracle.t.sol](contracts/test/ComplianceOracle.t.sol) |
| AlertController Tests | [AlertController.t.sol](contracts/test/AlertController.t.sol) |

### Frontend (reads on-chain data via wagmi)

| File | Purpose |
|---|---|
| [useComplianceData.ts](frontend/src/lib/useComplianceData.ts) | React hooks for reading ComplianceOracle on-chain |
| [constants.ts](frontend/src/lib/constants.ts) | Contract addresses + ABIs |

---

## Project Structure

```
StableGuard/
  contracts/
    src/
      ComplianceOracle.sol    -- Stores compliance reports on-chain
      AlertController.sol     -- Evaluates reports, emits alert events
      ReserveOracle.sol       -- Stores basic reserve health reports
      SafeguardController.sol -- Automates pause/unpause actions
      StableCoin.sol          -- Mock ERC20 stablecoin (SGUSD)
      ZKVerifier.sol          -- ZK proof verification stub
    test/
      ComplianceOracle.t.sol  -- Comprehensive tests for oracle
      AlertController.t.sol   -- Tests for alerting + grade logic
    script/
      Deploy.s.sol            -- Foundry deployment script
  workflows/
    reserve-health-check/     -- WF1: Cron reserve monitoring
    safeguard-trigger/        -- WF2: Event-driven alerting
    regulatory-parser/        -- WF3: AI legislative analysis
    compliance-report/        -- WF4: AI attestation + IPFS
    project.yaml              -- CRE project config
    secrets.yaml              -- Secret mappings
  frontend/                   -- Next.js dashboard (reads on-chain data)
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Foundry (`foundryup`)
- CRE CLI (`npm install -g @chainlink/cre-cli`)
- Git Bash (recommended on Windows)

### 1. Clone and Install

```bash
git clone https://github.com/U-GOD/StableGuard.git
cd StableGuard
```

### 2. Smart Contracts

```bash
cd contracts
forge install
forge test
# Deploy to Sepolia (requires .env with PRIVATE_KEY and SEPOLIA_RPC_URL)
source .env && forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast
```

### 3. Configure Secrets

Create `workflows/.env`:
```
GEMINI_API_KEY_VAR=your_gemini_api_key
PINATA_JWT_VAR=your_pinata_jwt_token
```

### 4. Simulate Workflows

```bash
cd workflows

# WF1: Reserve Health Check (fetches DeFiLlama + writes to oracle)
cre workflow simulate ./reserve-health-check --target=staging-settings

# WF2: Safeguard Trigger (listens for ReportUpdated events)
cre workflow simulate ./safeguard-trigger --target=staging-settings

# WF3: AI Regulatory Parser (fetches Congress.gov + Gemini analysis)
cre workflow simulate ./regulatory-parser --target=staging-settings

# WF4: AI Compliance Attestation + IPFS Upload
cre workflow simulate ./compliance-report --target=staging-settings
```

### 5. Frontend Dashboard

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

---

## Deployed Contracts (Sepolia)

| Contract | Address |
|---|---|
| ComplianceOracle | `0xbd4c9697814443851381f50A99768DDE0F9C0597` |
| AlertController | `0x076f94aB28C679E4Ec977634C78AC6491ADc0e48` |
| StableCoin (SGUSD) | `0x646EeB4af654c5dDBF245142Eedc196728FbfB70` |
| ReserveOracle | `0xe10bc2a2C464ba43c13135C6C812a78C69bf14B5` |
| SafeguardController | `0xA2EA4B31f0E36f18DBd5C21De4f82083d6d64E2d` |
| ZKVerifier | `0x2CE16A90fEd3c01257603ae426e9eDCB5B4FC7Bf` |

---

## Compliance Standards (GENIUS Act)

StableGuard enforces the following checks based on the **GENIUS Stablecoin Act**:

1. **Section 4 -- Reserve Ratio >= 100%**: `totalReserves >= totalSupply`
2. **Section 5 -- Permitted Assets**: Reserves must be Cash, T-Bills, or FDIC-insured deposits
3. **Section 5 -- No Rehypothecation**: Reserves cannot be pledged, lent, or re-used
4. **Section 8 -- Audit Frequency**: Issuer attestations must be less than 30 days old

Composite scores: 80-100 = COMPLIANT, 50-79 = AT_RISK, 0-49 = NON_COMPLIANT

---

## Tech Stack

- **Orchestration**: Chainlink Runtime Environment (CRE)
- **Smart Contracts**: Solidity 0.8.30, Foundry
- **AI**: Google Gemini 2.0 Flash (via CRE HTTP)
- **Data Sources**: DeFiLlama, Congress.gov, Sepolia RPC
- **Decentralized Storage**: IPFS via Pinata
- **Frontend**: Next.js 16, wagmi, RainbowKit, Recharts
- **Network**: Ethereum Sepolia

## License

MIT
