// ============================================
// Agent Wallet Module - AI Agent 钱包模块
// 基于 Coinbase AgentKit + 0xGasless 封装
// ============================================

import { useState, useCallback, useEffect, ReactNode, createContext, useContext } from 'react'

// ============================================
// Types
// ============================================

export type AgentChainType = 'evm' | 'solana'

export interface AgentWalletState {
  isInitialized: boolean
  address: string | null
  chainId: number | null
  balance: string | null
  policy: AgentPolicy | null
}

export interface AgentPolicy {
  /** 每次交易最大金额 */
  maxAmount: string
  /** 每日最大金额 */
  dailyLimit: string
  /** 可支出代币列表 */
  allowedTokens: string[]
  /** 是否启用 */
  enabled: boolean
}

export interface AgentConfig {
  /** Agent 唯一 ID */
  agentId: string
  /** API Key 用于认证 */
  apiKey?: string
  /** 私钥（可选，用于后端模式） */
  privateKey?: string
  /** 默认链 */
  chain?: AgentChainType
  /** 网络 ID */
  networkId?: number
  /** 政策限制 */
  policy?: AgentPolicy
}

export interface TransactionRequest {
  to: string
  value?: string
  token?: string
  data?: string
}

export interface TransactionResult {
  hash: string
  status: 'pending' | 'confirmed' | 'failed'
  blockNumber?: number
}

// ============================================
// Agent Wallet Context
// ============================================

interface AgentWalletContextValue {
  state: AgentWalletState
  /** 初始化 Agent 钱包 */
  initialize: (config: AgentConfig) => Promise<void>
  /** 获取钱包地址 */
  getAddress: () => Promise<string>
  /** 获取余额 */
  getBalance: (token?: string) => Promise<string>
  /** 发送交易 */
  sendTransaction: (request: TransactionRequest) => Promise<TransactionResult>
  /** 发送代币 */
  transfer: (to: string, amount: string, token?: string) => Promise<TransactionResult>
  /** 签名消息 */
  signMessage: (message: string) => Promise<string>
  /** 更新政策 */
  updatePolicy: (policy: Partial<AgentPolicy>) => Promise<void>
  /** 获取历史 */
  getHistory: (limit?: number) => Promise<TransactionResult[]>
}

const AgentWalletContext = createContext<AgentWalletContextValue | null>(null)

// ============================================
// Provider
// ============================================

export interface AgentWalletProviderProps {
  children: ReactNode
  /** Coinbase AgentKit 配置 */
  coinbaseConfig?: {
    apiKeyId: string
    apiKeySecret: string
  }
  /** 0xGasless 配置 */
  gaslessConfig?: {
    projectId: string
    paymasterUrl?: string
  }
  /** 默认政策 */
  defaultPolicy?: AgentPolicy
}

export function AgentWalletProvider({ 
  children,
  coinbaseConfig,
  gaslessConfig,
  defaultPolicy,
}: AgentWalletProviderProps) {
  const [state, setState] = useState<AgentWalletState>({
    isInitialized: false,
    address: null,
    chainId: null,
    balance: null,
    policy: defaultPolicy || null,
  })

  // Initialize agent wallet
  const initialize = useCallback(async (config: AgentConfig) => {
    try {
      // TODO: 集成 Coinbase AgentKit 或 0xGasless
      // 这里先用 mock 实现
      
      setState({
        isInitialized: true,
        address: generateMockAddress(config.chain || 'evm'),
        chainId: config.networkId || 8453, // Base
        balance: '0',
        policy: config.policy || defaultPolicy || null,
      })
    } catch (error) {
      console.error('Failed to initialize agent wallet:', error)
      throw error
    }
  }, [defaultPolicy])

  // Get address
  const getAddress = useCallback(async (): Promise<string> => {
    if (!state.address) throw new Error('Wallet not initialized')
    return state.address
  }, [state.address])

  // Get balance
  const getBalance = useCallback(async (token?: string): Promise<string> => {
    // TODO: 集成真实 API
    return state.balance || '0'
  }, [state.balance])

  // Send transaction
  const sendTransaction = useCallback(async (
    request: TransactionRequest
  ): Promise<TransactionResult> => {
    if (!state.isInitialized) throw new Error('Wallet not initialized')
    
    // 验证政策
    if (state.policy?.enabled) {
      const amount = request.value || '0'
      if (parseFloat(amount) > parseFloat(state.policy.maxAmount)) {
        throw new Error(`Amount exceeds max limit: ${state.policy.maxAmount}`)
      }
    }

    // TODO: 集成 Coinbase AgentKit 或 0xGasless
    // 返回模拟结果
    return {
      hash: `0x${Date.now().toString(16)}`,
      status: 'confirmed',
      blockNumber: 12345678,
    }
  }, [state.isInitialized, state.policy])

  // Transfer
  const transfer = useCallback(async (
    to: string,
    amount: string,
    token?: string
  ): Promise<TransactionResult> => {
    return sendTransaction({ to, value: amount, token })
  }, [sendTransaction])

  // Sign message
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!state.isInitialized) throw new Error('Wallet not initialized')
    // TODO: 集成签名
    return `signed:${message}`
  }, [state.isInitialized])

  // Update policy
  const updatePolicy = useCallback(async (policy: Partial<AgentPolicy>) => {
    setState(prev => ({
      ...prev,
      policy: prev.policy ? { ...prev.policy, ...policy } : null,
    }))
  }, [])

  // Get history
  const getHistory = useCallback(async (limit: number = 10): Promise<TransactionResult[]> => {
    // TODO: 集成真实 API
    return []
  }, [])

  return (
    <AgentWalletContext.Provider value={{
      state,
      initialize,
      getAddress,
      getBalance,
      sendTransaction,
      transfer,
      signMessage,
      updatePolicy,
      getHistory,
    }}>
      {children}
    </AgentWalletContext.Provider>
  )
}

// ============================================
// Hook
// ============================================

export function useAgentWallet() {
  const context = useContext(AgentWalletContext)
  if (!context) {
    throw new Error('useAgentWallet must be used within AgentWalletProvider')
  }
  return context
}

// ============================================
// Utility Functions
// ============================================

function generateMockAddress(chain: AgentChainType): string {
  if (chain === 'evm') {
    return `0x${Date.now().toString(16).padStart(40, '0')}`
  }
  return `${Date.now().toString(36)}${'x'.repeat(32)}`
}

// ============================================
// Policy Helpers
// ============================================

/**
 * 创建默认政策
 */
export function createDefaultPolicy(maxAmount: string = '1', dailyLimit: string = '100'): AgentPolicy {
  return {
    maxAmount,
    dailyLimit,
    allowedTokens: ['ETH', 'USDC', 'USDT'],
    enabled: true,
  }
}

/**
 * 验证交易是否在政策范围内
 */
export function validateTransaction(
  request: TransactionRequest,
  policy: AgentPolicy
): { valid: boolean; reason?: string } {
  if (!policy.enabled) {
    return { valid: true }
  }

  const amount = parseFloat(request.value || '0')
  
  if (amount > parseFloat(policy.maxAmount)) {
    return { valid: false, reason: `Amount ${amount} exceeds max ${policy.maxAmount}` }
  }

  return { valid: true }
}
