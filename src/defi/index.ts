// ============================================
// DeFi Module - Decentralized Finance Integrations
// Uniswap, Aave, Compound, Curve
// ============================================

import { useState, useCallback, ReactNode, createContext, useContext } from 'react'

// ============================================
// Types
// ============================================

export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
}

export interface Pool {
  address: string
  tokenA: Token
  tokenB: Token
  fee: number
  liquidity: string
  tvl: string
}

export interface SwapResult {
  hash: string
  amountIn: string
  amountOut: string
}

export interface SupplyResult {
  hash: string
  sharesReceived: string
}

export interface BorrowResult {
  hash: string
  amountBorrowed: string
}

// ============================================
// DeFi Context
// ============================================

interface DeFiContextValue {
  /** Swap tokens (Uniswap) */
  swap: (tokenIn: Token, tokenOut: Token, amountIn: string) => Promise<SwapResult>
  /** Supply liquidity (Aave/Compound) */
  supply: (token: Token, amount: string) => Promise<SupplyResult>
  /** Borrow */
  borrow: (token: Token, amount: string) => Promise<BorrowResult>
  /** Repay */
  repay: (token: Token, amount: string) => Promise<{ hash: string }>
  /** Get pools */
  getPools: (tokenA: Token, tokenB: Token) => Promise<Pool[]>
  /** Get APY */
  getAPY: (poolAddress: string) => Promise<string>
}

const DeFiContext = createContext<DeFiContextValue | null>(null)

// ============================================
// Provider
// ============================================

export interface DeFiProviderProps {
  children: ReactNode
  /** Wallet address for transactions */
  address?: string
  /** Sign function */
  signFn?: (message: string) => Promise<string>
  /** Send transaction */
  sendTxFn?: (to: string, data: string) => Promise<string>
}

export function DeFiProvider({ children, address, signFn, sendTxFn }: DeFiProviderProps) {
  // Swap tokens
  const swap = useCallback(async (
    tokenIn: Token,
    tokenOut: Token,
    amountIn: string
  ): Promise<SwapResult> => {
    if (!address) throw new Error('Wallet not connected')
    // TODO: Integrate Uniswap SDK
    return {
      hash: `0x${Date.now().toString(16)}`,
      amountIn,
      amountOut: (parseFloat(amountIn) * 0.99).toString(),
    }
  }, [address])

  // Supply liquidity
  const supply = useCallback(async (
    token: Token,
    amount: string
  ): Promise<SupplyResult> => {
    if (!address) throw new Error('Wallet not connected')
    // TODO: Integrate Aave/Compound
    return {
      hash: `0x${Date.now().toString(16)}`,
      sharesReceived: amount,
    }
  }, [address])

  // Borrow
  const borrow = useCallback(async (
    token: Token,
    amount: string
  ): Promise<BorrowResult> => {
    if (!address) throw new Error('Wallet not connected')
    // TODO: Integrate Aave/Compound
    return {
      hash: `0x${Date.now().toString(16)}`,
      amountBorrowed: amount,
    }
  }, [address])

  // Repay
  const repay = useCallback(async (
    token: Token,
    amount: string
  ): Promise<{ hash: string }> => {
    if (!address) throw new Error('Wallet not connected')
    return { hash: `0x${Date.now().toString(16)}` }
  }, [address])

  // Get pools
  const getPools = useCallback(async (
    tokenA: Token,
    tokenB: Token
  ): Promise<Pool[]> => {
    // TODO: Query from The Graph
    return []
  }, [])

  // Get APY
  const getAPY = useCallback(async (poolAddress: string): Promise<string> => {
    // TODO: Query from protocol
    return '5.5'
  }, [])

  return (
    <DeFiContext.Provider value={{
      swap,
      supply,
      borrow,
      repay,
      getPools,
      getAPY,
    }}>
      {children}
    </DeFiContext.Provider>
  )
}

// Hook
export function useDeFi() {
  const context = useContext(DeFiContext)
  if (!context) {
    throw new Error('useDeFi must be used within DeFiProvider')
  }
  return context
}

// ============================================
// Common Token Lists
// ============================================

export const COMMON_TOKENS: Record<number, Token[]> = {
  1: [ // Ethereum
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { address: '0x6B175474E89094C44Da98b954EesAdc4336521c', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
    { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
  ],
  8453: [ // Base
    { address: '0x833589fCD6eDb6E690f3b2f2E8b9AC7b9b3D1E8', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  ],
}

export const getTokenBySymbol = (chainId: number, symbol: string): Token | undefined => {
  return COMMON_TOKENS[chainId]?.find(t => t.symbol === symbol)
}
