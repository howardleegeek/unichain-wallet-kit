// ============================================
// Core Provider - 统一 Provider (整合所有链)
// ============================================

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react'
import type { ChainType, WalletState, WalletContextValue, WalletProviderProps } from '../core/adapter'
import { getStorageItem, setStorageItem, removeStorageItem } from '../core/adapter'

// Re-export types
export type { ChainType, WalletState, WalletContextValue, WalletProviderProps } from '../core/adapter'

// ============================================
// Default State
// ============================================

const DEFAULT_STATE: WalletState = {
  isConnected: false,
  address: null,
  chain: null,
  chainId: null,
  balance: null,
  isConnecting: false,
  error: null,
}

// ============================================
// Context
// ============================================

export const WalletContext = createContext<WalletContextValue | null>(null)

// ============================================
// Provider Component
// ============================================

export interface UnifiedWalletProviderProps {
  children: ReactNode
  /** Enable auto-connect on mount */
  autoConnect?: boolean
  /** LocalStorage key for persisting connection */
  storageKey?: string
  /** Default chain to connect */
  defaultChain?: ChainType
  /** Enable EVM support */
  enableEvm?: boolean
  /** Enable Solana support */
  enableSolana?: boolean
  /** Enable TON support */
  enableTon?: boolean
  /** Callback when wallet connects */
  onConnect?: (address: string, chain: ChainType) => void
  /** Callback when wallet disconnects */
  onDisconnect?: () => void
  /** Callback on error */
  onError?: (error: string) => void
}

export function UnifiedWalletProvider({
  children,
  autoConnect = false,
  storageKey = 'unichain-wallet',
  defaultChain = 'evm',
  enableEvm = true,
  enableSolana = true,
  enableTon = true,
  onConnect,
  onDisconnect,
  onError,
}: UnifiedWalletProviderProps) {
  const [state, setState] = useState<WalletState>(DEFAULT_STATE)
  const [activeChain, setActiveChain] = useState<ChainType | null>(null)
  
  // Track which chain is actively connected
  const [evmConnected, setEvmConnected] = useState(false)
  const [solanaConnected, setSolanaConnected] = useState(false)
  const [tonConnected, setTonConnected] = useState(false)

  // Determine overall connection state based on individual chain states
  useEffect(() => {
    const isConnected = evmConnected || solanaConnected || tonConnected
    setState(prev => ({ ...prev, isConnected }))
  }, [evmConnected, solanaConnected, tonConnected])

  // Connect action
  const connect = useCallback(async (chain?: ChainType) => {
    const targetChain = chain || defaultChain
    setState(prev => ({ ...prev, isConnecting: true, error: null }))
    
    try {
      setActiveChain(targetChain)
      setStorageItem(`${storageKey}-chain`, targetChain)
      
      // Note: Actual connection is handled by individual chain providers
      // This sets the intent
      setState(prev => ({
        ...prev,
        isConnecting: false,
        chain: targetChain,
      }))
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Connection failed'
      setState(prev => ({ ...prev, isConnecting: false, error: errorMsg }))
      onError?.(errorMsg)
    }
  }, [defaultChain, storageKey, onError])

  // Disconnect action
  const disconnect = useCallback(async () => {
    try {
      setEvmConnected(false)
      setSolanaConnected(false)
      setTonConnected(false)
      setState(DEFAULT_STATE)
      setActiveChain(null)
      removeStorageItem(`${storageKey}-address`)
      removeStorageItem(`${storageKey}-chain`)
      onDisconnect?.()
    } catch (error) {
      console.error('Disconnect error:', error)
    }
  }, [storageKey, onDisconnect])

  // Switch chain
  const switchChain = useCallback(async (chainId: string | number) => {
    setState(prev => ({ ...prev, chainId }))
    // Note: Actual chain switch is handled by individual chain providers
  }, [])

  // Sign message - delegates to appropriate chain
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!state.isConnected) {
      throw new Error('Wallet not connected')
    }
    // This would be implemented based on active chain
    // For now, throw error - real implementation would delegate to chain-specific signer
    throw new Error('Use chain-specific signer')
  }, [state.isConnected])

  // Send transaction - delegates to appropriate chain
  const sendTransaction = useCallback(async (
    to: string,
    value: string,
    data?: string
  ): Promise<string> => {
    if (!state.isConnected) {
      throw new Error('Wallet not connected')
    }
    // This would be implemented based on active chain
    throw new Error('Use chain-specific transaction')
  }, [state.isConnected])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      const savedChain = getStorageItem(`${storageKey}-chain`) as ChainType | null
      if (savedChain) {
        connect(savedChain)
      }
    }
  }, [autoConnect, storageKey, connect])

  // Computed values
  const isEvm = activeChain === 'evm'
  const isSolana = activeChain === 'solana'
  const isTon = activeChain === 'ton'

  const value: WalletContextValue = {
    state,
    chain: activeChain,
    connect,
    disconnect,
    switchChain,
    signMessage,
    sendTransaction,
    isEvm,
    isSolana,
    isTon,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

// ============================================
// Simple Provider (Backward Compatibility)
// ============================================

export interface SimpleWalletProviderProps {
  children: ReactNode
  autoConnect?: boolean
  storageKey?: string
  onConnect?: (address: string, chain: ChainType) => void
  onDisconnect?: () => void
  onError?: (error: string) => void
}

export function SimpleWalletProvider({
  children,
  autoConnect = false,
  storageKey = 'unichain-wallet',
  onConnect,
  onDisconnect,
  onError,
}: SimpleWalletProviderProps) {
  return (
    <UnifiedWalletProvider
      autoConnect={autoConnect}
      storageKey={storageKey}
      onConnect={onConnect}
      onDisconnect={onDisconnect}
      onError={onError}
    >
      {children}
    </UnifiedWalletProvider>
  )
}

// ============================================
// useWallet Hook
// ============================================

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

// Hook to get wallet state only
export function useWalletState() {
  const { state } = useWallet()
  return state
}

// Hook to get connection status
export function useIsConnected() {
  const { state } = useWallet()
  return state.isConnected
}

// Hook to get address
export function useAddress() {
  const { state } = useWallet()
  return state.address
}

// Hook to get chain
export function useChain() {
  const { chain } = useWallet()
  return chain
}

// ============================================
// Utility Functions
// ============================================

export function formatAddress(address: string, chars: number = 4): string {
  if (!address) return ''
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}


