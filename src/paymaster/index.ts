// ============================================
// ERC-4337 Paymaster Module - Gasless 交易
// 基于 ERC-4337 标准实现
// ============================================

import { useState, useCallback, ReactNode, createContext, useContext } from 'react'
import { http, createPublicClient, parseEther, parseAbi } from 'viem'

// ============================================
// Types
// ============================================

/**
 * 支持的链
 */
export type PaymasterChain =
  | 'ethereum'
  | 'base'
  | 'arbitrum'
  | 'optimism'
  | 'polygon'
  | 'avalanche'
  | 'bsc'

/**
 * UserOperation 状态
 */
export type UserOperationStatus =
  | 'pending'
  | 'sent'
  | 'included'
  | 'confirmed'
  | 'failed'

/**
 * UserOperation
 */
export interface UserOperation {
  sender: string
  nonce: bigint
  initCode: string
  callData: string
  callGasLimit: bigint
  verificationGasLimit: bigint
  preVerificationGas: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  paymasterAndData: string
  signature: string
}

/**
 * Paymaster 配置
 */
export interface PaymasterConfig {
  /** Bundler RPC URL */
  bundlerUrl: string
  /** Paymaster RPC URL */
  paymasterUrl: string
  /** 链 ID */
  chainId: number
  /** EntryPoint 地址 */
  entryPoint?: string
}

/**
 * Send UserOperation 选项
 */
export interface SendUserOperationOptions {
  to: string
  data?: string
  value?: string
  /** 每次交易最大 gas 费用 */
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
}

/**
 * Paymaster 策略
 */
export interface PaymasterPolicy {
  /** 是否启用 */
  enabled: boolean
  /** 支付方地址 */
  sponsorAddress?: string
  /** 费率限制 */
  rateLimit?: {
    maxPerMinute?: number
    maxPerHour?: number
  }
}

/**
 * UserOperation 结果
 */
export interface UserOperationResult {
  /** UserOperation 哈希 */
  userOpHash: string
  /** 交易哈希 */
  txHash?: string
  /** 状态 */
  status: UserOperationStatus
  /** 错误信息 */
  error?: string
}

// ============================================
// EntryPoint ABI
// ============================================

const ENTRYPOINT_ABI = [
  'function getUserOpHash((address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature) userOp',
  'event UserOperationEvent(bytes32 userOpHash, address sender, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed)',
  'function getNonce(address sender, uint192 key) view returns (uint256 nonce)',
] as const

// ============================================
// Paymaster Client
// ============================================

/**
 * ERC-4337 Paymaster 客户端
 */
export class PaymasterClient {
  private bundlerUrl: string
  private paymasterUrl: string
  private chainId: number
  private entryPoint: string

  constructor(config: PaymasterConfig) {
    this.bundlerUrl = config.bundlerUrl
    this.paymasterUrl = config.paymasterUrl
    this.chainId = config.chainId
    this.entryPoint = config.entryPoint || '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' // v0.6
  }

