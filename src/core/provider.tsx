// ============================================
// Core Provider - React Context Provider
// ============================================

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { ChainType, WalletState, WalletContextValue } from './adapter'

// Re-export types
export type { ChainType, WalletState, WalletContextValue, WalletProviderProps } from './adapter'
export { DEFAULT_WALLET_STATE } from './adapter'

// Mock adapters for now - will be replaced with real implementations
const DEFAULT_STATE: WalletState = {
  isConnected: false,
  address: null,
  chain: null,
  chainId: null,
  balance: null,
  isConnecting: false,
  error: null,
}

export const WalletContext = createContext<WalletContextValue | null>(null)

// Provider Component
export interface WalletProviderProps {
  children: ReactNode
  /** Enable auto-connect on mount */
  autoConnect?: boolean
  /** LocalStorage key for persisting connection */
  storageKey?: string
  /** Callback when wallet connects */
  onConnect?: (address: string, chain: ChainType) => void
  /** Callback when wallet disconnects */
  onDisconnect?: () => void
  /** Callback on error */
  onError?: (error: string) => void
}

export function WalletProvider({
  children,
  autoConnect = false,
  storageKey = 'unichain-wallet',
  onConnect,
  onDisconnect,
  onError,
}: WalletProviderProps) {
  const [state, setState] = useState<WalletState>(DEFAULT_STATE)
  const [activeChain, setActiveChain] = useState<ChainType | null>(null)

  // Connect action
  const connect = useCallback(async (chain?: ChainType) => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }))
    
    try {
      // If chain specified, set it
      if (chain) {
        setActiveChain(chain)
        setStorageItem(`${storageKey}-chain`, chain)
      } else {
        // Try to restore from storage
        const savedChain = localStorage?.getItem(`${storageKey}-chain`) as ChainType | null
        if (savedChain) {
          setActiveChain(savedChain)
        }
      }
      
      // TODO: Replace with actual wallet connection logic
      // For now, just simulate connection
      setState(prev => ({
        ...prev,
        isConnecting: false,
        // isConnected: true,
        // address: '0x1234...',
      }))
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Connection failed'
      setState(prev => ({ ...prev, isConnecting: false, error: errorMsg }))
      onError?.(errorMsg)
    }
  }, [storageKey, onError])

  // Disconnect action
  const disconnect = useCallback(async () => {
    try {
      // TODO: Replace with actual wallet disconnect logic
      setState(DEFAULT_STATE)
      setActiveChain(null)
      localStorage?.removeItem(`${storageKey}-address`)
      localStorage?.removeItem(`${storageKey}-chain`)
      onDisconnect?.()
    } catch (error) {
      console.error('Disconnect error:', error)
    }
  }, [storageKey, onDisconnect])

  // Switch chain
  const switchChain = useCallback(async (chainId: string | number) => {
    setState(prev => ({ ...prev, chainId }))
    // TODO: Trigger wallet chain switch
  }, [])

  // Sign message
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!state.isConnected) {
      throw new Error('Wallet not connected')
    }
    // TODO: Implement actual signing based on chain
    return ''
  }, [state.isConnected])

  // Send transaction
  const sendTransaction = useCallback(async (
    to: string,
    value: string,
    data?: string
  ): Promise<string> => {
    if (!state.isConnected) {
      throw new Error('Wallet not connected')
    }
    // TODO: Implement actual transaction
    return ''
  }, [state.isConnected])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      const savedAddress = localStorage?.getItem(`${storageKey}-address`)
      if (savedAddress) {
        connect()
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

// Hook to use wallet
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

// Export context for advanced use
export { WalletContext }
