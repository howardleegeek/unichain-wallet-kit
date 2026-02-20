// ============================================
// unichain-wallet-kit - Unified Multi-Chain Wallet SDK
// ============================================

// Core
export { 
  WalletProvider, 
  useWallet, 
  useWalletState,
  useIsConnected,
  useAddress,
  useChain,
  WalletContext,
  type WalletProviderProps,
  type ChainType,
  type WalletState,
  type WalletContextValue,
} from './core/provider'

export {
  DEFAULT_WALLET_STATE,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  formatAddress,
  formatBalance,
  type IWalletAdapter,
  type WalletCapabilities,
} from './core/adapter'

// UI Components
export { ConnectButton, type ConnectButtonProps } from './ui/ConnectButton'
export { ChainSelector, SUPPORTED_CHAINS, type ChainSelectorProps, type ChainInfo } from './ui/ChainSelector'

// EVM Module
export type { EvmConfig, EvmProviderProps } from './evm'

// Solana Module  
export type { SolanaConfig, SolanaProviderProps } from './solana'

// TON Module
export type { TonConfig, TonProviderProps } from './ton'

// ============================================
// Version
// ============================================

export const VERSION = '1.0.0'

// ============================================
// Default Configuration
// ============================================

export const DEFAULT_CONFIG = {
  storageKey: 'unichain-wallet',
  autoConnect: false,
  supportedChains: ['evm', 'solana', 'ton'] as ChainType[],
}

// Chain names
export const CHAIN_NAMES: Record<ChainType, string> = {
  evm: 'EVM',
  solana: 'Solana',
  ton: 'TON',
}

// ============================================
// Utility Functions
// ============================================

/**
 * Detect if code is running on client side
 */
export function isClient(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Detect if code is running on server side
 */
export function isServer(): boolean {
  return typeof window === 'undefined'
}

/**
 * Validate Ethereum address
 */
export function isValidEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Validate Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    const length = address.length
    return length >= 32 && length <= 44
  } catch {
    return false
  }
}

/**
 * Validate TON address
 */
export function isValidTonAddress(address: string): boolean {
  return /^[0-9a-zA-Z_-]{48}$/.test(address)
}

/**
 * Detect wallet type from address format
 */
export function detectChainFromAddress(address: string): ChainType | null {
  if (isValidEvmAddress(address)) return 'evm'
  if (isValidSolanaAddress(address)) return 'solana'
  if (isValidTonAddress(address)) return 'ton'
  return null
}