  /**
   * 获取 paymaster 数据
   */
  async getPaymasterData(userOp: Partial<UserOperation>): Promise<string> {
    try {
      const response = await fetch(this.paymasterUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'pm_sponsorUserOperation',
          params: [
            {
              sender: userOp.sender,
              nonce: userOp.nonce?.toString(),
              initCode: userOp.initCode,
              callData: userOp.callData,
              callGasLimit: userOp.callGasLimit?.toString(),
              verificationGasLimit: userOp.verificationGasLimit?.toString(),
              preVerificationGas: userOp.preVerificationGas?.toString(),
              maxFeePerGas: userOp.maxFeePerGas?.toString(),
              maxPriorityFeePerGas: userOp.maxPriorityFeePerGas?.toString(),
            },
            {
              entryPoint: this.entryPoint,
            }
          ]
        })
      })

      const result = await response.json()
      return result.result.paymasterAndData
    } catch (error) {
      console.error('Failed to get paymaster data:', error)
      // 返回空的 paymaster 数据
      return '0x'
    }
  }

  /**
   * 估算 UserOperation Gas
   */
  async estimateGas(userOp: Partial<UserOperation>): Promise<{
    callGasLimit: bigint
    verificationGasLimit: bigint
    preVerificationGas: bigint
  }> {
    try {
      const response = await fetch(this.bundlerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_estimateUserOperationGas',
          params: [
            {
              sender: userOp.sender,
              nonce: userOp.nonce?.toString(),
              initCode: userOp.initCode,
              callData: userOp.callData,
              callGasLimit: userOp.callGasLimit?.toString(),
              verificationGasLimit: userOp.verificationGasLimit?.toString(),
              preVerificationGas: userOp.preVerificationGas?.toString(),
              maxFeePerGas: userOp.maxFeePerGas?.toString(),
              maxPriorityFeePerGas: userOp.maxPriorityFeePerGas?.toString(),
            },
            {
              entryPoint: this.entryPoint
            }
          ]
        })
      })

      const result = await response.json()
      return {
        callGasLimit: BigInt(result.result.callGasLimit),
        verificationGasLimit: BigInt(result.result.verificationGasLimit),
        preVerificationGas: BigInt(result.result.preVerificationGas),
      }
    } catch (error) {
      // 返回默认值
      return {
        callGasLimit: 100000n,
        verificationGasLimit: 100000n,
        preVerificationGas: 21000n,
      }
    }
  }

  /**
   * 获取钱包的 nonce
   * 调用 EntryPoint 合约的 getNonce 方法
   */
  async getNonce(sender: string, provider?: any): Promise<bigint> {
    try {
      if (provider) {
        // Use viem provider to read from contract
        const nonce = await provider.readContract({
          address: this.entryPoint,
          abi: ENTRYPOINT_ABI,
          functionName: 'getNonce',
          args: [sender as `0x${string}`, 0n],
        })
        return nonce
      }
      
      // Fallback: use RPC call
      const response = await fetch(this.bundlerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{
            to: this.entryPoint,
            data: `0x${sender.replace('0x', '').padStart(64, '0')}0000000000000000000000000000000000000000000000000000000000000000`
          }, 'latest']
        })
      })
      
      const result = await response.json()
      return BigInt(result.result)
    } catch (error) {
      console.error('Failed to get nonce:', error)
      return 0n
    }
  }

  /**
   * 发送 UserOperation
   */
  async sendUserOperation(userOp: UserOperation): Promise<UserOperationResult> {
    try {
      const response = await fetch(this.bundlerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_sendUserOperation',
          params: [
            {
              sender: userOp.sender,
              nonce: userOp.nonce.toString(),
              initCode: userOp.initCode,
              callData: userOp.callData,
              callGasLimit: userOp.callGasLimit.toString(),
              verificationGasLimit: userOp.verificationGasLimit.toString(),
              preVerificationGas: userOp.preVerificationGas.toString(),
              maxFeePerGas: userOp.maxFeePerGas.toString(),
              maxPriorityFeePerGas: userOp.maxPriorityFeePerGas.toString(),
              paymasterAndData: userOp.paymasterAndData,
              signature: userOp.signature,
            },
            {
              entryPoint: this.entryPoint
            }
          ]
        })
      })

      const result = await response.json()

      if (result.error) {
        return {
          userOpHash: '',
          status: 'failed',
          error: result.error.message,
        }
      }

      return {
        userOpHash: result.result,
        status: 'sent',
      }
    } catch (error) {
      return {
        userOpHash: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 获取 UserOperation 状态
   */
  async getUserOperationStatus(userOpHash: string): Promise<UserOperationResult> {
    try {
      const response = await fetch(this.bundlerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getUserOperationByHash',
          params: [userOpHash]
        })
      })

      const result = await response.json()

      if (!result.result) {
        return {
          userOpHash,
          status: 'pending',
        }
      }

      return {
        userOpHash,
        txHash: result.result.transactionHash,
        status: result.result.receipt?.blockNumber ? 'confirmed' : 'included',
      }
    } catch (error) {
      return {
        userOpHash,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

// ============================================
// React Hook
// ============================================

interface PaymasterContextValue {
  /** 是否支持 */
  isSupported: boolean
  /** 是否正在发送 */
  isSending: boolean
  /** 发送 UserOperation */
  sendUserOperation: (options: SendUserOperationOptions) => Promise<UserOperationResult>
  /** 获取状态 */
  getStatus: (userOpHash: string) => Promise<UserOperationResult>
}

const PaymasterContext = createContext<PaymasterContextValue | null>(null)

// Provider Props
export interface PaymasterProviderProps {
  children: ReactNode
  config: PaymasterConfig
  /** 签名函数 */
  signFn?: (message: string) => Promise<string>
  /** 钱包地址 */
  address?: string
}

export function PaymasterProvider({
  children,
  config,
  signFn,
  address,
}: PaymasterProviderProps) {
  const [isSending, setIsSending] = useState(false)
  const [client] = useState(() => new PaymasterClient(config))

  // 发送 UserOperation
  const sendUserOperation = useCallback(async (
    options: SendUserOperationOptions
  ): Promise<UserOperationResult> => {
    if (!address) {
      return {
        userOpHash: '',
        status: 'failed',
        error: 'Wallet address required',
      }
    }

    setIsSending(true)

    try {
      // 获取真实的 nonce
      const nonce = await client.getNonce(address)
      
      const userOp: Partial<UserOperation> = {
        sender: address,
        nonce,
        initCode: '0x',
        callData: encodeCallData(options.to, options.value, options.data),
        callGasLimit: 0n,
        verificationGasLimit: 0n,
        preVerificationGas: 0n,
        maxFeePerGas: options.maxFeePerGas || parseEther('0.1'),
        maxPriorityFeePerGas: options.maxPriorityFeePerGas || parseEther('0.01'),
        paymasterAndData: '0x',
        signature: '0x',
      }

      // 估算 Gas
      const gas = await client.estimateGas(userOp)
      userOp.callGasLimit = gas.callGasLimit
      userOp.verificationGasLimit = gas.verificationGasLimit
      userOp.preVerificationGas = gas.preVerificationGas

      // 获取 Paymaster 数据
      userOp.paymasterAndData = await client.getPaymasterData(userOp)

      // 签名
      if (signFn) {
        const message = `Sign UserOperation: ${JSON.stringify(userOp)}`
        userOp.signature = await signFn(message)
      }

      // 发送
      const result = await client.sendUserOperation(userOp as UserOperation)
      return result
    } catch (error) {
      return {
        userOpHash: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    } finally {
      setIsSending(false)
    }
  }, [address, signFn, client])

  // 获取状态
  const getStatus = useCallback(async (
    userOpHash: string
  ): Promise<UserOperationResult> => {
    return client.getUserOperationStatus(userOpHash)
  }, [client])

  return (
    <PaymasterContext.Provider value={{
      isSupported: true,
      isSending,
      sendUserOperation,
      getStatus,
    }}>
      {children}
    </PaymasterContext.Provider>
  )
}

// Hook
export function usePaymaster() {
  const context = useContext(PaymasterContext)
  if (!context) {
    throw new Error('usePaymaster must be used within PaymasterProvider')
  }
  return context
}

// ============================================
// Utility Functions
// ============================================

/**
 * 编码调用数据
 */
function encodeCallData(to: string, value?: string, data?: string): string {
  // 简化实现 - 实际需要根据方法编码
  if (!data && !value) {
    // 简单 ETH 转账
    return '0x' // 实际需要 encodeFunctionData
  }
  return data || '0x'
}

/**
 * 创建默认 Paymaster 配置
 */
export function createPaymasterConfig(chain: PaymasterChain): PaymasterConfig {
  const configs: Record<PaymasterChain, PaymasterConfig> = {
    ethereum: {
      bundlerUrl: 'https://bundler.biconomy.io/api/v2/1/nJPK7B3ruVDdM1YxNB',
      paymasterUrl: 'https://paymaster.biconomy.io/api/v1/1/pk',
      chainId: 1,
    },
    base: {
      bundlerUrl: 'https://bundler.biconomy.io/api/v2/8453/nJPK7B3ruVDdM1YxNB',
      paymasterUrl: 'https://paymaster.biconomy.io/api/v1/8453/pk',
      chainId: 8453,
    },
    arbitrum: {
      bundlerUrl: 'https://bundler.biconomy.io/api/v2/42161/nJPK7B3ruVDdM1YxNB',
      paymasterUrl: 'https://paymaster.biconomy.io/api/v1/42161/pk',
      chainId: 42161,
    },
    optimism: {
      bundlerUrl: 'https://bundler.biconomy.io/api/v2/10/nJPK7B3ruVDdM1YxNB',
      paymasterUrl: 'https://paymaster.biconomy.io/api/v1/10/pk',
      chainId: 10,
    },
    polygon: {
      bundlerUrl: 'https://bundler.biconomy.io/api/v2/137/nJPK7B3ruVDdM1YxNB',
      paymasterUrl: 'https://paymaster.biconomy.io/api/v1/137/pk',
      chainId: 137,
    },
    avalanche: {
      bundlerUrl: 'https://bundler.biconomy.io/api/v2/43114/nJPK7B3ruVDdM1YxNB',
      paymasterUrl: 'https://paymaster.biconomy.io/api/v1/43114/pk',
      chainId: 43114,
    },
    bsc: {
      bundlerUrl: 'https://bundler.biconomy.io/api/v2/56/nJPK7B3ruVDdM1YxNB',
      paymasterUrl: 'https://paymaster.biconomy.io/api/v1/56/pk',
      chainId: 56,
    },
  }

  return configs[chain]
}
