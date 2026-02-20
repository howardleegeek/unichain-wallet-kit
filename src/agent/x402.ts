// ============================================
// x402 Payment Module - AI Agent 微支付协议
// 基于 Coinbase x402 标准实现
// ============================================

import { useState, useCallback, ReactNode, createContext, useContext } from 'react'

// ============================================
// Types
// ============================================

/**
 * x402 支持的链
 */
export type X402Chain = 
  | 'ethereum'
  | 'base'
  | 'arbitrum'
  | 'polygon'
  | 'avalanche'
  | 'solana'

/**
 * x402 支持的资产
 */
export type X402Asset = 'USDC' | 'USDT' | 'ETH' | 'WETH'

/**
 * Payment Request - 服务器发送的支付请求
 */
export interface X402PaymentRequest {
  /** 金额 */
  amount: string
  /** 资产类型 */
  asset: X402Asset
  /** 链 */
  chain: X402Chain
  /** 收款人地址 */
  recipient: string
  /** 过期时间 */
  expires: number
  /** 描述 */
  description?: string
}

/**
 * Payment Response - 客户端支付响应
 */
export interface X402PaymentResponse {
  /** 交易哈希 */
  txHash: string
  /** 支付时间 */
  timestamp: number
}

/**
 * x402 发票
 */
export interface X402Invoice {
  /** 唯一ID */
  id: string
  /** 价格 */
  price: string
  /** 资产 */
  asset: X402Asset
  /** 链 */
  chain: X402Chain
  /** 收款人 */
  recipient: string
  /** 描述 */
  description?: string
  /** 状态 */
  status: 'pending' | 'paid' | 'expired' | 'failed'
}

/**
 * Facilitator 配置
 */
export interface X402FacilitatorConfig {
  /** Facilitator URL */
  url: string
  /** API Key */
  apiKey?: string
}

// ============================================
// x402 Client
// ============================================

/**
 * x402 客户端 - 用于发起支付
 */
export class X402Client {
  private facilitatorUrl: string
  private wallet: {
    address: string
    sign: (message: string) => Promise<string>
    sendTransaction: (to: string, value: string, data?: string) => Promise<string>
  }

  constructor(
    facilitatorUrl: string,
    wallet: {
      address: string
      sign: (message: string) => Promise<string>
      sendTransaction: (to: string, value: string, data?: string) => Promise<string>
    }
  ) {
    this.facilitatorUrl = facilitatorUrl
    this.wallet = wallet
  }

  /**
   * 处理 402 响应并支付
   */
  async handlePaymentRequest(
    response: Response
  ): Promise<X402PaymentResponse> {
    // 解析 402 响应
    const paymentRequest: X402PaymentRequest = await response.json()
    
    // 签名授权
    const signature = await this.signAuthorization(paymentRequest)
    
    // 发送支付
    return this.submitPayment(paymentRequest, signature)
  }

  /**
   * 签名支付授权
   */
  private async signAuthorization(
    request: X402PaymentRequest
  ): Promise<string> {
    const message = this.formatAuthorizationMessage(request)
    return this.wallet.sign(message)
  }

  /**
   * 格式化授权消息 (EIP-712)
   */
  private formatAuthorizationMessage(request: X402PaymentRequest): string {
    return [
      `Authorize payment of ${request.amount} ${request.asset}`,
      `to ${request.recipient}`,
      `on ${request.chain}`,
      `expires ${new Date(request.expires).toISOString()}`,
    ].join('\n')
  }

  /**
   * 提交支付
   */
  private async submitPayment(
    request: X402PaymentRequest,
    signature: string
  ): Promise<X402PaymentResponse> {
    // TODO: 集成 Facilitator
    // 这里简化实现
    
    const txHash = await this.wallet.sendTransaction(
      request.recipient,
      request.amount
    )

    return {
      txHash,
      timestamp: Date.now(),
    }
  }

  /**
   * 发起带有 x402 支付的请求
   */
  async fetchWithPayment(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    // 添加 x402 header
    const headers = {
      ...options.headers,
      'X-Pay-With': 'x402',
      'X-Pay-From': this.wallet.address,
    }

    const response = await fetch(url, { ...options, headers })

    // 如果需要支付
    if (response.status === 402) {
      const paymentResponse = await this.handlePaymentRequest(response)
      
      // 添加支付证明并重试
      const retryHeaders = {
        ...headers,
        'X-Pay-TxHash': paymentResponse.txHash,
      }

      return fetch(url, { ...options, headers: retryHeaders })
    }

    return response
  }
}

// ============================================
// React Hook
// ============================================

