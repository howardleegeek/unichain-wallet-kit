// ============================================
// Near Module - Near Blockchain
// ============================================

import { useState, useCallback, ReactNode, createContext, useContext } from 'react'

export type NearNetwork = 'mainnet' | 'testnet'

export interface NearWalletState {
  isConnected: boolean
  address: string | null
  network: NearNetwork
  balance: string | null
}

export interface NearProviderProps {
  children: ReactNode
  config?: { network?: NearNetwork }
}

export function NearProvider({ children, config }: NearProviderProps) {
  const [state, setState] = useState<NearWalletState>({
    isConnected: false,
    address: null,
    network: config?.network || 'mainnet',
    balance: null,
  })

  const connect = useCallback(async () => {
    // TODO: 集成 Near Wallet (nearwallet.io)
    setState(prev => ({ ...prev, isConnected: true, address: 'near1...' }))
  }, [])

  const disconnect = useCallback(async () => {
    setState({ isConnected: false, address: null, network: 'mainnet', balance: null })
  }, [])

  const callMethod = useCallback(async (contract: string, method: string, args: any) => {
    if (!state.address) throw new Error('Not connected')
    return { result: 'ok' }
  }, [state.address])

  return (
    <NearContext.Provider value={{ state, connect, disconnect, callMethod }}>
      {children}
    </NearContext.Provider>
  )
}

interface NearContextValue {
  state: NearWalletState
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  callMethod: (contract: string, method: string, args: any) => Promise<any>
}

const NearContext = createContext<NearContextValue | null>(null)

export function useNearWallet() {
  const context = useContext(NearContext)
  if (!context) throw new Error('useNearWallet must be used within NearProvider')
  return context
}
