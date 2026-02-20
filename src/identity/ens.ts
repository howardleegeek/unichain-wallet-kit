// ============================================
// ENS Module - Ethereum Name Service
// Identity & Domain
// ============================================

import { useState, useCallback, ReactNode, createContext, useContext } from 'react'

// ============================================
// Types
// ============================================

export interface ENSInfo {
  name: string
  address: string
  avatar?: string
  description?: string
  email?: string
  url?: string
}

export interface ReverseRecord {
  address: string
  name: string | null
}

// ============================================
// Context
// ============================================

interface ENSContextValue {
  /** Lookup ENS name -> address */
  lookupAddress: (name: string) => Promise<string | null>
  /** Lookup address -> ENS name */
  lookupName: (address: string) => Promise<string | null>
  /** Get avatar URL */
  getAvatar: (name: string) => Promise<string | null>
  /** Get full ENS info */
  getInfo: (name: string) => Promise<ENSInfo | null>
}

const ENSContext = createContext<ENSContextValue | null>(null)

// ============================================
// Provider
// ============================================

export interface ENSProviderProps {
  children: ReactNode
}

export function ENSProvider({ children }: ENSProviderProps) {
  // Lookup ENS name to address
  const lookupAddress = useCallback(async (name: string): Promise<string | null> => {
    try {
      // Use ENS合约通过公共resolver
      const response = await fetch(`https://ensdata.net/${name}`)
      if (response.ok) {
        const data = await response.json()
        return data.address
      }
      return null
    } catch {
      return null
    }
  }, [])

  // Lookup address to ENS name
  const lookupName = useCallback(async (address: string): Promise<string | null> => {
    try {
      const response = await fetch(`https://ensdata.net/reverse/${address}`)
      if (response.ok) {
        const data = await response.json()
        return data.name
      }
      return null
    } catch {
      return null
    }
  }, [])

  // Get avatar
  const getAvatar = useCallback(async (name: string): Promise<string | null> => {
    try {
      const response = await fetch(`https://ensdata.net/avatar/${name}`)
      if (response.ok) {
        const data = await response.json()
        return data.avatar
      }
      return null
    } catch {
      return null
    }
  }, [])

  // Get full info
  const getInfo = useCallback(async (name: string): Promise<ENSInfo | null> => {
    try {
      const address = await lookupAddress(name)
      if (!address) return null

      const avatar = await getAvatar(name)

      return {
        name,
        address,
        avatar: avatar || undefined,
      }
    } catch {
      return null
    }
  }, [lookupAddress, getAvatar])

  return (
    <ENSContext.Provider value={{
      lookupAddress,
      lookupName,
      getAvatar,
      getInfo,
    }}>
      {children}
    </ENSContext.Provider>
  )
}

// Hook
export function useENS() {
  const context = useContext(ENSContext)
  if (!context) {
    throw new Error('useENS must be used within ENSProvider')
  }
  return context
}

// ============================================
// Utility Functions
// ============================================

/**
 * Validate ENS name
 */
export function isValidENSName(name: string): boolean {
  return name.endsWith('.eth') && name.length > 4
}

/**
 * Format ENS name for display
 */
export function formatENSName(name: string, chars: number = 6): string {
  if (!name || !isValidENSName(name)) return name
  if (name.length <= chars * 2) return name
  return `${name.slice(0, chars)}...${name.slice(-chars)}`
}
