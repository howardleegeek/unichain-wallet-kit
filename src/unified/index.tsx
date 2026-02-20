// ============================================
// Unified Wallet Hook - Use any chain with one hook
// ============================================

import { useState, useCallback, useMemo, ReactNode, createContext, useContext } from 'react'

// ============================================
// Types
// ============================================

export type ChainType = 'evm' | 'solana' | 'ton'

export interface WalletState {
  isConnected: boolean
  address: string | null
  chain: ChainType | null
  chainId: string | number | null
  balance: string | null
}

export interface UnifiedWalletConfig {
  /** Default chain */
  defaultChain?: ChainType
  /** Auto connect on mount */
  autoConnect?: boolean
}

// ============================================
// Context
// ============================================

interface UnifiedWalletContextValue {
  state: WalletState
  chain: ChainType
  connect: (chain?: ChainType) => Promise<void>
  disconnect: () => Promise<void>
  switchChain: (chain: ChainType) => Promise<void>
}

const UnifiedWalletContext = createContext<UnifiedWalletContextValue | null>(null)

// ============================================
// Provider
// ============================================

export interface UnifiedWalletProviderProps {
  children: ReactNode
  config?: UnifiedWalletConfig
}

export function UnifiedWalletProvider({ children, config }: UnifiedWalletProviderProps) {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chain: config?.defaultChain || 'evm',
    chainId: null,
    balance: null,
  })

  const connect = useCallback(async (chain?: ChainType) => {
    const targetChain = chain || config?.defaultChain || 'evm'
    setState(prev => ({ ...prev, chain: targetChain }))
    // Note: Actual connection should be delegated to chain-specific providers
  }, [config?.defaultChain])

  const disconnect = useCallback(async () => {
    setState({
      isConnected: false,
      address: null,
      chain: config?.defaultChain || 'evm',
      chainId: null,
      balance: null,
    })
  }, [config?.defaultChain])

  const switchChain = useCallback(async (chain: ChainType) => {
    setState(prev => ({ ...prev, chain }))
  }, [])

  return (
    <UnifiedWalletContext.Provider value={{
      state,
      chain: state.chain || 'evm',
      connect,
      disconnect,
      switchChain,
    }}>
      {children}
    </UnifiedWalletContext.Provider>
  )
}

// ============================================
// Hook
// ============================================

export function useUnifiedWallet() {
  const context = useContext(UnifiedWalletContext)
  if (!context) {
    throw new Error('useUnifiedWallet must be used within UnifiedWalletProvider')
  }
  return context
}

// ============================================
// Convenience
// ============================================

export function useWalletAddress() {
  const { state } = useUnifiedWallet()
  return state.address
}

export function useIsWalletConnected() {
  const { state } = useUnifiedWallet()
  return state.isConnected
}

export function useWalletChain() {
  const { state } = useUnifiedWallet()
  return state.chain
}
