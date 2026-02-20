# unichain-wallet-kit

> 统一的多链钱包 SDK - EVM + Solana + TON

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)

## 特性

- ✅ **统一 API** - 一个 hook 搞定所有链
- ✅ **EVM 支持** - Ethereum, Base, Arbitrum, Polygon
- ✅ **Solana 支持** - Phantom, Solflare
- ✅ **TON 支持** - Tonkeeper, TON Wallet
- ✅ **SSR 安全** - Next.js 完美兼容
- ✅ **自动重连** - 记住上次连接
- ✅ **UI 组件** - 开箱即用的按钮和选择器
- ✅ **TypeScript** - 完整类型定义

## 安装

```bash
npm install unichain-wallet-kit
```

## 快速开始

### 1. 包裹 Provider

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

### 2. 使用 Hook

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

## API

### Provider

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `autoConnect` | `boolean` | `false` | 启动时自动连接 |
| `storageKey` | `string` | `unichain-wallet` | localStorage 键名 |
| `onConnect` | `function` | - | 连接回调 |
| `onDisconnect` | `function` | - | 断开回调 |
| `onError` | `function` | - | 错误回调 |

### useWallet

| 返回值 | 类型 | 描述 |
|--------|------|------|
| `state` | `WalletState` | 钱包状态 |
| `chain` | `ChainType` | 当前链 |
| `connect` | `function` | 连接钱包 |
| `disconnect` | `function` | 断开连接 |
| `switchChain` | `function` | 切换链 |
| `signMessage` | `function` | 签名消息 |
| `sendTransaction` | `function` | 发送交易 |

### WalletState

```ts
interface WalletState {
  isConnected: boolean
  address: string | null
  chain: 'evm' | 'solana' | 'ton' | null
  chainId: string | number | null
  balance: string | null
  isConnecting: boolean
  error: string | null
}
```

## UI 组件

### ConnectButton

```tsx
import { ConnectButton } from 'unichain-wallet-kit'

// 简单用法
<ConnectButton />

// 自定义
<ConnectButton 
  showBalance={true}
  showChain={true}
  size="lg"
  variant="primary"
/>
```

### ChainSelector

```tsx
import { ChainSelector } from 'unichain-wallet-kit'

<ChainSelector 
  onChainChange={(chain) => console.log(chain)}
/>
```

## 示例

### 完整页面

```tsx
import { WalletProvider, useWallet, ConnectButton } from 'unichain-wallet-kit'

export default function NFTPage() {
  return (
    <WalletProvider>
      <NFTCard />
    </WalletProvider>
  )
}

function NFTCard() {
  const { state, sendTransaction } = useWallet()
  
  const handleBuy = async () => {
    try {
      const txHash = await sendTransaction('0x...', '0.1')
      alert(`Success! ${txHash}`)
    } catch (error) {
      alert('Failed: ' + error.message)
    }
  }
  
  return (
    <div>
      <h1>NFT #123</h1>
      <p>Price: 0.1 ETH</p>
      
      {state.isConnected ? (
        <button onClick={handleBuy}>Buy Now</button>
      ) : (
        <ConnectButton />
      )}
    </div>
  )
}
```

## 支持的链

| 链 | 类型 | 状态 |
|-----|------|------|
| Ethereum | EVM | ✅ |
| Base | EVM | ✅ |
| Arbitrum | EVM | ✅ |
| Polygon | EVM | ✅ |
| Solana | Solana | ✅ |
| TON | TON | ✅ |

## 错误处理

```tsx
const handleTx = async () => {
  try {
    await sendTransaction(to, amount)
  } catch (error) {
    switch (error.code) {
      case 4001:
        alert('User rejected')
        break
      case -32000:
        alert('Insufficient funds')
        break
      default:
        alert('Transaction failed')
    }
  }
}
```

## SSR / Next.js

```tsx
// 动态导入避免 SSR 问题
import dynamic from 'next/dynamic'

const WalletButton = dynamic(
  () => import('./WalletButton'),
  { ssr: false }
)
```

## Codex 集成

See [prompts/codex-prompts.md](prompts/codex-prompts.md) for Codex integration guide.

## License

MIT License - see [LICENSE](LICENSE) for details.

## 贡献

欢迎提交 Issue 和 PR！
