# unichain-wallet-kit

> Unified Multi-Chain Wallet SDK - EVM + Solana + TON + Aptos + Sui + AI Agent + Passkeys

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![npm version](https://img.shields.io/npm/v/unichain-wallet-kit)](https://www.npmjs.com/package/unichain-wallet-kit)

## Features

### Multi-Chain Support
- ✅ **EVM** - Ethereum, Base, Arbitrum, Polygon, Optimism, Avalanche, BSC
- ✅ **Solana** - Phantom, Solflare, Slope
- ✅ **TON** - Tonkeeper, TON Wallet
- ✅ **Aptos** - Petra Wallet
- ✅ **Sui** - Sui Wallet, Suiet

### AI Agent
- ✅ **Agent Wallet** - Programmable wallets for AI agents
- ✅ **Policy System** - Spending limits and allowances
- ✅ **x402 Payments** - Micropayment protocol for AI agents
- ✅ **ERC-4337 Paymaster** - Gasless transactions
- ✅ **LangChain Tools** - Blockchain actions for AI agents

### Security
- ✅ **Passkeys/WebAuthn** - Passwordless authentication
- ✅ **Lit Protocol** - Decentralized key management (MPC)
- ✅ **Session Keys** - Temporary signing permissions

### Developer Experience
- ✅ **Unified API** - One hook for all chains
- ✅ **SSR Safe** - Next.js compatible
- ✅ **Auto Reconnect** - Remembers last connection
- ✅ **UI Components** - Ready-to-use buttons and selectors
- ✅ **TypeScript** - Full type definitions

### Data & Infrastructure
- ✅ **The Graph** - Blockchain data indexing
- ✅ **Push Protocol** - Web3 notifications
- ✅ **ENS** - Ethereum Name Service

## Installation

```bash
npm install unichain-wallet-kit
```

## Quick Start

### 1. Wrap with Provider

```tsx
import { WalletProvider } from 'unichain-wallet-kit'

export default function App() {
  return (
    <WalletProvider autoConnect={true}>
      <YourApp />
    </WalletProvider>
  )
}
```

### 2. Use Hook

```tsx
import { useWallet, ConnectButton } from 'unichain-wallet-kit'

function MyComponent() {
  const { state, connect, disconnect, signMessage, sendTransaction } = useWallet()
  
  if (!state.isConnected) {
    return <ConnectButton />
  }
  
  return (
    <div>
      <p>Address: {state.address}</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  )
}
```

## API Reference

### Core

| Component | Description |
|-----------|-------------|
| `WalletProvider` | Main provider for wallet connection |
| `useWallet()` | Hook to access wallet state and actions |
| `ConnectButton` | Ready-to-use connect button |
| `ChainSelector` | Chain selector component |

### Chain Modules

| Module | Chain | Usage |
|--------|-------|-------|
| `EvmProvider` | EVM Chains | `import { EvmProvider, useEvmWallet } from 'unichain-wallet-kit'` |
| `SolanaProvider` | Solana | `import { SolanaProvider, useSolanaWallet } from 'unichain-wallet-kit'` |
| `TonProvider` | TON | `import { TonProvider, useTonWallet } from 'unichain-wallet-kit'` |
| `AptosProvider` | Aptos | `import { AptosProvider, useAptosWallet } from 'unichain-wallet-kit'` |
| `SuiProvider` | Sui | `import { SuiProvider, useSuiWallet } from 'unichain-wallet-kit'` |

### AI Agent

```tsx
import { AgentWalletProvider, useAgentWallet, createDefaultPolicy } from 'unichain-wallet-kit'

// Create policy
const policy = createDefaultPolicy('10', '1000') // $10/transaction, $1000/day

// Initialize agent wallet
await initialize({
  agentId: 'my-ai-agent',
  chain: 'evm',
  policy,
})

// Agent can execute transactions
await transfer('0x123...', '10', 'USDC')
```

### Passkeys

```tsx
import { PasskeyProvider, usePasskeys } from 'unichain-wallet-kit'

// Register
await register('username')

// Authenticate
await authenticate()
```

### ERC-4337 Paymaster

```tsx
import { PaymasterProvider, usePaymaster, createPaymasterConfig } from 'unichain-wallet-kit'

// Gasless transaction
await sendUserOperation({
  to: '0x...',
  value: '0.01',
})
```

### x402 Payments

```tsx
import { X402Provider, useX402 } from 'unichain-wallet-kit'

// AI agent paying for API access
const response = await x402Client.fetchWithPayment('https://api.example.com/data')
```

## Supported Chains

| Chain | Status |
|-------|--------|
| Ethereum | ✅ |
| Base | ✅ |
| Arbitrum | ✅ |
| Optimism | ✅ |
| Polygon | ✅ |
| Avalanche | ✅ |
| BSC | ✅ |
| Solana | ✅ |
| TON | ✅ |
| Aptos | ✅ |
| Sui | ✅ |

## Comparison

| Feature | Openfort | Coinbase | 0xGasless | **unichain-wallet-kit** |
|---------|----------|----------|-----------|------------------------|
| EVM | ✅ | ✅ | ✅ | ✅ |
| Solana | ⚠️ | ❌ | ❌ | ✅ |
| TON | ❌ | ❌ | ❌ | ✅ |
| Aptos/Sui | ❌ | ❌ | ❌ | ✅ |
| Passkeys | ⚠️ | ✅ | ❌ | ✅ |
| x402 | ❌ | ✅ | ✅ | ✅ |
| AI Agent | ⚠️ | ✅ | ✅ | ✅ |
| **Price** | $99/mo | Paid | Paid | **Free** |

## Architecture

```
unichain-wallet-kit
├── src/
│   ├── core/           # Core types & provider
│   ├── evm/           # EVM (wagmi)
│   ├── solana/        # Solana (wallet-adapter)
│   ├── ton/           # TON (TonConnect)
│   ├── aptos/         # Aptos
│   ├── sui/           # Sui
│   ├── agent/         # AI Agent + x402
│   ├── passkeys/      # WebAuthn
│   ├── paymaster/     # ERC-4337
│   ├── lit/           # Lit Protocol (MPC)
│   ├── graph/         # The Graph
│   ├── push/          # Push Protocol
│   ├── identity/      # ENS
│   ├── defi/          # DeFi integrations
│   └── ui/            # UI components
└── examples/          # Usage examples
```

## Contributing

Contributions are welcome! Please read our [contributing guide](CONTRIBUTING.md) first.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Keywords

```
wallet ethereum solana ton apts sui web3 crypto react 
passkeys webauthn erc4337 account-abstraction 
embedded-wallet ai-agent x402 lit-protocol 
thegraph defi uniswap aave
```