interface X402ContextValue {
  /** 当前发票 */
  invoice: X402Invoice | null
  /** 是否正在支付 */
  isProcessing: boolean
  /** 最后错误 */
  error: string | null
  /** 创建发票 */
  createInvoice: (invoice: Omit<X402Invoice, 'id' | 'status'>) => Promise<X402Invoice>
  /** 验证支付 */
  verifyPayment: (invoiceId: string) => Promise<boolean>
  /** 发起支付请求 */
  payInvoice: (invoice: X402Invoice) => Promise<X402PaymentResponse>
}

const X402Context = createContext<X402ContextValue | null>(null)

// Provider Props
export interface X402ProviderProps {
  children: ReactNode
  /** Facilitator 配置 */
  facilitator: X402FacilitatorConfig
  /** 钱包地址 */
  walletAddress: string
  /** 签名函数 */
  signFn: (message: string) => Promise<string>
  /** 发送交易函数 */
  sendTxFn: (to: string, value: string) => Promise<string>
}

export function X402Provider({
  children,
  facilitator,
  walletAddress,
  signFn,
  sendTxFn,
}: X402ProviderProps) {
  const [invoice, setInvoice] = useState<X402Invoice | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 创建发票
  const createInvoice = useCallback(async (
    data: Omit<X402Invoice, 'id' | 'status'>
  ): Promise<X402Invoice> => {
    const newInvoice: X402Invoice = {
      ...data,
      id: `inv_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      status: 'pending',
    }
    setInvoice(newInvoice)
    return newInvoice
  }, [])

  // 验证支付
  const verifyPayment = useCallback(async (
    invoiceId: string
  ): Promise<boolean> => {
    // TODO: 调用 Facilitator API 验证
    return true
  }, [])

  // 支付发票
  const payInvoice = useCallback(async (
    inv: X402Invoice
  ): Promise<X402PaymentResponse> => {
    setIsProcessing(true)
    setError(null)

    try {
      // 签名授权
      const message = `Pay ${inv.price} ${inv.asset} to ${inv.recipient}`
      await signFn(message)

      // 发送交易
      const txHash = await sendTxFn(inv.recipient, inv.price)

      // 更新发票状态
      setInvoice(prev => prev?.id === inv.id 
        ? { ...prev, status: 'paid' }
        : prev
      )

      return {
        txHash,
        timestamp: Date.now(),
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Payment failed'
      setError(errorMsg)
      
      setInvoice(prev => prev?.id === inv.id 
        ? { ...prev, status: 'failed' }
        : prev
      )
      
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [signFn, sendTxFn])

  return (
    <X402Context.Provider value={{
      invoice,
      isProcessing,
      error,
      createInvoice,
      verifyPayment,
      payInvoice,
    }}>
      {children}
    </X402Context.Provider>
  )
}

// Hook
export function useX402() {
  const context = useContext(X402Context)
  if (!context) {
    throw new Error('useX402 must be used within X402Provider')
  }
  return context
}

// ============================================
// Server-side Middleware (Express)
// ============================================

/**
 * x402 Express 中间件
 */
export function createX402Middleware(config: {
  price: string
  asset: X402Asset
  chain: X402Chain
  recipient: string
  description?: string
}) {
  return async (req: Request, res: Response, next: Function) => {
    // 检查是否有支付证明
    const txHash = req.headers['x-pay-txhash'] as string
    
    if (!txHash) {
      // 需要支付 - 返回 402
      res.status(402).json({
        amount: config.price,
        asset: config.asset,
        chain: config.chain,
        recipient: config.recipient,
        expires: Date.now() + 5 * 60 * 1000, // 5分钟过期
        description: config.description,
      } as X402PaymentRequest)
      return
    }

    // TODO: 验证支付
    // const isValid = await verifyPayment(txHash, config)
    
    next()
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * 获取链的 explorer URL
 */
export function getExplorerUrl(chain: X402Chain, txHash: string): string {
  const explorers: Record<X402Chain, string> = {
    ethereum: 'https://etherscan.io/tx',
    base: 'https://basescan.org/tx',
    arbitrum: 'https://arbiscan.io/tx',
    polygon: 'https://polygonscan.com/tx',
    avalanche: 'https://snowtrace.io/tx',
    solana: 'https://solscan.io/tx',
  }
  return `${explorers[chain]}/${txHash}`
}

/**
 * 格式化金额显示
 */
export function formatAmount(amount: string, asset: X402Asset): string {
  const decimals = asset === 'ETH' ? 18 : 6
  const value = parseFloat(amount) / Math.pow(10, decimals)
  return `${value.toFixed(2)} ${asset}`
}
