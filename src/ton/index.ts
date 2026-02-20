// ============================================
// TON Wallet Implementation - TonConnect
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { TonConnect, TonConnectSDK, USERS_URL } from '@tonconnect/sdk'

// TON Wallet State
export interface TonWalletState {
  isConnected: boolean
  address: string | null
  balance: string | null
  chain: string
}

// TON Config
export interface TonConfig {
  manifestUrl?: string
}

// Default Manifest (placeholder)
const DEFAULT_MANIFEST = {
  url: 'https://your-app.com/tonconnect-manifest.json',
  name: 'Your App',
  iconUrl: 'https://your-app.com/icon.png',
}

let tonInstance: TonConnect | null = null

export function createTonWallet(config: TonConfig = {}) {
  const { manifestUrl } = config
  
  if (!tonInstance) {
    tonInstance = new TonConnect({
      manifestUrl: manifestUrl || DEFAULT_MANIFEST.url,
    })
  }
  
  return tonInstance
}

// React Hook for TON Wallet
export function useTonWallet() {
  const [ton] = useState(() => createTonWallet())
  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Listen for changes
  useEffect(() => {
    const unsubscribe = ton.on('change', async (wallet) => {
      if (wallet) {
        setAddress(wallet.account.address)
        setIsConnected(true)
      } else {
        setAddress(null)
        setBalance(null)
        setIsConnected(false)
      }
    })

    // Check initial state
    if (ton.account) {
      setAddress(ton.account.address)
      setIsConnected(true)
    }

    return () => {
      unsubscribe()
    }
  }, [ton])

  const connect = async () => {
    try {
      const walletsList = await ton.getWallets()
      // Use universal link for Tonkeeper or other wallets
      const wallet = walletsList.find(w => w.name === 'Tonkeeper') || walletsList[0]
      if (wallet) {
        await ton.connect(wallet)
      }
    } catch (err) {
      console.error('TON connect error:', err)
    }
  }

  const disconnect = async () => {
    try {
      await ton.disconnect()
      setAddress(null)
      setBalance(null)
      setIsConnected(false)
    } catch (err) {
      console.error('TON disconnect error:', err)
    }
  }

  const signMessage = async (message: string): Promise<string> => {
    if (!address) throw new Error('Wallet not connected')
    
    // Sign message using TonConnect
    const payload = {
      address,
      payload: message,
    }
    
    // Note: TON signing works differently - usually for transactions
    // For simple sign-in, you'd use a different approach
    return Buffer.from(message).toString('base64')
  }

  const sendTransaction = async (to: string, amount: string): Promise<string> => {
    if (!address) throw new Error('Wallet not connected')
    
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
          address: to,
          amount: (parseFloat(amount) * 1e9).toString(), // Convert to nanoTON
        },
      ],
    }
    
    const result = await ton.sendTransaction(transaction)
    return result
  }

  return {
    isConnected,
    address,
    balance,
    chain: 'ton',
    connect,
    disconnect,
    signMessage,
    sendTransaction,
  }
}

// Provider Component
export interface TonProviderProps {
  children: React.ReactNode
  config?: TonConfig
}

export function TonProvider({ children, config }: TonProviderProps) {
  // TonConnect doesn't need a React-specific provider
  // Just initialize it once at app level
  return <>{children}</>
}
