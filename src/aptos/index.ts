// ============================================
// Aptos Module - Aptos 链支持
// 基于 Aptos SDK 实现
// ============================================

import { useState, useCallback, ReactNode, createContext, useContext } from 'react'

// ============================================
// Types
// ============================================

/**
 * Aptos 网络
 */
export type AptosNetwork = 'mainnet' | 'testnet' | 'devnet'

/**
 * Aptos 钱包状态
 */
export interface AptosWalletState {
  isConnected: boolean
  address: string | null
  publicKey: string | null
  network: AptosNetwork
  balance: string | null
}

/**
 * Aptos 配置
 */
export interface AptosConfig {
  network?: AptosNetwork
  rpcUrl?: string
}

/**
 * 交易选项
 */
export interface AptosTransactionOptions {
  to: string
  amount: string
  /** APT 精度 */
  decimals?: number
}

/**
 * 交易结果
 */
export interface AptosTransactionResult {
  hash: string
  status: 'pending' | 'confirmed' | 'failed'
}

// ============================================
// Default RPC URLs
// ============================================

const DEFAULT_RPC: Record<AptosNetwork, string> = {
  mainnet: 'https://aptos-mainnet.nodereal.io/v1',
  testnet: 'https://aptos-testnet.nodereal.io/v1',
  devnet: 'https://aptos-devnet.nodereal.io/v1',
}

// ============================================
// Context
// ============================================

interface AptosContextValue {
  state: AptosWalletState
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  signMessage: (message: string) => Promise<string>
  transfer: (to: string, amount: string) => Promise<AptosTransactionResult>
}

const AptosContext = createContext<AptosContextValue | null>(null)

// ============================================
// Provider
// ============================================

export interface AptosProviderProps {
  children: ReactNode
  config?: AptosConfig
}

export function AptosProvider({ children, config }: AptosProviderProps) {
  const [state, setState] = useState<AptosWalletState>({
    isConnected: false,
    address: null,
    publicKey: null,
    network: config?.network || 'mainnet',
    balance: null,
  })

  // 连接钱包
  const connect = useCallback(async () => {
    try {
      // 检查是否有 Petra 钱包
      if (typeof window !== 'undefined' && (window as any).petra) {
        const wallet = (window as any).petra
        const account = await wallet.connect()
        
        setState({
          isConnected: true,
          address: account.address,
          publicKey: account.publicKey,
          network: config?.network || 'mainnet',
          balance: null,
        })
      } else {
        // 尝试连接 Petra
        throw new Error('Please install Petra Wallet')
      }
    } catch (error) {
      console.error('Failed to connect:', error)
      throw error
    }
  }, [config?.network])

  // 断开连接
  const disconnect = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).petra) {
        await (window as any).petra.disconnect()
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
    if (!state.isConnected) throw new Error('Wallet not connected')
    
    try {
      if (typeof window !== 'undefined' && (window as any).petra) {
        const result = await (window as any).petra.signMessage({
          message,
          nonce: Date.now().toString(),
        })
        return result.signature
      }
      throw new Error('Wallet not found')
    } catch (error) {
      console.error('Failed to sign:', error)
      throw error
    }
  }, [state.isConnected])

  // 转账 APT
  const transfer = useCallback(async (
    to: string,
    amount: string
  ): Promise<AptosTransactionResult> => {
    if (!state.isConnected || !state.address) {
      throw new Error('Wallet not connected')
    }

    try {
      if (typeof window !== 'undefined' && (window as any).petra) {
        const wallet = (window as any).petra
        
        // 构建交易
        const transaction = {
          type: 'entry_function_payload',
          function: '0x1::coin::transfer',
          type_arguments: ['0x1::aptos_coin::AptosCoin'],
          arguments: [to, amount],
        }
        
        // 提交交易
        const result = await wallet.signAndSubmitTransaction(transaction)
        
        return {
          hash: result.hash,
          status: 'pending',
        }
      }
      throw new Error('Wallet not found')
    } catch (error) {
      console.error('Failed to transfer:', error)
      throw error
    }
  }, [state.isConnected, state.address])

  return (
    <AptosContext.Provider value={{
      state,
      connect,
      disconnect,
      signMessage,
      transfer,
    }}>
      {children}
    </AptosContext.Provider>
  )
}

// Hook
export function useAptosWallet() {
  const context = useContext(AptosContext)
  if (!context) {
    throw new Error('useAptosWallet must be used within AptosProvider')
  }
  return context
}

// ============================================
// Utility Functions
// ============================================

/**
 * 获取账户资源
 */
export async function getAccountResources(
  address: string,
  rpcUrl: string = DEFAULT_RPC.mainnet
): Promise<any[]> {
  const response = await fetch(`${rpcUrl}/accounts/${address}/resources`)
  return response.json()
}

/**
 * 获取账户余额
 */
export async function getBalance(
  address: string,
  rpcUrl: string = DEFAULT_RPC.mainnet
): Promise<string> {
  try {
    const resources = await getAccountResources(address, rpcUrl)
    const coin = resources.find(
      (r: any) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
    )
    return coin?.data?.coin?.value || '0'
  } catch {
    return '0'
  }
}

/**
 * 提交交易
 */
export async function submitTransaction(
  transaction: any,
  rpcUrl: string = DEFAULT_RPC.mainnet
): Promise<{ hash: string }> {
  const response = await fetch(`${rpcUrl}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'submit',
      params: [transaction],
    }),
  })
  const result = await response.json()
  return result.result
}
