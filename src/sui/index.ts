// ============================================
// Sui Module - Sui 链支持
// 基于 Sui SDK 实现
// ============================================

import { useState, useCallback, ReactNode, createContext, useContext } from 'react'

// ============================================
// Types
// ============================================

/**
 * Sui 网络
 */
export type SuiNetwork = 'mainnet' | 'testnet' | 'devnet'

/**
 * Sui 钱包状态
 */
export interface SuiWalletState {
  isConnected: boolean
  address: string | null
  publicKey: string | null
  network: SuiNetwork
  balance: string | null
}

/**
 * Sui 配置
 */
export interface SuiConfig {
  network?: SuiNetwork
  rpcUrl?: string
}

/**
 * 交易结果
 */
export interface SuiTransactionResult {
  digest: string
  status: 'pending' | 'confirmed' | 'failed'
}

// ============================================
// Default RPC URLs
// ============================================

const DEFAULT_RPC: Record<SuiNetwork, string> = {
  mainnet: 'https://fullnode.mainnet.sui.io:443',
  testnet: 'https://fullnode.testnet.sui.io:443',
  devnet: 'https://fullnode.devnet.sui.io:443',
}

// ============================================
// Context
// ============================================

interface SuiContextValue {
  state: SuiWalletState
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  signMessage: (message: string) => Promise<string>
  transfer: (to: string, amount: string) => Promise<SuiTransactionResult>
}

const SuiContext = createContext<SuiContextValue | null>(null)

// ============================================
// Provider
// ============================================

export interface SuiProviderProps {
  children: ReactNode
  config?: SuiConfig
}

export function SuiProvider({ children, config }: SuiProviderProps) {
  const [state, setState] = useState<SuiWalletState>({
    isConnected: false,
    address: null,
    publicKey: null,
    network: config?.network || 'mainnet',
    balance: null,
  })

  // 连接钱包
  const connect = useCallback(async () => {
    try {
      // 检查 Sui Wallet
      if (typeof window !== 'undefined') {
        const wallet = (window as any).suiWallet
        
        if (wallet) {
          const account = await wallet.request({
            method: 'sui_connect',
          })
          
          setState({
            isConnected: true,
            address: account.address,
            publicKey: account.publicKey,
            network: config?.network || 'mainnet',
            balance: null,
          })
          return
        }
        
        // 尝试 Suiet
        const suiet = (window as any).suiet
        if (suiet) {
          await suiet.connect()
          const account = suiet.account()
          setState({
            isConnected: true,
            address: account.address,
            publicKey: null,
            network: config?.network || 'mainnet',
            balance: null,
          })
          return
        }
      }
      
      throw new Error('Please install Sui Wallet')
    } catch (error) {
      console.error('Failed to connect:', error)
      throw error
    }
  }, [config?.network])

  // 断开连接
  const disconnect = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        const wallet = (window as any).suiWallet
        if (wallet) {
          await wallet.request({ method: 'sui_disconnect' })
        }
      }
      setState({
        isConnected: false,
        address: null,
        publicKey: null,
        network: config?.network || 'mainnet',
        balance: null,
      })
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }, [config?.network])

  // 签名消息
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!state.isConnected || !state.address) {
      throw new Error('Wallet not connected')
    }

    try {
      if (typeof window !== 'undefined') {
        const wallet = (window as any).suiWallet
        if (wallet) {
          const result = await wallet.request({
            method: 'sui_signMessage',
            params: [{
              message: Array.from(new TextEncoder().encode(message)),
            }],
          })
          return result.signature
        }
      }
      throw new Error('Wallet not found')
    } catch (error) {
      console.error('Failed to sign:', error)
      throw error
    }
  }, [state.isConnected, state.address])

  // 转账 SUI
  const transfer = useCallback(async (
    to: string,
    amount: string
  ): Promise<SuiTransactionResult> => {
    if (!state.isConnected || !state.address) {
      throw new Error('Wallet not connected')
    }

    try {
      if (typeof window !== 'undefined') {
        const wallet = (window as any).suiWallet
        if (wallet) {
          // 构建交易
          const tx = {
            kind: 'transfer',
            recipient: to,
            amount: parseFloat(amount) * 1e9, // 转换为 MIST
          }
          
          // 发送交易
          const result = await wallet.request({
            method: 'sui_moveCall',
            params: [{
              package: '0x2',
              module: 'pay',
              function: 'pay',
              typeArguments: [],
              arguments: [state.address, tx.recipient, [], [], tx.amount],
            }],
          })
          
          return {
            digest: result.digest,
            status: 'pending',
          }
        }
      }
      throw new Error('Wallet not found')
    } catch (error) {
      console.error('Failed to transfer:', error)
      throw error
    }
  }, [state.isConnected, state.address])

  return (
    <SuiContext.Provider value={{
      state,
      connect,
      disconnect,
      signMessage,
      transfer,
    }}>
      {children}
    </SuiContext.Provider>
  )
}

// Hook
export function useSuiWallet() {
  const context = useContext(SuiContext)
  if (!context) {
    throw new Error('useSuiWallet must be used within SuiProvider')
  }
  return context
}

// ============================================
// Utility Functions
// ============================================

/**
 * 获取账户对象
 */
export async function getCoins(
  address: string,
  rpcUrl: string = DEFAULT_RPC.mainnet
): Promise<any[]> {
  const response = await fetch(`${rpcUrl}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'suix_getCoins',
      params: [address],
    }),
  })
  const result = await response.json()
  return result.result || []
}

/**
 * 获取 SUI 余额
 */
export async function getBalance(
  address: string,
  rpcUrl: string = DEFAULT_RPC.mainnet
): Promise<string> {
  try {
    const coins = await getCoins(address, rpcUrl)
    const suiCoin = coins.find(
      (c: any) => c.coinType === '0x2::sui::SUI'
    )
    return suiCoin?.balance || '0'
  } catch {
    return '0'
  }
}

/**
 * 执行交易
 */
export async function executeTransaction(
  transaction: any,
  rpcUrl: string = DEFAULT_RPC.mainnet
): Promise<{ digest: string }> {
  const response = await fetch(`${rpcUrl}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'sui_executeTransactionBlock',
      params: [transaction, { showEffects: true }],
    }),
  })
  const result = await response.json()
  return result.result
}
