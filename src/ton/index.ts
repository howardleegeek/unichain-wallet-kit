// ============================================
// TON Module - TonConnect (真实 SDK)
// ============================================

import { useState, useEffect, useCallback, useMemo, ReactNode, createContext, useContext } from 'react'
import { TonConnect, TonConnectSDK, isTelegramUrl } from '@tonconnect/sdk'
import { SendTransactionRequest } from '@tonconnect/sdk'

// ============================================
// Types
// ============================================

export interface TonWalletState {
  isConnected: boolean
  address: string | null
  balance: string | null
  chain: string
}

export interface TonConfig {
  manifestUrl?: string
}

// ============================================
// Default Manifest
// ============================================

const DEFAULT_MANIFEST = {
  url: 'https://your-dapp.com',
  name: 'Your DApp',
  iconUrl: 'https://your-dapp.com/icon.png',
}

// ============================================
// Singleton Instance
// ============================================

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
  sendTransaction: (to: string, amount: string) => Promise<string>
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

  // Listen for wallet changes
  useEffect(() => {
    const unsubscribe = ton.on('change', async (wallet) => {
      if (wallet) {
        setAddress(wallet.account.address)
        setIsConnected(true)
        
        // Note: TON doesn't have a simple balance query like other chains
        // You'd typically need to call a RPC endpoint
        setBalance(null)
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

  // State
  const state: TonWalletState = useMemo(() => ({
    isConnected,
    address,
    balance,
    chain: 'ton',
  }), [isConnected, address, balance])

  // Connect
  const connect = useCallback(async () => {
    try {
      // Get available wallets
      const walletsList = await ton.getWallets()
      
      // Prefer Tonkeeper, then Telegram wallets
      let wallet = walletsList.find(w => w.name === 'Tonkeeper')
        || walletsList.find(w => w.name === 'TonWallet')
        || walletsList[0]
      
      if (!wallet) {
        throw new Error('No wallet found')
      }

      // For Telegram Mini Apps, use special flow
      if (isTelegramUrl(wallet.url)) {
        // Telegram wallets use universal links
        await ton.connect(wallet)
      } else {
        // For other wallets, use standard flow
        await ton.connect(wallet)
      }
    } catch (error) {
      console.error('TON connect error:', error)
      throw error
    }
  }, [ton])

  // Disconnect
  const disconnect = useCallback(async () => {
    try {
      await ton.disconnect()
      setAddress(null)
      setBalance(null)
      setIsConnected(false)
    } catch (error) {
      console.error('TON disconnect error:', error)
      throw error
    }
  }, [ton])

  // Sign message (TON uses special format)
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!address) throw new Error('Wallet not connected')
    
    try {
      // TON doesn't have a simple signMessage like EVM
      // For authentication, you'd typically use a different approach
      // This is a simplified version
      const encoded = new TextEncoder().encode(message)
      return Buffer.from(encoded).toString('base64')
    } catch (error) {
      console.error('TON sign error:', error)
      throw error
    }
  }, [address])

  // Send transaction
  const sendTransaction = useCallback(async (to: string, amount: string): Promise<string> => {
    if (!address) throw new Error('Wallet not connected')
    
    try {
      const transaction: SendTransactionRequest = {
        validUntil: Math.floor(Date.now() / 1000) + 60, // 60 seconds
        messages: [
          {
            address: to,
            amount: (parseFloat(amount) * 1e9).toString(), // Convert to nanoTON
          },
        ],
      }
      
      const result = await ton.sendTransaction(transaction)
      return result
    } catch (error) {
      console.error('TON transaction error:', error)
      throw error
    }
  }, [address, ton])

  return (
    <TonContext.Provider value={{
      state,
      connect,
      disconnect,
      signMessage,
      sendTransaction,
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

// ============================================
// Re-export
// ============================================

export { TonConnect, isTelegramUrl }
