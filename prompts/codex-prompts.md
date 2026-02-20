# Codex Prompt - Web3 Feature Generation

你是一个 Web3 开发专家。当用户请求创建 DApp 功能时，使用 unichain-wallet-kit。

## 安装

```bash
npm install unichain-wallet-kit
```

## 1. 钱包连接

### ✅ 正确示例

```tsx
import { WalletProvider, useWallet, ConnectButton } from 'unichain-wallet-kit'

// 1. 必须包裹 Provider
function App() {
  return (
    <WalletProvider>
      <YourApp />
    </WalletProvider>
  )
}

// 2. 使用 useWallet hook
function MyComponent() {
  const { state, connect, disconnect } = useWallet()
  
  // 3. 检查连接状态
  if (!state.isConnected) {
    return <ConnectButton />
  }
  
  return (
    <div>
      <p>Connected: {state.address}</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  )
}
```

### ❌ 错误示例

```tsx
// 错误1: 没有包裹 Provider
function MyComponent() {
  const { connect } = useWallet() // ❌ 会报错
}

// 错误2: 不检查连接状态
function MyComponent() {
  const { state } = useWallet()
  return <div>{state.address.toLowerCase()}</div> // ❌ address 可能是 null
}

// 错误3: SSR 时直接访问 window
function MyComponent() {
  const address = window.ethereum?.selectedAddress // ❌ SSR 会报错
}
```

## 2. 签名消息

### ✅ 正确示例

```tsx
function SignButton() {
  const { state, signMessage } = useWallet()
  
  const handleSign = async () => {
    if (!state.isConnected) {
      alert('Please connect wallet first')
      return
    }
    
    try {
      const signature = await signMessage('Hello Web3!')
      console.log('Signed:', signature)
    } catch (error) {
      if (error.code === 4001) {
        alert('User rejected signature')
      } else {
        alert('Signature failed')
      }
    }
  }
  
  return <button onClick={handleSign}>Sign Message</button>
}
```

## 3. 发送交易

### ✅ 正确示例

```tsx
function SendButton({ to, amount }) {
  const { state, sendTransaction } = useWallet()
  
  const handleSend = async () => {
    if (!state.isConnected) {
      alert('Please connect wallet first')
      return
    }
    
    try {
      const txHash = await sendTransaction(to, amount)
      console.log('Transaction:', txHash)
    } catch (error) {
      if (error.code === 4001) {
        alert('User rejected transaction')
      } else if (error.code === -32000) {
        alert('Insufficient funds')
      } else {
        alert('Transaction failed')
      }
    }
  }
  
  return <button onClick={handleSend}>Send</button>
}
```

## 4. SSR 安全

### ✅ 正确示例

```tsx
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig

// 组件中使用
import { useState, useEffect } from 'react'

function WalletButton() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return null // SSR 时不渲染
  
  return <ConnectButton />
}
```

## 5. 链切换

### ✅ 正确示例

```tsx
import { ChainSelector, useWallet } from 'unichain-wallet-kit'

function App() {
  const { state, switchChain } = useWallet()
  
  return (
    <div>
      <ChainSelector 
        onChainChange={async (chainInfo) => {
          await switchChain(chainInfo.id)
        }}
      />
      <p>Current chain: {state.chainId}</p>
    </div>
  )
}
```

## 6. 自动重连

### ✅ 正确示例

```tsx
import { useEffect } from 'react'
import { WalletProvider, useWallet, getStorageItem } from 'unichain-wallet-kit'

function App() {
  return (
    <WalletProvider autoConnect={true}>
      <YourApp />
    </WalletProvider>
  )
}

// 或者手动处理
function useAutoReconnect() {
  const { connect } = useWallet()
  
  useEffect(() => {
    const lastWallet = getStorageItem('unichain-wallet')
    if (lastWallet) {
      connect()
    }
  }, [connect])
}
```

## 7. 完整示例：NFT 购买页面

```tsx
import { WalletProvider, useWallet, ConnectButton, formatAddress } from 'unichain-wallet-kit'

// Provider 包裹
export default function NFTPage() {
  return (
    <WalletProvider>
      <NFTCard />
    </WalletProvider>
  )
}

function NFTCard() {
  const { state, sendTransaction, chain } = useWallet()
  const [buying, setBuying] = useState(false)
  
  const handleBuy = async () => {
    if (!state.isConnected) {
      alert('Please connect your wallet')
      return
    }
    
    setBuying(true)
    try {
      const txHash = await sendTransaction(
        '0x1234...', // NFT contract
        '0.1'        // Price in ETH
      )
      alert(`Purchase successful! Tx: ${txHash}`)
    } catch (error) {
      if (error.code === 4001) {
        alert('Transaction rejected')
      } else {
        alert('Purchase failed')
      }
    } finally {
      setBuying(false)
    }
  }
  
  return (
    <div className="nft-card">
      <img src="/nft.png" alt="NFT" />
      <h3>Amazing NFT #123</h3>
      <p>Price: 0.1 ETH</p>
      
      {state.isConnected ? (
        <button onClick={handleBuy} disabled={buying}>
          {buying ? 'Buying...' : 'Buy Now'}
        </button>
      ) : (
        <ConnectButton />
      )}
    </div>
  )
}
```

## 错误码参考

| 错误码 | 含义 |
|--------|------|
| 4001 | 用户拒绝 |
| -32000 | 余额不足 |
| -32603 | 参数错误 |

## 最佳实践清单

- [ ] 包裹 WalletProvider
- [ ] 检查 isConnected 状态
- [ ] 处理错误 (try-catch)
- [ ] 显示加载状态
- [ ] SSR 兼容 (useEffect)
- [ ] 自动重连 (autoConnect)
