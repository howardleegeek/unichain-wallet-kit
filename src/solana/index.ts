// ============================================
// Solana Module - Wallet Adapter (真实 SDK)
// ============================================

import { useState, useEffect, useCallback, useMemo, ReactNode, createContext, useContext } from 'react'
import { ConnectionProvider, WalletProvider, useWallet, useConnection, useAnchorWallet } from '@solana/wallet-adapter-react'
import { PhantomWalletAdapter, SolflareWalletAdapter, LedgerWalletAdapter, SlopeWalletAdapter } from '@solana/wallet-adapter-wallets'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'

// ============================================
// Types
// ============================================

export interface SolanaWalletState {
  isConnected: boolean
  address: string | null
  balance: number | null
  chain: string
}

export interface SolanaConfig {
  rpcUrl?: string
  network?: 'mainnet-beta' | 'devnet' | 'testnet'
}

// ============================================
// Default Configuration
// ============================================

const DEFAULT_RPC: Record<string, string> = {
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
  'devnet': 'https://api.devnet.solana.com',
  'testnet': 'https://api.testnet.solana.com',
}

// ============================================
// Context
// ============================================

interface SolanaContextValue {
  state: SolanaWalletState
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  signMessage: (message: string) => Promise<string>
  sendTransaction: (to: string, amount: number) => Promise<string>
}

const SolanaContext = createContext<SolanaContextValue | null>(null)

// ============================================
// Provider
// ============================================

export interface SolanaProviderProps {
  children: ReactNode
  config?: SolanaConfig
}

export function SolanaProvider({ children, config }: SolanaProviderProps) {
  const { rpcUrl = DEFAULT_RPC['mainnet-beta'], network = 'mainnet-beta' } = config || {}
  
  // Get wallet hooks
  const { publicKey, connected, connect, disconnect } = useWallet()
  const { connection } = useConnection()
  const anchorWallet = useAnchorWallet()
  
  const [balance, setBalance] = useState<number | null>(null)

  const address = publicKey?.toBase58() || null

  // Fetch balance
  const fetchBalance = useCallback(async () => {
    if (!address || !connection) return null
    try {
      const bal = await connection.getBalance(new PublicKey(address))
      return bal / LAMPORTS_PER_SOL
    } catch (error) {
      console.error('Failed to fetch balance:', error)
      return null
    }
  }, [address, connection])

  // Update balance when address or connection changes
  useEffect(() => {
    if (address && connection) {
      fetchBalance().then(setBalance)
    } else {
      setBalance(null)
    }
  }, [address, connection, fetchBalance])

  // State
  const state: SolanaWalletState = useMemo(() => ({
    isConnected: connected ?? false,
    address,
    balance,
    chain: network,
  }), [connected, address, balance, network])

  // Connect
  const handleConnect = useCallback(async () => {
    try {
      await connect()
    } catch (error) {
      console.error('Solana connect error:', error)
      throw error
    }
  }, [connect])

  // Disconnect
  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect()
    } catch (error) {
      console.error('Solana disconnect error:', error)
      throw error
    }
  }, [disconnect])

  // Sign message
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!publicKey) throw new Error('Wallet not connected')
    
    try {
      // Check if wallet supports signMessage
      if (!('signMessage' in window.solana && typeof window.solana.signMessage === 'function')) {
        throw new Error('Wallet does not support signMessage')
      }
      
      const encoded = new TextEncoder().encode(message)
      const { signature } = await window.solana.signMessage(encoded, 'utf8')
      return Buffer.from(signature).toString('base64')
    } catch (error) {
      console.error('Solana sign error:', error)
      throw error
    }
  }, [publicKey])

  // Send transaction
  const sendTransaction = useCallback(async (to: string, amount: number): Promise<string> => {
    if (!publicKey || !connection) throw new Error('Wallet not connected')
    
    try {
      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(to),
          lamports: Math.floor(amount * LAMPORTS_PER_SOL),
        })
      )
      
      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey
      
      // Sign and send
      const signed = await window.solana.signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signed.serialize())
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed')
      
      return signature
    } catch (error) {
      console.error('Solana transaction error:', error)
      throw error
    }
  }, [publicKey, connection])

  return (
    <SolanaContext.Provider value={{
      state,
      connect: handleConnect,
      disconnect: handleDisconnect,
      signMessage,
      sendTransaction,
    }}>
      {children}
    </SolanaContext.Provider>
  )
}

// ============================================
// Wrapper with Connection & Wallet Provider
// ============================================

export interface SolanaWalletProviderProps {
  children: ReactNode
  config?: SolanaConfig
}

export function SolanaWalletProvider({ children, config }: SolanaWalletProviderProps) {
  const { rpcUrl = DEFAULT_RPC['mainnet-beta'], network = 'mainnet-beta' } = config || {}
  
  // Initialize wallets
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new SlopeWalletAdapter(),
    new LedgerWalletAdapter(),
  ], [])

  return (
    <ConnectionProvider endpoint={rpcUrl}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <SolanaProvider config={{ rpcUrl, network }}>
          {children}
        </SolanaProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

// ============================================
// Hook
// ============================================

export function useSolanaWallet() {
  const context = useContext(SolanaContext)
  if (!context) {
    throw new Error('useSolanaWallet must be used within SolanaWalletProvider')
  }
  return context
}

// ============================================
// Re-export for advanced use
// ============================================

export { useWallet, useConnection, useAnchorWallet }
export { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL }
