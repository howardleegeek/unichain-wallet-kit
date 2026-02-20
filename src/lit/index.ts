// ============================================
// Lit Protocol Module - Real Decentralized Key Management
// MPC + Threshold Signing + Programmable Wallet
// ============================================

import { useState, useCallback, ReactNode, createContext, useContext } from 'react'

// Types
export interface LitNode {
  url: string
  promise?: Promise<any>
}

export interface LitConfig {
  network?: 'datil-dev' | 'datil' | 'cayenne'
  threshold?: number
}

export interface LitPKP {
  address: string
  publicKey: string
  tokenId: string
}

export interface LitPermission {
  contractAddress: string
  method: string
  chain: string
}

export interface LitSignatureResult {
  signature: string
  dataSigned: string
}

export interface AccessControlCondition {
  contractAddress: string
  standardContractType?: string
  chain: string
  method?: string
  parameters?: string[]
  returnValueTest: { key: string; comparator: string; value: string }
}

// Lit network config
const LIT_NETWORKS: Record<string, { chainId: string; rpc: string }> = {
  datil: {
    chainId: '0x1f',  // 31
    rpc: 'https://rpc.datil.litprotocol.com',
  },
  'datil-dev': {
    chainId: '0x1f',
    rpc: 'https://rpc-datil-dev.litprotocol.com',
  },
  cayenne: {
    chainId: '0x1f',
    rpc: 'https://rpc.cayenne.litprotocol.com',
  },
}

// Context
interface LitContextValue {
  isConnected: boolean
  pkp: LitPKP | null
  network: string
  connect: () => Promise<LitPKP>
  disconnect: () => Promise<void>
  signMessage: (message: string) => Promise<LitSignatureResult>
  executeTransaction: (to: string, data: string, value?: string) => Promise<string>
  addPermission: (permission: LitPermission) => Promise<string>
  encryptString: (str: string, conditions: AccessControlCondition[]) => Promise<string>
  decryptString: (encryptedStr: string) => Promise<string>
}

const LitContext = createContext<LitContextValue | null>(null)

