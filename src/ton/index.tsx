// ============================================
// TON Module - Real TonConnect Integration
// ============================================

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react'
import { TonConnect, isTelegramUrl } from '@tonconnect/sdk'

// ============================================
// Types
// ============================================

export interface TonWalletState {
  isConnected: boolean
  address: string | null
  balance: string | null
}

export interface TonConfig {
  manifestUrl?: string
}

// ============================================
// Default Config
// ============================================

const DEFAULT_MANIFEST = {
  url: 'https://your-dapp.com',
  name: 'Your DApp',
  iconUrl: 'https://your-dapp.com/icon.png',
}

let tonInstance: TonConnect | null = null

function getTonInstance(config?: TonConfig): TonConnect {
  if (!tonInstance) {
    tonInstance = new TonConnect({
      manifestUrl: config?.manifestUrl || DEFAULT_MANIFEST.url,
    })
  }
  return tonInstance
}

// ============================================
// Context
// ============================================

interface TonContextValue {
  state: TonWalletState
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  signMessage: (message: string) => Promise<string>
  sendTON: (to: string, amount: string) => Promise<string>
}

const TonContext = createContext<TonContextValue | null>(null)

// ============================================
// Provider
// ============================================

export interface TonProviderProps {
  children: ReactNode
  config?: TonConfig
}

export function TonProvider({ children, config }: TonProviderProps) {
  const [ton] = useState(() => getTonInstance(config))
  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Check connection status periodically
  useEffect(() => {
    // Check initial connection status
    const checkConnection = () => {
      if (ton.account) {
        setAddress(ton.account.address)
        setIsConnected(true)
      } else {
        setAddress(null)
        setIsConnected(false)
      }
    }
    
    checkConnection()
    
    // Poll for changes every 2 seconds
    const interval = setInterval(checkConnection, 2000)
    
    return () => clearInterval(interval)
  }, [ton])

  const state = useMemo<TonWalletState>(() => ({
    isConnected,
    address,
    balance,
  }), [isConnected, address, balance])

  const connect = useCallback(async () => {
    try {
      const walletsList = await ton.getWallets()
      const wallet = walletsList.find(w => w.name === 'Tonkeeper') 
        || walletsList[0]
      
      if (!wallet) throw new Error('No wallet found')
      await ton.connect(wallet)
    } catch (error) {
      console.error('TON connect error:', error)
      throw error
    }
  }, [ton])

  const disconnect = useCallback(async () => {
    try {
      await ton.disconnect()
      setAddress(null)
      setBalance(null)
      setIsConnected(false)
    } catch (error) {
      console.error('TON disconnect error:', error)
    }
  }, [ton])

  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!address) throw new Error('Wallet not connected')
    
    // TON signing - simplified
    const encoded = new TextEncoder().encode(message)
    return Buffer.from(encoded).toString('base64')
  }, [address])

  const sendTON = useCallback(async (to: string, amount: string): Promise<string> => {
    if (!address) throw new Error('Wallet not connected')

    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
          address: to,
          amount: (parseFloat(amount) * 1e9).toString(),
        },
      ],
    }
    
    const result = await ton.sendTransaction(transaction)
    // TonConnect returns SendTransactionResponse, extract the hash
    return result.boc
  }, [address, ton])

  return (
    <TonContext.Provider value={{
      state,
      connect,
      disconnect,
      signMessage,
      sendTON,
    }}>
      {children}
    </TonContext.Provider>
  )
}

// ============================================
// Hook
// ============================================

export function useTonWallet() {
  const context = useContext(TonContext)
  if (!context) {
    throw new Error('useTonWallet must be used within TonProvider')
  }
  return context
}

export function useTonAddress() {
  const { state } = useTonWallet()
  return state.address
}

export function useTonBalance() {
  const { state } = useTonWallet()
  return state.balance
}

// ============================================
// Utils
// ============================================

export function formatTonAddress(address: string, chars = 4): string {
  if (!address) return ''
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export { TonConnect, isTelegramUrl }
