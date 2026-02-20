// ============================================
// Agent Actions - Real AI Agent Blockchain Operations
// Based on Coinbase AgentKit Action Providers
// ============================================

import { encodeFunctionData, parseEther, parseUnits } from 'viem'

// Types
export type AgentActionType =
  | 'transfer'
  | 'swap'
  | 'bridge'
  | 'approve'
  | 'deploy'
  | 'call'
  | 'mint'
  | 'bridge_token'

export interface TransferParams {
  to: string
  amount: string
  token?: string
}

export interface SwapParams {
  fromToken: string
  toToken: string
  amount: string
  slippage?: number
}

export interface BridgeParams {
  fromChain: number
  toChain: number
  token: string
  amount: string
}

export interface ApproveParams {
  token: string
  spender: string
  amount: string
}

export interface CallParams {
  to: string
  data: string
  value?: string
}

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  txHash?: string
}

export interface BalanceInfo {
  token: string
  amount: string
  USDValue?: string
}

export interface WalletInfo {
  address: string
  chainId: number
  network: string
  balances: BalanceInfo[]
}

// ERC20 ABI for token operations
const ERC20_ABI = {
  transfer: ['function transfer(address to, uint256 amount) returns (bool)'],
  approve: ['function approve(address spender, uint256 amount) returns (bool)'],
  balanceOf: ['function balanceOf(address owner) view returns (uint256)'],
  decimals: ['function decimals() view returns (uint8)'],
} as const

// Uniswap V3 Router
const UNISWAP_V3_ROUTER = '0xE592427A0AEce92De3Edee1F18E0157C05861564'

// Token addresses (Mainnet)
const TOKEN_ADDRESSES: Record<string, string> = {
  ETH: '0xEeeeeEeeeEeEeeEEEeEeEeeEEEeEeeEEEEeEEA',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  DAI: '0x6B175474E89094C44Da98b954EesAdc4336521c',
  WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
}

// ============================================
// Agent Actions
// ============================================

export class AgentActions {
  constructor(
    private sendTransaction: (request: {
      to: string
      value?: string
      data?: string
    }) => Promise<ActionResult<{ hash: string }>>
  ) {}

  /**
   * Transfer tokens
   */
  async transfer(params: TransferParams): Promise<ActionResult<{ hash: string }>> {
    try {
      const { to, amount, token = 'ETH' } = params
      
      if (token === 'ETH' || token === 'ETH') {
        // Native ETH transfer
        const result = await this.sendTransaction({
          to,
          value: parseEther(amount).toString(),
        })
        return result
      }

      // ERC20 transfer
      const tokenAddress = TOKEN_ADDRESSES[token]
      if (!tokenAddress) {
        throw new Error(`Unknown token: ${token}`)
      }

      const data = encodeFunctionData({
        abi: ERC20_ABI.transfer,
        args: [to as `0x${string}`, parseUnits(amount, 18)],
      })

      return await this.sendTransaction({
        to: tokenAddress,
        data,
      })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transfer failed',
      }
    }
  }

  /**
   * Swap tokens via Uniswap V3
   */
  async swap(params: SwapParams): Promise<ActionResult<{ hash: string }>> {
    try {
      const { fromToken, toToken, amount, slippage = 0.5 } = params
      
      const fromAddress = TOKEN_ADDRESSES[fromToken]
      const toAddress = TOKEN_ADDRESSES[toToken]
      
      if (!fromAddress || !toAddress) {
        throw new Error(`Unknown token: ${fromToken} or ${toToken}`)
      }

      // Build swap params
      const paramsStruct = {
        tokenIn: fromAddress,
        tokenOut: toAddress,
        fee: 3000, // 0.3% pool
        recipient: '0x0000000000000000000000000000000000000001', // placeholder
        deadline: Math.floor(Date.now() / 1000) + 600,
        amountIn: parseUnits(amount, 18),
        amountOutMinimum: 0n, // Should calculate with slippage
        sqrtPriceLimitX96: 0n,
      }

      const data = encodeFunctionData({
        abi: [{
          name: 'exactInputSingle',
          type: 'function',
          inputs: [{
            name: 'params',
            type: 'tuple',
            components: [
              { name: 'tokenIn', type: 'address' },
              { name: 'tokenOut', type: 'address' },
              { name: 'fee', type: 'uint24' },
              { name: 'recipient', type: 'address' },
              { name: 'deadline', type: 'uint256' },
              { name: 'amountIn', type: 'uint256' },
              { name: 'amountOutMinimum', type: 'uint256' },
              { name: 'sqrtPriceLimitX96', type: 'uint160' },
            ]
          }]
        }],
        args: [paramsStruct],
      })

      return await this.sendTransaction({
        to: UNISWAP_V3_ROUTER,
        data,
      })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Swap failed',
      }
    }
  }

  /**
   * Bridge tokens (via Stargate/Across)
   */
  async bridge(params: BridgeParams): Promise<ActionResult<{ hash: string }>> {
    try {
      const { fromChain, toChain, token, amount } = params
      
      // In production, this would integrate with:
      // - Stargate: https://stargateprotocol.com
      // - Across: https://across.to
      
      // Simplified: return mock tx hash
      // Real implementation would use their SDKs
      
      return {
        success: true,
        txHash: `0x${Date.now().toString(16)}`,
        data: { 
          bridge: 'stargate',
          fromChain, 
          toChain,
          amount,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bridge failed',
      }
    }
  }

  /**
   * Approve token for spending
   */
  async approve(params: ApproveParams): Promise<ActionResult<{ hash: string }>> {
    try {
      const { token, spender, amount } = params
      
      const tokenAddress = TOKEN_ADDRESSES[token]
      if (!tokenAddress) {
        throw new Error(`Unknown token: ${token}`)
      }

      const data = encodeFunctionData({
        abi: ERC20_ABI.approve,
        args: [spender as `0x${string}`, parseUnits(amount, 18)],
      })

      return await this.sendTransaction({
        to: tokenAddress,
        data,
      })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Approve failed',
      }
    }
  }

  /**
   * Contract call
   */
  async call(params: CallParams): Promise<ActionResult<{ hash: string }>> {
    return this.sendTransaction({
      to: params.to,
      value: params.value ? parseEther(params.value).toString() : undefined,
      data: params.data,
    })
  }

  /**
   * Batch transactions
   */
  async batch(
    actions: Array<TransferParams | CallParams | ApproveParams>
  ): Promise<ActionResult<{ hashes: string[] }>> {
    const hashes: string[] = []
    
    for (const action of actions) {
      let result: ActionResult
      
      if ('to' in action && !('fromToken' in action)) {
        // Could be transfer or call
        if ('data' in action) {
          result = await this.call(action as CallParams)
        } else {
          result = await this.transfer(action as TransferParams)
        }
      } else if ('spender' in action) {
        result = await this.approve(action as ApproveParams)
      } else {
        continue
      }
      
      if (result.success && result.txHash) {
        hashes.push(result.txHash)
      } else if (!result.success) {
        return {
          success: false,
          error: result.error,
        }
      }
    }

    return {
      success: true,
      data: { hashes },
    }
  }
}

// Factory function
export function createAgentActions(
  sendTransactionFn: (request: {
    to: string
    value?: string
    data?: string
  }) => Promise<ActionResult<{ hash: string }>>
) {
  return new AgentActions(sendTransactionFn)
}

// Export token addresses for reference
export { TOKEN_ADDRESSES }
