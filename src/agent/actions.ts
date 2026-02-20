// ============================================
// Agent Actions - AI Agent 可用的区块链操作
// 基于 Coinbase AgentKit Action Providers
// ============================================

/**
 * Agent 可用的动作类型
 */
export type AgentActionType =
  | 'transfer'
  | 'swap'
  | 'bridge'
  | 'approve'
  | 'deploy'
  | 'call'
  | 'mint'
  | 'bridge_token'

/**
 * 转账参数
 */
export interface TransferParams {
  to: string
  amount: string
  token?: string // 'ETH', 'USDC', 'USDT', etc.
}

/**
 * Swap 参数
 */
export interface SwapParams {
  fromToken: string
  toToken: string
  amount: string
  slippage?: number // 默认 0.5%
}

/**
 * Bridge 参数
 */
export interface BridgeParams {
  fromChain: number
  toChain: number
  token: string
  amount: string
}

/**
 * Approve 参数
 */
export interface ApproveParams {
  token: string
  spender: string
  amount: string
}

/**
 * Contract Call 参数
 */
export interface CallParams {
  to: string
  data: string
  value?: string
}

/**
 * 统一的 Action Result
 */
export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  txHash?: string
}

/**
 * 余额信息
 */
export interface BalanceInfo {
  token: string
  amount: string
  USDValue?: string
}

/**
 * 钱包信息
 */
export interface WalletInfo {
  address: string
  chainId: number
  network: string
  balances: BalanceInfo[]
}

/**
 * Agent Actions - 可组合的交易动作
 */
export class AgentActions {
  constructor(
    private sendTransaction: (request: {
      to: string
      value?: string
      data?: string
    }) => Promise<ActionResult<{ hash: string }>>
  ) {}

  /**
   * 转账代币
   */
  async transfer(params: TransferParams): Promise<ActionResult<{ hash: string }>> {
    // TODO: 集成真实的转账逻辑
    // 这里需要根据 token 类型构建不同的交易
    return {
      success: true,
      txHash: `0x${Date.now().toString(16)}`,
      data: { hash: `0x${Date.now().toString(16)}` },
    }
  }

  /**
   * Swap 代币 (通过 0x API 或 1inch)
   */
  async swap(params: SwapParams): Promise<ActionResult<{ hash: string }>> {
    // TODO: 集成 0x API
    return {
      success: true,
      txHash: `0x${Date.now().toString(16)}`,
    }
  }

  /**
   * Bridge 跨链
   */
  async bridge(params: BridgeParams): Promise<ActionResult<{ hash: string }>> {
    // TODO: 集成 Across 或 Stargate
    return {
      success: true,
      txHash: `0x${Date.now().toString(16)}`,
    }
  }

  /**
   * Approve 代币
   */
  async approve(params: ApproveParams): Promise<ActionResult<{ hash: string }>> {
    // TODO: 构建 ERC20 approve 交易
    return {
      success: true,
      txHash: `0x${Date.now().toString(16)}`,
    }
  }

  /**
   * 调用合约
   */
  async call(params: CallParams): Promise<ActionResult<{ hash: string }>> {
    return this.sendTransaction({
      to: params.to,
      value: params.value,
      data: params.data,
    })
  }

  /**
   * 批量交易
   */
  async batch(
    actions: Array<TransferParams | CallParams>
  ): Promise<ActionResult<{ hashes: string[] }>> {
    // TODO: 实现批量交易 (通过 ERC-4337 bundler)
    const hashes: string[] = []
    for (const action of actions) {
      if ('to' in action && 'data' in action) {
        const result = await this.call(action as CallParams)
        if (result.txHash) hashes.push(result.txHash)
      }
    }
    return {
      success: true,
      data: { hashes },
    }
  }
}

/**
 * 创建 Agent Actions 实例的工厂函数
 */
export function createAgentActions(
  sendTransactionFn: (request: {
    to: string
    value?: string
    data?: string
  }) => Promise<ActionResult<{ hash: string }>>
): AgentActions {
  return new AgentActions(sendTransactionFn)
}

// ============================================
// Agent Tools - LangChain/OpenAI 集成
// ============================================

/**
 * LangChain 工具定义
 */
export interface LangChainTool {
  name: string
  description: string
  parameters: object
}

/**
 * 获取 Agent 可用的 LangChain 工具
 */
export function getLangChainTools(agent: AgentActions): LangChainTool[] {
  return [
    {
      name: 'transfer',
      description: 'Transfer tokens to another address',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient address' },
          amount: { type: 'string', description: 'Amount to transfer' },
          token: { type: 'string', description: 'Token symbol (ETH, USDC, etc.)' },
        },
        required: ['to', 'amount'],
      },
    },
    {
      name: 'swap',
      description: 'Swap one token for another',
      parameters: {
        type: 'object',
        properties: {
          fromToken: { type: 'string' },
          toToken: { type: 'string' },
          amount: { type: 'string' },
        },
        required: ['fromToken', 'toToken', 'amount'],
      },
    },
    {
      name: 'get_balance',
      description: 'Get wallet balance',
      parameters: {
        type: 'object',
        properties: {
          token: { type: 'string' },
        },
      },
    },
    {
      name: 'get_wallet_address',
      description: 'Get the agent wallet address',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  ]
}

/**
 * OpenAI Agent 工具定义
 */
export interface OpenAITool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: object
  }
}

/**
 * 获取 Agent 可用的 OpenAI 工具
 */
export function getOpenAITools(agent: AgentActions): OpenAITool[] {
  return getLangChainTools(agent).map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }))
}
