// ============================================
// EVM Module - Real wagmi/viem Integration
// ============================================

import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react'
import { WagmiProvider, useAccount, useConnect, useDisconnect, useSignMessage, useSendTransaction, useSwitchChain, useBalance } from 'wagmi'
import { createConfig, http, injected } from 'wagmi'
import { mainnet, base, arbitrum, polygon, sepolia } from 'wagmi/chains'
import { parseEther, parseUnits, formatEther } from 'viem'

// ============================================
// Types
// ============================================

export interface EvmWalletState {
  isConnected: boolean
  address: `0x${string}` | null
  chainId: number | null
  balance: string | null
}

export interface EvmConfig {
  /** WalletConnect Project ID */
  projectId?: string
  /** Custom RPC URLs */
  rpcUrls?: Record<number, string>
  /** Auto connect */
  autoConnect?: boolean
}

export interface SendETHOptions {
  to: `0x${string}`
  value: string // in ETH
  data?: `0x${string}`
}

export interface SignMessageOptions {
  message: string
}

export interface TransactionReceipt {
  hash: `0x${string}`
  status: 'success' | 'reverted'
  blockNumber: bigint
}

// ============================================
// Default Config
// ============================================

const DEFAULT_CHAINS = [mainnet, base, arbitrum, polygon, sepolia] as const

const DEFAULT_RPC: Record<number, string> = {
  [mainnet.id]: 'https://eth.llamarpc.com',
  [base.id]: 'https://base.llamarpc.com',
  [arbitrum.id]: 'https://arb1.arbitrum.io/rpc',
  [polygon.id]: 'https://polygon.llamarpc.com',
  [sepolia.id]: 'https://sepolia.infura.io/v3/public',
}

function createDefaultConfig() {
  return createConfig({
    chains: DEFAULT_CHAINS,
    connectors: [
      injected({ target: 'metaMask' }),
      injected({ target: 'coinbaseWallet' }),
    ],
    transports: {
      [mainnet.id]: http(DEFAULT_RPC[mainnet.id]),
      [base.id]: http(DEFAULT_RPC[base.id]),
      [arbitrum.id]: http(DEFAULT_RPC[arbitrum.id]),
      [polygon.id]: http(DEFAULT_RPC[polygon.id]),
      [sepolia.id]: http(DEFAULT_RPC[sepolia.id]),
    },
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
  sendETH: (options: SendETHOptions) => Promise<`0x${string}`>
  switchChain: (chainId: number) => Promise<void>
}

const EvmContext = createContext<EvmContextValue | null>(null)

// ============================================
// Provider Component
// ============================================

export interface EvmProviderProps {
  children: ReactNode
  config?: EvmConfig
}

export function EvmProvider({ children, config }: EvmProviderProps) {
  const wagmiConfig = useMemo(() => createDefaultConfig(), [])
  
  const { address, isConnected, chainId } = useAccount()
  const { connect: wagmiConnect, connectors } = useConnect()
  const { disconnect: wagmiDisconnect } = useDisconnect()
  const { signMessageAsync } = useSignMessage()
  const { sendTransactionAsync } = useSendTransaction()
  const { switchChainAsync } = useSwitchChain()
  
  // Use balance only when address is available
  const { data: balanceData } = useBalance({
    address: address ?? '0x0',
    query: {
      enabled: !!address,
    }
  })

  // Wallet State
  const state = useMemo<EvmWalletState>(() => ({
    isConnected: isConnected ?? false,
    address: address ?? null,
    chainId: chainId ?? null,
    balance: balanceData?.formatted ?? null,
  }), [isConnected, address, chainId, balanceData])

  // Connect
  const connect = useCallback(async (connectorId?: string) => {
    const connector = connectorId
      ? connectors.find(c => c.uid === connectorId || c.name.toLowerCase().includes(connectorId.toLowerCase()))
      : connectors[0]
    
    if (connector) {
      await wagmiConnect({ connector })
    }
  }, [connectors, wagmiConnect])

  // Disconnect
  const disconnect = useCallback(async () => {
    await wagmiDisconnect()
  }, [wagmiDisconnect])

  // Sign Message
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!address) throw new Error('Wallet not connected')
    const result = await signMessageAsync({ message })
    return result
  }, [address, signMessageAsync])

  // Send ETH
  const sendETH = useCallback(async (options: SendETHOptions): Promise<`0x${string}`> => {
    if (!address) throw new Error('Wallet not connected')
    
    const hash = await sendTransactionAsync({
      to: options.to,
      value: parseEther(options.value),
      data: options.data,
    })
    
    return hash
  }, [address, sendTransactionAsync])

  // Switch Chain
  const switchChain = useCallback(async (chainId: number) => {
    await switchChainAsync({ chainId })
  }, [switchChainAsync])

  return (
    <WagmiProvider config={wagmiConfig}>
      <EvmContext.Provider value={{
        state,
        connect,
        disconnect,
        signMessage,
        sendETH,
        switchChain,
      }}>
        {children}
      </EvmContext.Provider>
    </WagmiProvider>
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
// Convenience Hooks
// ============================================

export function useIsConnected() {
  const { state } = useEvmWallet()
  return state.isConnected
}

export function useAddress() {
  const { state } = useEvmWallet()
  return state.address
}

export function useEvmBalance() {
  const { state } = useEvmWallet()
  return state.balance
}

export function useEvmChainId() {
  const { state } = useEvmWallet()
  return state.chainId
}

// ============================================
// Export wagmi hooks for advanced use
// ============================================

export { useAccount, useConnect, useDisconnect, useSignMessage, useSendTransaction, useSwitchChain, WagmiProvider }

// ============================================
// Utility Functions
// ============================================

export function parseETH(value: string): bigint {
  return parseEther(value)
}

export function formatETH(value: bigint): string {
  return formatEther(value)
}

export function formatAddress(address: `0x${string}`, chars: number = 4): string {
  if (!address) return ''
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

// Chain names
export const CHAIN_NAMES: Record<number, string> = {
  [mainnet.id]: 'Ethereum',
  [base.id]: 'Base',
  [arbitrum.id]: 'Arbitrum',
  [polygon.id]: 'Polygon',
  [sepolia.id]: 'Sepolia',
}

export { mainnet, base, arbitrum, polygon, sepolia }
