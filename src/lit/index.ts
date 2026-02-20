// ============================================
// Lit Protocol Module - Decentralized Key Management
// MPC + Threshold Signing + Programmable Wallet
// ============================================

import { useState, useCallback, ReactNode, createContext, useContext } from 'react'

// ============================================
// Types
// ============================================

export interface LitNode {
  url: string
  promise?: Promise<any>
}

/**
 * Lit 配置
 */
export interface LitConfig {
  /** Lit 网络 */
  network?: 'datil-dev' | 'datil' | 'cayenne'
  /** 仲裁器数量 */
  threshold?: number
}

/**
 * PKP (Programmable Key Pair) 信息
 */
export interface LitPKP {
  /** PKP 地址 */
  address: string
  /** 公钥 */
  publicKey: string
  /** Token ID */
  tokenId: string
}

/**
 * Lit 权限
 */
export interface LitPermission {
  /** 合约地址 */
  contractAddress: string
  /** 方法名 */
  method: string
  /** 链 ID */
  chain: string
}

/**
 * 签名结果
 */
export interface LitSignatureResult {
  /** 签名 */
  signature: string
  /** 原始数据 */
  dataSigned: string
}

// ============================================
// Context
// ============================================

interface LitContextValue {
  /** 是否已连接 */
  isConnected: boolean
  /** PKP 信息 */
  pkp: LitPKP | null
  /** 连接钱包 */
  connect: () => Promise<LitPKP>
  /** 断开连接 */
  disconnect: () => Promise<void>
  /** 签名消息 */
  signMessage: (message: string) => Promise<LitSignatureResult>
  /** 执行交易 */
  executeTransaction: (to: string, data: string) => Promise<string>
  /** 添加权限 */
  addPermission: (permission: LitPermission) => Promise<void>
}

const LitContext = createContext<LitContextValue | null>(null)

// ============================================
// Provider
// ============================================

export interface LitProviderProps {
  children: ReactNode
  config?: LitConfig
}

export function LitProvider({ children, config }: LitProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [pkp, setPkp] = useState<LitPKP | null>(null)

  // 连接 - 使用 Metamask 钱包生成 PKP
  const connect = useCallback(async (): Promise<LitPKP> => {
    try {
      // 检查是否有以太坊钱包
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('Please install MetaMask')
      }

      // 请求钱包连接
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      const address = accounts[0]

      // TODO: 实际调用 Lit Protocol SDK
      // 这里简化实现
      const mockPKP: LitPKP = {
        address: `0x${Date.now().toString(16).padStart(40, '0')}`,
        publicKey: `0x${Date.now().toString(16).padStart(66, '0')}`,
        tokenId: `0x${Date.now().toString(16)}`,
      }

      setPkp(mockPKP)
      setIsConnected(true)

      return mockPKP
    } catch (error) {
      console.error('Failed to connect to Lit:', error)
      throw error
    }
  }, [])

  // 断开
  const disconnect = useCallback(async () => {
    setPkp(null)
    setIsConnected(false)
  }, [])

  // 签名消息
  const signMessage = useCallback(async (message: string): Promise<LitSignatureResult> => {
    if (!isConnected || !pkp) {
      throw new Error('Not connected to Lit')
    }

    try {
      // 使用 MetaMask 签名
      if (window.ethereum) {
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, pkp.address],
        })

        return {
          signature,
          dataSigned: message,
        }
      }
      throw new Error('No wallet available')
    } catch (error) {
      console.error('Failed to sign:', error)
      throw error
    }
  }, [isConnected, pkp])

  // 执行交易
  const executeTransaction = useCallback(async (to: string, data: string): Promise<string> => {
    if (!isConnected || !pkp) {
      throw new Error('Not connected to Lit')
    }

    try {
      if (window.ethereum) {
        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: pkp.address,
            to,
            data,
          }],
        })
        return txHash
      }
      throw new Error('No wallet available')
    } catch (error) {
      console.error('Failed to execute transaction:', error)
      throw error
    }
  }, [isConnected, pkp])

  // 添加权限
  const addPermission = useCallback(async (permission: LitPermission): Promise<void> => {
    // TODO: 实现 Lit 权限添加
    console.log('Adding permission:', permission)
  }, [])

  return (
    <LitContext.Provider value={{
      isConnected,
      pkp,
      connect,
      disconnect,
      signMessage,
      executeTransaction,
      addPermission,
    }}>
      {children}
    </LitContext.Provider>
  )
}

// Hook
export function useLit() {
  const context = useContext(LitContext)
  if (!context) {
    throw new Error('useLit must be used within LitProvider')
  }
  return context
}

// ============================================
// Utility Functions
// ============================================

/**
 * 检查是否支持 Lit
 */
export function isLitSupported(): boolean {
  return typeof window !== 'undefined' && !!window.ethereum
}

/**
 * 格式化 Lit Action
 */
export function createLitAction(action: {
  contractAddress: string
  functionName: string
  args: any[]
}) {
  return {
    ...action,
    // Lit Action 格式
  }
}

/**
 * 创建访问控制条件
 */
export function createAccessControlCondition({
  contractAddress,
  standardContractType,
  chain,
  method,
  parameters,
  returnValueTest,
}: {
  contractAddress: string
  standardContractType?: string
  chain: string
  method?: string
  parameters?: string[]
  returnValueTest: { key: string; comparator: string; value: string }
}) {
  return {
    contractAddress,
    standardContractType,
    chain,
    method,
    parameters,
    returnValueTest,
  }
}
