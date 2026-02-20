// ============================================
// Core Types - Unified Wallet Interface
// ============================================

export type ChainType = 'evm' | 'solana' | 'ton'

export interface WalletState {
  isConnected: boolean
  address: string | null
  chain: ChainType | null
  chainId: string | number | null
  balance: string | null
}

export interface WalletCapabilities {
  signMessage: boolean
  signTransaction: boolean
  sendTransaction: boolean
  switchChain: boolean
  addChain: boolean
}

export interface ChainInfo {
  id: string | number
  name: string
  type: ChainType
  rpcUrl: string
  explorer: string
  nativeCurrency?: {
    name: string
    symbol: string
    decimals: number
  }
}

export interface ConnectOptions {
  chain?: ChainType
  chainId?: string | number
}

export interface SignMessageOptions {
  message: string
  // EVM specific
  chainId?: number
}

export interface SendTransactionOptions {
  to: string
  value?: string
  data?: string
  // Solana specific
  to?: string
  lamports?: number
  // TON specific
  amount?: string
  payload?: string
}

// Unified Wallet Interface
export interface IWallet {
  // State
  getState(): WalletState
  
  // Connection
  connect(options?: ConnectOptions): Promise<string>
  disconnect(): Promise<void>
  
  // Chain
  switchChain(chainId: string | number): Promise<void>
  getCapabilities(): WalletCapabilities
  
  // Signing
  signMessage(message: string): Promise<string>
  sendTransaction(options: SendTransactionOptions): Promise<string>
  
  // Events
  on(event: string, callback: (...args: any[]) => void): void
  off(event: string, callback: (...args: any[]) => void): void
}

// Provider Options
export interface WalletProviderOptions {
  // EVM
  wagmiConfig?: any
  projectId?: string // WalletConnect project ID
  
  // Solana
  rpcUrl?: string
  endpoint?: string
  
  // TON
  manifestUrl?: string
  
  // UI
  autoConnect?: boolean
}

// Default chains
export const DEFAULT_EVM_CHAINS: Record<number, ChainInfo> = {
  1: {
    id: 1,
    name: 'Ethereum',
    type: 'evm',
    rpcUrl: 'https://eth.llamarpc.com',
    explorer: 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  8453: {
    id: 8453,
    name: 'Base',
    type: 'evm',
    rpcUrl: 'https://base.llamarpc.com',
    explorer: 'https://basescan.org',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  42161: {
    id: 42161,
    name: 'Arbitrum',
    type: 'evm',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  }
}

export const DEFAULT_SOLANA_CHAINS: Record<string, ChainInfo> = {
  'mainnet-beta': {
    id: 'mainnet-beta',
    name: 'Solana',
    type: 'solana',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorer: 'https://explorer.solana.com',
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 }
  },
  devnet: {
    id: 'devnet',
    name: 'Solana Devnet',
    type: 'solana',
    rpcUrl: 'https://api.devnet.solana.com',
    explorer: 'https://explorer.solana.com',
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 }
  }
}

export const DEFAULT_TON_CHAINS: Record<string, ChainInfo> = {
  '-239': {
    id: '-239',
    name: 'TON',
    type: 'ton',
    rpcUrl: 'https://toncenter.com/api/v2',
    explorer: 'https://tonscan.org'
  }
}
