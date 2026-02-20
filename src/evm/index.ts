// ============================================
// EVM Module - wagmi Integration
// ============================================

import { createConfig, http, useConnect, useAccount, useDisconnect, useSignMessage, useSendTransaction, useSwitchChain, useChainId } from 'wagmi'
import { mainnet, base, arbitrum, polygon } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

// EVM Wallet State
export interface EvmWalletState {
  isConnected: boolean
  address: string | null
  chainId: number | null
  balance: string | null
}

// EVM Config
export interface EvmConfig {
  projectId?: string
  chains?: typeof import('wagmi/chains').Chain[]
}

// Default chains
const defaultChains = [mainnet, base, arbitrum, polygon]

// Create wagmi config
export function createEvmWallet(config: EvmConfig = {}) {
  const { projectId, chains = defaultChains } = config

  const wagmiConfig = createConfig({
    chains,
    connectors: [
      injected({
        target: 'metaMask',
      }),
    ],
    transports: {
      [mainnet.id]: http(),
      [base.id]: http(),
      [arbitrum.id]: http(),
      [polygon.id]: http(),
    },
  })

  return {
    config: wagmiConfig,
    chains,
  }
}

// Context for EVM
const EvmContext = createContext<{
  isConnected: boolean
  address: string | null
  chainId: number | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  signMessage: (message: string) => Promise<string>
  sendTransaction: (to: string, value?: string, data?: string) => Promise<string>
  switchChain: (chainId: number) => Promise<void>
} | null>(null)

// Provider
export interface EvmProviderProps {
  children: ReactNode
  config?: EvmConfig
}

export function EvmProvider({ children, config }: EvmProviderProps) {
  const [mockState, setMockState] = useState({
    isConnected: false,
    address: null as string | null,
    chainId: null as number | null,
  })

  const connect = useCallback(async () => {
    // TODO: Implement actual wagmi connection
    setMockState({
      isConnected: true,
      address: '0x742d35Cc6634C0532925a3b8D4C8db86fB5C4A7E',
      chainId: 1,
    })
  }, [])

  const disconnect = useCallback(async () => {
    setMockState({
      isConnected: false,
      address: null,
      chainId: null,
    })
  }, [])

  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!mockState.isConnected) throw new Error('Not connected')
    // TODO: Implement actual signing
    return `signed:${message}`
  }, [mockState.isConnected])

  const sendTransaction = useCallback(async (
    to: string,
    value?: string,
    data?: string
  ): Promise<string> => {
    if (!mockState.isConnected) throw new Error('Not connected')
    // TODO: Implement actual transaction
    return `tx:${Date.now()}`
  }, [mockState.isConnected])

  const switchChain = useCallback(async (chainId: number) => {
    setMockState(prev => ({ ...prev, chainId }))
  }, [])

  return (
    <EvmContext.Provider value={{
      ...mockState,
      connect,
      disconnect,
      signMessage,
      sendTransaction,
      switchChain,
    }}>
      {children}
    </EvmContext.Provider>
  )
}

// React Hook for EVM Wallet
export function useEvmWallet() {
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { signMessageAsync } = useSignMessage()
  const { sendTransactionAsync } = useSendTransaction()

  const connectWallet = async (connectorName?: string) => {
    const connector = connectorName 
      ? connectors.find(c => c.name.toLowerCase().includes(connectorName.toLowerCase()))
      : connectors[0]
    if (connector) {
      await connect({ connector })
    }
  }

  const signMessage = async (message: string): Promise<string> => {
    return signMessageAsync({ message })
  }

  const sendTransaction = async (to: string, value?: string, data?: string): Promise<string> => {
    return sendTransactionAsync({
      to,
      value: value ? BigInt(value) : undefined,
      data: data as `0x${string}` | undefined,
    })
  }

  return {
    isConnected,
    address,
    chainId,
    connect: connectWallet,
    disconnect,
    signMessage,
    sendTransaction,
  }
}

// Re-export wagmi hooks for advanced use
export {
  useAccount,
  useConnect,
  useDisconnect,
  useSignMessage,
  useSendTransaction,
  useSwitchChain,
  useChainId,
}
