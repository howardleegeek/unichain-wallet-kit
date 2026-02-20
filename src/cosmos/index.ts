// ============================================
// Cosmos Module - IBC Cross-Chain
// ============================================

import { useState, useCallback, ReactNode, createContext, useContext } from 'react'

export type CosmosNetwork = 'cosmoshub' | 'osmosis' | 'juno' | 'secret'

export interface CosmosWalletState {
  isConnected: boolean
  address: string | null
  network: CosmosNetwork
  balance: string | null
}

export interface CosmosProviderProps {
  children: ReactNode
  config?: { network?: CosmosNetwork }
}

export function CosmosProvider({ children, config }: CosmosProviderProps) {
  const [state, setState] = useState<CosmosWalletState>({
    isConnected: false,
    address: null,
    network: config?.network || 'cosmoshub',
    balance: null,
  })

  const connect = useCallback(async () => {
    // TODO: 集成 Keplr Wallet
    setState(prev => ({ ...prev, isConnected: true, address: 'cosmos1...' }))
  }, [])

  const disconnect = useCallback(async () => {
    setState({ isConnected: false, address: null, network: 'cosmoshub', balance: null })
  }, [])

  const send = useCallback(async (to: string, amount: string) => {
    if (!state.address) throw new Error('Not connected')
    return { hash: `tx_${Date.now()}` }
  }, [state.address])

  return (
    <CosmosContext.Provider value={{ state, connect, disconnect, send }}>
      {children}
    </CosmosContext.Provider>
  )
}

interface CosmosContextValue {
  state: CosmosWalletState
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  send: (to: string, amount: string) => Promise<{ hash: string }>
}

const CosmosContext = createContext<CosmosContextValue | null>(null)

export function useCosmosWallet() {
  const context = useContext(CosmosContext)
  if (!context) throw new Error('useCosmosWallet must be used within CosmosProvider')
  return context
}
