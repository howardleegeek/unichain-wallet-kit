// ============================================
// unichain-wallet-kit - Unified Multi-Chain Wallet SDK
// ============================================

// Core Provider
export { 
  WalletProvider,
  UnifiedWalletProvider,
  SimpleWalletProvider,
  useWallet, 
  useWalletState,
  useIsConnected,
  useAddress,
  useChain,
  WalletContext,
  type WalletProviderProps,
  type UnifiedWalletProviderProps,
  type ChainType,
  type WalletState,
  type WalletContextValue,
} from './core/provider'

// Core Utilities
export {
  DEFAULT_WALLET_STATE,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  formatAddress,
  formatBalance,
  SUPPORTED_CHAINS,
  CHAIN_NAMES,
  type ChainInfo,
  type IWalletAdapter,
  type WalletCapabilities,
} from './core/adapter'

// ============================================
// UI Components
// ============================================

export { ConnectButton, MiniConnectButton, type ConnectButtonProps } from './ui/ConnectButton'
export { ChainSelector, SUPPORTED_CHAINS, type ChainSelectorProps, type ChainInfo } from './ui/ChainSelector'

// ============================================
// EVM Module
// ============================================

export {
  EvmProvider,
  useEvmWallet,
  createEvmConfig,
  useAccount,
  useConnect,
  useDisconnect,
  useSignMessage,
  useSendTransaction,
  useSwitchChain,
  useChainId,
  useBalance,
  type EvmConfig,
  type EvmProviderProps,
  type EvmWalletState,
} from './evm'

// ============================================
// Solana Module
// ============================================

export {
  SolanaProvider,
  SolanaWalletProvider,
  useSolanaWallet,
  useWallet as useSolanaUseWallet,
  useConnection,
  useAnchorWallet,
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  type SolanaConfig,
  type SolanaProviderProps,
  type SolanaWalletProviderProps,
  type SolanaWalletState,
} from './solana'

// ============================================
// TON Module
// ============================================

export {
  TonProvider,
  useTonWallet,
  TonConnect,
  isTelegramUrl,
  type TonConfig,
  type TonProviderProps,
  type TonWalletState,
} from './ton'

// ============================================
// Agent Wallet Module (AI Agent)
// ============================================

export {
  AgentWalletProvider,
  useAgentWallet,
  createDefaultPolicy,
  validateTransaction,
  type AgentWalletProviderProps,
  type AgentWalletState,
  type AgentConfig,
  type AgentPolicy,
  type AgentChainType,
  type TransactionRequest,
  type TransactionResult,
} from './agent'

export {
  AgentActions,
  createAgentActions,
  getLangChainTools,
  getOpenAITools,
  type AgentActionType,
  type TransferParams,
  type SwapParams,
  type BridgeParams,
  type ApproveParams,
  type CallParams,
  type ActionResult,
  type BalanceInfo,
  type WalletInfo,
  type LangChainTool,
  type OpenAITool,
} from './agent/actions'

// ============================================
// x402 Payment Module
// ============================================

export {
  X402Provider,
  useX402,
  X402Client,
  createX402Middleware,
  getExplorerUrl,
  formatAmount,
  type X402Chain,
  type X402Asset,
  type X402PaymentRequest,
  type X402PaymentResponse,
  type X402Invoice,
  type X402FacilitatorConfig,
} from './agent/x402'

// ============================================
// Passkeys Module
// ============================================

export {
  PasskeyProvider,
  usePasskeys,
  isWebAuthnSupported,
  generateChallenge,
  verifySignature,
  storeCredential,
  getStoredCredentials,
  clearCredentials,
  type PasskeyProviderProps,
  type PasskeyCredential,
  type PasskeyRegistrationOptions,
  type PasskeyAuthenticationOptions,
  type PasskeyAuthenticationResult,
  type PasskeyState,
  type PasskeyConfig,
} from './passkeys'

// ============================================
// Paymaster Module (ERC-4337)
// ============================================

export {
  PaymasterProvider,
  usePaymaster,
  PaymasterClient,
  createPaymasterConfig,
  type PaymasterProviderProps,
  type PaymasterChain,
  type PaymasterConfig,
  type PaymasterPolicy,
  type UserOperation,
  type UserOperationResult,
  type SendUserOperationOptions,
} from './paymaster'

// ============================================
// Aptos Module
// ============================================

export {
  AptosProvider,
  useAptosWallet,
  getAccountResources,
  getBalance,
  submitTransaction,
  type AptosProviderProps,
  type AptosNetwork,
  type AptosConfig,
  type AptosWalletState,
  type AptosTransactionOptions,
  type AptosTransactionResult,
} from './aptos'

// ============================================
// Sui Module
// ============================================

export {
  SuiProvider,
  useSuiWallet,
  getCoins,
  getBalance as getSuiBalance,
  executeTransaction,
  type SuiProviderProps,
  type SuiNetwork,
  type SuiConfig,
  type SuiWalletState,
  type SuiTransactionResult,
} from './sui'

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
  defaultChain: 'evm' as ChainType,
  supportedChains: ['evm', 'solana', 'ton', 'aptos', 'sui'] as ChainType[],
  enableEvm: true,
  enableSolana: true,
  enableTon: true,
  enableAptos: true,
  enableSui: true,
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
