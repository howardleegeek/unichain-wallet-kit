// ============================================
// EVM Module - wagmi Integration (真实 SDK)
// ============================================

import { createConfig, http, useAccount, useConnect, useDisconnect, useSignMessage, useSendTransaction, useSwitchChain, useChainId, useBalance, Config } from 'wagmi'
import { mainnet, base, arbitrum, polygon, sepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react'

// ============================================
// Types
// ============================================

export interface EvmWalletState {
  isConnected: boolean
  address: string | null
  chainId: number | null
  balance: string | null
}

export interface EvmConfig {
  /** WalletConnect Project ID */
  projectId?: string
  /** Custom chains */
  chains?: typeof import('wagmi/chains').Chain[]
  /** Enable wallet connect */
  enableWalletConnect?: boolean
}

// ============================================
// Default Configuration
// ============================================

const DEFAULT_CHAINS = [mainnet, base, arbitrum, polygon, sepolia]

// Default RPC URLs (free tier)
const DEFAULT_RPC_URLS: Record<number, string> = {
  [mainnet.id]: 'https://eth.llamarpc.com',
  [base.id]: 'https://base.llamarpc.com',
  [arbitrum.id]: 'https://arb1.arbitrum.io/rpc',
  [polygon.id]: 'https://polygon.llamarpc.com',
  [sepolia.id]: 'https://sepolia.infura.io/v3/public',
}

// ============================================
// Create EVM Config
// ============================================

export function createEvmConfig(config: EvmConfig = {}): Config {
  const { projectId, chains = DEFAULT_CHAINS, enableWalletConnect = true } = config

  const transports = chains.reduce((acc, chain) => {
    acc[chain.id] = http(DEFAULT_RPC_URLS[chain.id] || chain.rpcUrls.default.http[0])
    return acc
  }, {} as Record<number, ReturnType<typeof http>>)

  const connectors = [
    injected({
      target: 'metaMask',
    }),
    injected({
      target: 'coinbaseWallet',
    }),
  ]

  // Add WalletConnect if projectId provided
  if (projectId && enableWalletConnect) {
    connectors.push(
      walletConnect({
        projectId,
        qrModalOptions: {
          projectId,
        },
      })
    )
  }

  return createConfig({
    chains,
    connectors,
    transports,
  })
}

// ============================================
// Context
// ============================================

interface EvmContextValue {
  state: EvmWalletState
  connect: (connectorId?: string) => Promise<void>
  disconnect: () => Promise<void>
  signMessage: (message: string) => Promise<string>
  sendTransaction: (to: string, value?: string, data?: string) => Promise<string>
  switchChain: (chainId: number) => Promise<void>
}

const EvmContext = createContext<EvmContextValue | null>(null)

// ============================================
// Provider
// ============================================

export interface EvmProviderProps {
  children: ReactNode
  config?: EvmConfig
  /** Wagmi config - if provided, use external config */
  wagmiConfig?: Config
}

export function EvmProvider({ children, config, wagmiConfig }: EvmProviderProps) {
  // Account state
  const { address, isConnected, chainId } = useAccount({ config: wagmiConfig })
  const { connect: wagmiConnect, connectors } = useConnect({ config: wagmiConfig })
  const { disconnect: wagmiDisconnect } = useDisconnect({ config: wagmiConfig })
  const { signMessageAsync } = useSignMessage({ config: wagmiConfig })
  const { sendTransactionAsync } = useSendTransaction({ config: wagmiConfig })
  const { switchChain: wagmiSwitchChain } = useSwitchChain({ config: wagmiConfig })
  
  // Balance
  const { data: balanceData } = useBalance({
    address,
    config: wagmiConfig,
  })

  const state: EvmWalletState = useMemo(() => ({
    isConnected: isConnected ?? false,
    address: address ?? null,
    chainId: chainId ?? null,
    balance: balanceData ? balanceData.formatted : null,
  }), [isConnected, address, chainId, balanceData])

  // Connect
  const connect = useCallback(async (connectorId?: string) => {
    try {
      const connector = connectorId 
        ? connectors.find(c => c.uid === connectorId || c.name.toLowerCase().includes(connectorId.toLowerCase()))
        : connectors[0]
      
      if (connector) {
        await wagmiConnect({ connector })
      } else {
        // Try first available connector
        await wagmiConnect({ connector: connectors[0] })
      }
    } catch (error) {
      console.error('EVM connect error:', error)
      throw error
    }
  }, [connectors, wagmiConnect])

  // Disconnect
  const disconnect = useCallback(async () => {
    try {
      await wagmiDisconnect()
    } catch (error) {
      console.error('EVM disconnect error:', error)
      throw error
    }
  }, [wagmiDisconnect])

  // Sign message
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!address) throw new Error('Wallet not connected')
    try {
      const result = await signMessageAsync({ message })
      return result
    } catch (error) {
      console.error('EVM sign error:', error)
      throw error
    }
  }, [address, signMessageAsync])

  // Send transaction
  const sendTransaction = useCallback(async (
    to: string,
    value?: string,
    data?: string
  ): Promise<string> => {
    if (!address) throw new Error('Wallet not connected')
    try {
      const result = await sendTransactionAsync({
        to,
        value: value ? BigInt(value) : undefined,
        data: data as `0x${string}` | undefined,
      })
      return result
    } catch (error) {
      console.error('EVM transaction error:', error)
      throw error
    }
  }, [address, sendTransactionAsync])

  // Switch chain
  const switchChain = useCallback(async (chainId: number) => {
    try {
      await wagmiSwitchChain({ chainId })
    } catch (error) {
      console.error('EVM switch chain error:', error)
      throw error
    }
  }, [wagmiSwitchChain])

  return (
    <EvmContext.Provider value={{
      state,
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

// ============================================
// Hook
// ============================================

export function useEvmWallet() {
  const context = useContext(EvmContext)
  if (!context) {
    throw new Error('useEvmWallet must be used within EvmProvider')
  }
  return context
}

// ============================================
// Re-export wagmi hooks for advanced use
// ============================================

export {
  useAccount,
  useConnect,
  useDisconnect,
  useSignMessage,
  useSendTransaction,
  useSwitchChain,
  useChainId,
  useBalance,
}
