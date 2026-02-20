// ============================================
// Core Types - 统一类型定义
// ============================================

import type { ReactNode } from 'react'

// Chain Types
export type ChainType = 'evm' | 'solana' | 'ton'

// Wallet State
export interface WalletState {
  isConnected: boolean
  address: string | null
  chain: ChainType | null
  chainId: string | number | null
  balance: string | null
  isConnecting: boolean
  error: string | null
}

// Wallet Capabilities
export interface WalletCapabilities {
  signMessage: boolean
  signTransaction: boolean
  sendTransaction: boolean
  switchChain: boolean
}

// Wallet Adapter Interface
export interface IWalletAdapter {
  getState(): WalletState
  connect(): Promise<void>
  disconnect(): Promise<void>
  switchChain(chainId: string | number): Promise<void>
  getCapabilities(): WalletCapabilities
  signMessage(message: string): Promise<string>
  sendTransaction(to: string, value: string, data?: string): Promise<string>
  on(event: string, callback: (...args: unknown[]) => void): void
  off(event: string, callback: (...args: unknown[]) => void): void
}

// Default State
export const DEFAULT_WALLET_STATE: WalletState = {
  isConnected: false,
  address: null,
  chain: null,
  chainId: null,
  balance: null,
  isConnecting: false,
  error: null,
}

// Wallet Context Value
export interface WalletContextValue {
  state: WalletState
  chain: ChainType | null
  connect: (chain?: ChainType) => Promise<void>
  disconnect: () => Promise<void>
  switchChain: (chainId: string | number) => Promise<void>
  signMessage: (message: string) => Promise<string>
  sendTransaction: (to: string, value: string, data?: string) => Promise<string>
  isEvm: boolean
  isSolana: boolean
  isTon: boolean
}

// Provider Props
export interface WalletProviderProps {
  children: ReactNode
  autoConnect?: boolean
  storageKey?: string
  onConnect?: (address: string, chain: ChainType) => void
  onDisconnect?: () => void
  onError?: (error: string) => void
}

// ============================================
// Utility Functions (SSR Compatible)
// ============================================

export function getStorageItem(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function setStorageItem(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, value)
  } catch {
    // Ignore
  }
}

export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore
  }
}

export function formatAddress(address: string, chars: number = 4): string {
  if (!address) return ''
  if (address.length <= chars * 2) return address
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export function formatBalance(balance: string | null, decimals: number = 4): string {
  if (!balance) return '--'
  const num = parseFloat(balance)
  if (isNaN(num)) return '--'
  return num.toFixed(decimals)
}

// ============================================
// Chain Configuration
// ============================================

export interface ChainInfo {
  id: string | number
  name: string
  type: ChainType
  icon?: string
  color: string
  rpcUrl?: string
  explorer?: string
}

export const SUPPORTED_CHAINS: ChainInfo[] = [
  // EVM Chains
  { id: 1, name: 'Ethereum', type: 'evm', color: '#627eea', rpcUrl: 'https://eth.llamarpc.com', explorer: 'https://etherscan.io' },
  { id: 8453, name: 'Base', type: 'evm', color: '#0052ff', rpcUrl: 'https://base.llamarpc.com', explorer: 'https://basescan.org' },
  { id: 42161, name: 'Arbitrum', type: 'evm', color: '#28a0f0', rpcUrl: 'https://arb1.arbitrum.io/rpc', explorer: 'https://arbiscan.io' },
  { id: 137, name: 'Polygon', type: 'evm', color: '#8247e5', rpcUrl: 'https://polygon.llamarpc.com', explorer: 'https://polygonscan.com' },
  // Solana
  { id: 'mainnet-beta', name: 'Solana', type: 'solana', color: '#9945ff', rpcUrl: 'https://api.mainnet-beta.solana.com', explorer: 'https://explorer.solana.com' },
  { id: 'devnet', name: 'Solana Devnet', type: 'solana', color: '#9945ff', rpcUrl: 'https://api.devnet.solana.com', explorer: 'https://explorer.solana.com' },
  // TON
  { id: '-239', name: 'TON', type: 'ton', color: '#0098ea', explorer: 'https://tonscan.org' },
]

// Chain names
export const CHAIN_NAMES: Record<ChainType, string> = {
  evm: 'EVM',
  solana: 'Solana',
  ton: 'TON',
}
