// ============================================
// Solana Module - Real Wallet Adapter Integration
// ============================================

import { useState, useEffect, useCallback, useMemo, ReactNode } from 'react'
import { ConnectionProvider, WalletProvider, useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PhantomWalletAdapter, SolflareWalletAdapter, LedgerWalletAdapter } from '@solana/wallet-adapter-wallets'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'

// Types
export interface SolanaWalletState {
  isConnected: boolean
  address: string | null
  balance: number | null
}

export interface SolanaConfig {
  rpcUrl?: string
  network?: 'mainnet-beta' | 'devnet' | 'testnet'
}

// Default Config
const DEFAULT_RPC: Record<string, string> = {
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
  'devnet': 'https://api.devnet.solana.com',
}

function getWallets() {
  return [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new LedgerWalletAdapter(),
  ]
}

// Context type
interface SolanaContextValue {
  state: SolanaWalletState
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  signMessage: (message: string) => Promise<string>
  sendSOL: (to: string, amount: number) => Promise<string>
}

// Provider Props
export interface SolanaProviderProps {
  children: React.ReactNode
  config?: SolanaConfig
}

// Simple Provider that wraps the wallet-adapter
export function SolanaProvider({ children, config }: SolanaProviderProps) {
  const rpcUrl = config?.rpcUrl || DEFAULT_RPC['mainnet-beta']
  const wallets = useMemo(() => getWallets(), [])
  
  return (
    <ConnectionProvider endpoint={rpcUrl}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <SolanaWalletAdapter>
          {children}
        </SolanaWalletAdapter>
      </WalletProvider>
    </ConnectionProvider>
  )
}

// Internal adapter component
function SolanaWalletAdapter({ children }: { children: React.ReactNode }) {
  const { publicKey, connected, connect, disconnect } = useWallet()
  const { connection } = useConnection()
  const [balance, setBalance] = useState<number | null>(null)

  const address = publicKey?.toBase58() || null

  // Fetch balance
  useEffect(() => {
    if (!address || !connection) {
      setBalance(null)
      return
    }

    const fetchBalance = async () => {
      try {
        const bal = await connection.getBalance(new PublicKey(address))
        setBalance(bal / LAMPORTS_PER_SOL)
      } catch {
        setBalance(null)
      }
    }

    fetchBalance()
  }, [address, connection])

  const state = useMemo<SolanaWalletState>(() => ({
    isConnected: connected,
    address,
    balance,
  }), [connected, address, balance])

  const handleConnect = useCallback(async () => {
    await connect()
  }, [connect])

  const handleDisconnect = useCallback(async () => {
    await disconnect()
  }, [disconnect])

  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!publicKey) throw new Error('Wallet not connected')
    if (!('signMessage' in window.solana)) {
      throw new Error('Wallet does not support signMessage')
    }
    const encoded = new TextEncoder().encode(message)
    const { signature } = await window.solana.signMessage(encoded, 'utf8')
    return Buffer.from(signature).toString('base64')
  }, [publicKey])

  const sendSOL = useCallback(async (to: string, amount: number): Promise<string> => {
    if (!publicKey || !connection) throw new Error('Wallet not connected')

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(to),
        lamports: Math.floor(amount * LAMPORTS_PER_SOL),
      })
    )

    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = publicKey

    const signed = await window.solana.signTransaction(transaction)
    const signature = await connection.sendRawTransaction(signed.serialize())
    
    return signature
  }, [publicKey, connection])

  // Store in window for access
  useEffect(() => {
    (window as any).__solanaWallet = { state, connect: handleConnect, disconnect: handleDisconnect, signMessage, sendSOL }
  }, [state, handleConnect, handleDisconnect, signMessage, sendSOL])

  return <>{children}</>
}

// Hook
export function useSolanaWallet() {
  const wallet = (window as any).__solanaWallet
  if (!wallet) {
    throw new Error('useSolanaWallet must be used within SolanaProvider')
  }
  return wallet
}

export function useSolanaAddress() {
  const { state } = useSolanaWallet()
  return state.address
}

export function useSolanaBalance() {
  const { state } = useSolanaWallet()
  return state.balance
}

export function formatSolAddress(address: string, chars = 4): string {
  if (!address) return ''
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export { useWallet, useConnection, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL }
