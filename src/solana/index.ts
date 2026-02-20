// ============================================
// Solana Wallet Implementation - Wallet Adapter
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { ConnectionProvider, WalletProvider, useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'

// Solana Wallet State
export interface SolanaWalletState {
  isConnected: boolean
  address: string | null
  balance: number | null
  chain: string
}

// Solana Config
export interface SolanaConfig {
  rpcUrl?: string
  network?: 'mainnet-beta' | 'devnet' | 'testnet'
}

// Default RPC
const DEFAULT_RPC = 'https://api.mainnet-beta.solana.com'

export function createSolanaWallet(config: SolanaConfig = {}) {
  const { rpcUrl = DEFAULT_RPC, network = 'mainnet-beta' } = config
  return { rpcUrl, network }
}

// React Hook for Solana Wallet
export function useSolanaWallet() {
  const { publicKey, connected, connect, disconnect } = useWallet()
  const { connection } = useConnection()
  
  const [balance, setBalance] = useState<number | null>(null)
  const [connecting, setConnecting] = useState(false)

  const address = publicKey?.toBase58() || null

  // Fetch balance
  const fetchBalance = useCallback(async () => {
    if (!address || !connection) return null
    try {
      const bal = await connection.getBalance(new PublicKey(address))
      return bal / LAMPORTS_PER_SOL
    } catch {
      return null
    }
  }, [address, connection])

  useEffect(() => {
    if (address && connection) {
      fetchBalance().then(setBalance)
    } else {
      setBalance(null)
    }
  }, [address, connection, fetchBalance])

  const connectWallet = async () => {
    setConnecting(true)
    try {
      await connect()
    } finally {
      setConnecting(false)
    }
  }

  const signMessage = async (message: string): Promise<string> => {
    if (!publicKey) throw new Error('Wallet not connected')
    // Encode message
    const encoded = new TextEncoder().encode(message)
    // Sign using wallet
    const { signature } = await (window as any).solana.signMessage(encoded, 'utf8')
    return Buffer.from(signature).toString('base64')
  }

  const sendTransaction = async (to: string, amount: number): Promise<string> => {
    if (!publicKey || !connection) throw new Error('Wallet not connected')
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(to),
        lamports: amount * LAMPORTS_PER_SOL,
      })
    )
    
    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = publicKey
    
    const signed = await window.solana.signTransaction(transaction)
    const result = await connection.sendRawTransaction(signed.serialize())
    return result
  }

  return {
    isConnected: connected,
    address,
    balance,
    chain: 'solana',
    connect: connectWallet,
    disconnect: async () => disconnect(),
    signMessage,
    sendTransaction,
  }
}

// Provider Component
export interface SolanaProviderProps {
  children: React.ReactNode
  config?: SolanaConfig
}

export function SolanaProvider({ children, config }: SolanaProviderProps) {
  const { rpcUrl = DEFAULT_RPC, network = 'mainnet-beta' } = config || {}
  
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ]

  return (
    <ConnectionProvider endpoint={rpcUrl}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  )
}