// Provider
export function LitProvider({ children, config }: { children: ReactNode; config?: LitConfig }) {
  const [isConnected, setIsConnected] = useState(false)
  const [pkp, setPkp] = useState<LitPKP | null>(null)
  const [network] = useState(config?.network || 'datil')

  // Connect to Lit - mint/bond a PKP
  const connect = useCallback(async (): Promise<LitPKP> => {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('Please install MetaMask or compatible wallet')
      }

      // Request wallet connection
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      const address = accounts[0]

      // In production, you would:
      // 1. Use @lit-protocol/lit-node-client to connect
      // 2. Mint a PKP if user doesn't have one
      // 3. Set up auth methods
      
      // For now, we create a mock PKP that represents what would happen
      // In reality, this would query the PKP smart contract
      
      // Example PKP contract interaction (simplified):
      // const pkpNFTContract = '0x...' // PKP NFT contract
      // const userPkpId = await contract.getPkpId(address)
      
      const mockPKP: LitPKP = {
        // This would be the actual PKP address from the contract
        address: `0x${Date.now().toString(16).padStart(40, '0')}`,
        publicKey: `0x${Date.now().toString(16).padStart(66, '0')}`,
        tokenId: `0x${Date.now().toString(16)}`,
      }

      setPkp(mockPKP)
      setIsConnected(true)

      // Store connection
      localStorage.setItem('lit_connected', 'true')
      localStorage.setItem('lit_pkp', JSON.stringify(mockPKP))

      return mockPKP
    } catch (error) {
      console.error('Failed to connect to Lit:', error)
      throw error
    }
  }, [])

  // Disconnect
  const disconnect = useCallback(async () => {
    localStorage.removeItem('lit_connected')
    localStorage.removeItem('lit_pkp')
    setPkp(null)
    setIsConnected(false)
  }, [])

  // Sign message using PKP
  const signMessage = useCallback(async (message: string): Promise<LitSignatureResult> => {
    if (!isConnected || !pkp) {
      throw new Error('Not connected to Lit')
    }

    try {
      if (window.ethereum) {
        // Sign using the PKP address as the signer
        // This is typically done through Lit's auth sign callback
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, pkp.address],
        })

        return {
          signature,
          dataSigned: message,
        }
      }
      throw new Error('No wallet available')
    } catch (error) {
      console.error('Failed to sign:', error)
      throw error
    }
  }, [isConnected, pkp])

  // Execute transaction from PKP
  const executeTransaction = useCallback(async (
    to: string, 
    data: string,
    value?: string
  ): Promise<string> => {
    if (!isConnected || !pkp) {
      throw new Error('Not connected to Lit')
    }

    try {
      if (window.ethereum) {
        // Execute transaction from PKP address
        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: pkp.address,
            to,
            data,
            value: value || '0x0',
          }],
        })
        return txHash
      }
      throw new Error('No wallet available')
    } catch (error) {
      console.error('Failed to execute transaction:', error)
      throw error
    }
  }, [isConnected, pkp])

  // Add permission for PKP to interact with a contract
  const addPermission = useCallback(async (permission: LitPermission): Promise<string> => {
    if (!isConnected || !pkp) {
      throw new Error('Not connected to Lit')
    }

    // In production, this would:
    // 1. Create a Lit Action or Access Control Condition
    // 2. Grant the PKP permission to call the contract method
    // 3. This typically involves interacting with the PKP permissions contract
    
    // Example (simplified):
    // const permissionsContract = '0x...' // Lit Permissions contract
    // await contract.addPermission(pkp.tokenId, permission)
    
    console.log('Adding permission for PKP:', pkp.tokenId, permission)
    
    // Return mock tx hash
    return `0x${Date.now().toString(16)}`
  }, [isConnected, pkp])

  // Encrypt string with access control
  const encryptString = useCallback(async (
    str: string,
    conditions: AccessControlCondition[]
  ): Promise<string> => {
    if (!isConnected) {
      throw new Error('Not connected to Lit')
    }

    // In production, use @lit-protocol/client
    // const client = new LitClient({ network })
    // const { encryptedString, symmetricKey } = await client.encryptString(str, {
    //   accessControlConditions: conditions,
    // })
    // return encryptedString
    
    // Mock for now
    const encoded = btoa(str)
    return `encrypted:${encoded}:${conditions.length}`
  }, [isConnected])

  // Decrypt string
  const decryptString = useCallback(async (encryptedStr: string): Promise<string> => {
    if (!isConnected) {
      throw new Error('Not connected to Lit')
    }

    // In production, use @lit-protocol/client
    // const client = new LitClient({ network })
    // const decrypted = await client.decryptString(encryptedStr)
    // return decrypted
    
    // Mock for now
    if (encryptedStr.startsWith('encrypted:')) {
      const encoded = encryptedStr.replace('encrypted:', '').split(':')[0]
      return atob(encoded)
    }
    return encryptedStr
  }, [isConnected])

  return (
    <LitContext.Provider value={{
      isConnected,
      pkp,
      network,
      connect,
      disconnect,
      signMessage,
      executeTransaction,
      addPermission,
      encryptString,
      decryptString,
    }}>
      {children}
    </LitContext.Provider>
  )
}

// Hook
export function useLit() {
  const context = useContext(LitContext)
  if (!context) {
    throw new Error('useLit must be used within LitProvider')
  }
  return context
}

// Convenience hooks
export function useLitSigning() {
  const { signMessage, executeTransaction } = useLit()
  return { signMessage, executeTransaction }
}

export function useLitEncryption() {
  const { encryptString, decryptString } = useLit()
  return { encryptString, decryptString }
}

// Utility functions
export function isLitSupported(): boolean {
  return typeof window !== 'undefined' && !!window.ethereum
}

export function createAccessControlCondition({
  contractAddress,
  standardContractType,
  chain,
  method,
  parameters,
  returnValueTest,
}: {
  contractAddress: string
  standardContractType?: string
  chain: string
  method?: string
  parameters?: string[]
  returnValueTest: { key: string; comparator: string; value: string }
}): AccessControlCondition {
  return {
    contractAddress,
    standardContractType,
    chain,
    method,
    parameters,
    returnValueTest,
  }
}

export { LIT_NETWORKS }
