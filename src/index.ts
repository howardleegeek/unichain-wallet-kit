// ============================================
// unichain-wallet-kit - Unified Multi-Chain Wallet SDK
// Production-ready: EVM + Solana + TON
// ============================================

// ============================================
// EVM Module (wagmi/viem)
// ============================================

export {
  EvmProvider,
  useEvmWallet,
  useIsConnected as useEvmConnected,
  useAddress as useEvmAddress,
  useEvmBalance,
  useEvmChainId,
  parseETH,
  formatETH,
  formatAddress as formatEvmAddress,
  CHAIN_NAMES as EVM_CHAIN_NAMES,
  mainnet,
  base,
  arbitrum,
  polygon,
  sepolia,
  type EvmConfig,
  type EvmWalletState,
  type SendETHOptions,
  type TransactionReceipt,
} from './evm'

// ============================================
// Solana Module
// ============================================

export {
  SolanaProvider,
  useSolanaWallet,
  useSolanaAddress,
  useSolanaBalance,
  formatSolAddress,
  useWallet as useSolanaUseWallet,
  useConnection,
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  type SolanaConfig,
  type SolanaWalletState,
} from './solana'

// ============================================
// TON Module
// ============================================

export {
  TonProvider,
  useTonWallet,
  useTonAddress,
  useTonBalance,
  formatTonAddress,
  TonConnect,
  isTelegramUrl,
  type TonConfig,
  type TonWalletState,
} from './ton'

// ============================================
// Unified Wallet
// ============================================

export {
  UnifiedWalletProvider,
  useUnifiedWallet,
  useWalletAddress,
  useIsWalletConnected,
  useWalletChain,
  type UnifiedWalletConfig,
} from './unified'

// ============================================
// UI Components
// ============================================

export { ConnectButton, MiniConnectButton, type ConnectButtonProps } from './ui/ConnectButton'
export { ChainSelector, type ChainSelectorProps } from './ui/ChainSelector'

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
  defaultChain: 'evm' as const,
  supportedChains: ['evm', 'solana', 'ton'] as const,
}

// ============================================
// Utility Functions
// ============================================

export function isClient(): boolean {
  return typeof window !== 'undefined'
}

export function isServer(): boolean {
  return typeof window === 'undefined'
}

export function isValidEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export function isValidSolanaAddress(address: string): boolean {
  try {
    const length = address.length
    return length >= 32 && length <= 44
  } catch {
    return false
  }
}

export function isValidTonAddress(address: string): boolean {
  return /^[0-9a-zA-Z_-]{48}$/.test(address)
}

export function detectChainFromAddress(address: string): 'evm' | 'solana' | 'ton' | null {
  if (isValidEvmAddress(address)) return 'evm'
  if (isValidSolanaAddress(address)) return 'solana'
  if (isValidTonAddress(address)) return 'ton'
  return null
}
