// ============================================
// UI Components - ChainSelector
// ============================================

import React, { useState, useRef, useEffect } from 'react'
import { useWallet, ChainType } from '../core/provider'

// Chain configuration
export interface ChainInfo {
  id: string | number
  name: string
  type: ChainType
  icon?: string
  color: string
}

export const SUPPORTED_CHAINS: ChainInfo[] = [
  { id: 1, name: 'Ethereum', type: 'evm', color: '#627eea' },
  { id: 8453, name: 'Base', type: 'evm', color: '#0052ff' },
  { id: 42161, name: 'Arbitrum', type: 'evm', color: '#28a0f0' },
  { id: 137, name: 'Polygon', type: 'evm', color: '#8247e5' },
  { id: 'mainnet-beta', name: 'Solana', type: 'solana', color: '#9945ff' },
  { id: 'devnet', name: 'Solana Devnet', type: 'solana', color: '#9945ff' },
  { id: '-239', name: 'TON', type: 'ton', color: '#0098ea' },
]

// ChainSelector Props
export interface ChainSelectorProps {
  /** Show only chains that are supported */
  supportedChains?: ChainInfo[]
  /** Show network icons */
  showIcons?: boolean
  /** Custom className */
  className?: string
  /** On chain change handler */
  onChainChange?: (chain: ChainInfo) => void
}

export function ChainSelector({
  supportedChains = SUPPORTED_CHAINS,
  showIcons = true,
  className = '',
  onChainChange,
}: ChainSelectorProps) {
  const { state, chain, switchChain, connect } = useWallet()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentChain = supportedChains.find(c => 
    c.type === chain && c.id === state.chainId
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectChain = async (chainInfo: ChainInfo) => {
    try {
      // If not connected, connect with this chain
      if (!state.isConnected) {
        await connect(chainInfo.type)
      } else {
        await switchChain(chainInfo.id)
      }
      onChainChange?.(chainInfo)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to switch chain:', error)
    }
  }

  // Group chains by type
  const evmChains = supportedChains.filter(c => c.type === 'evm')
  const solanaChains = supportedChains.filter(c => c.type === 'solana')
  const tonChains = supportedChains.filter(c => c.type === 'ton')

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '8px',
          border: '1px solid #333',
          backgroundColor: '#1a1a2e',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '14px',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {currentChain ? (
          <>
            {showIcons && currentChain.color && (
              <span
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: currentChain.color,
                }}
              />
            )}
            {currentChain.name}
          </>
        ) : (
          'Select Chain'
        )}
        <span style={{ 
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
          fontSize: '10px',
        }}>
          ▼
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '8px',
            backgroundColor: '#1a1a2e',
            borderRadius: '12px',
            padding: '8px',
            minWidth: '200px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            zIndex: 1000,
          }}
        >
          {/* EVM */}
          {evmChains.length > 0 && (
            <div>
              <div style={{ 
                padding: '8px 12px', 
                fontSize: '12px', 
                color: '#888',
                textTransform: 'uppercase',
              }}>
                EVM Chains
              </div>
              {evmChains.map(chain => (
                <ChainItem
                  key={`evm-${chain.id}`}
                  chain={chain}
                  isActive={state.chainId === chain.id && chain.type === 'evm'}
                  showIcon={showIcons}
                  onClick={() => handleSelectChain(chain)}
                />
              ))}
            </div>
          )}

          {/* Solana */}
          {solanaChains.length > 0 && (
            <div>
              <div style={{ 
                padding: '8px 12px', 
                fontSize: '12px', 
                color: '#888',
                textTransform: 'uppercase',
                marginTop: '8px',
              }}>
                Solana
              </div>
              {solanaChains.map(chain => (
                <ChainItem
                  key={`solana-${chain.id}`}
                  chain={chain}
                  isActive={state.chainId === chain.id && chain.type === 'solana'}
                  showIcon={showIcons}
                  onClick={() => handleSelectChain(chain)}
                />
              ))}
            </div>
          )}

          {/* TON */}
          {tonChains.length > 0 && (
            <div>
              <div style={{ 
                padding: '8px 12px', 
                fontSize: '12px', 
                color: '#888',
                textTransform: 'uppercase',
                marginTop: '8px',
              }}>
                TON
              </div>
              {tonChains.map(chain => (
                <ChainItem
                  key={`ton-${chain.id}`}
                  chain={chain}
                  isActive={state.chainId === chain.id && chain.type === 'ton'}
                  showIcon={showIcons}
                  onClick={() => handleSelectChain(chain)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Chain Item Component
interface ChainItemProps {
  chain: ChainInfo
  isActive: boolean
  showIcon: boolean
  onClick: () => void
}

function ChainItem({ chain, isActive, showIcon, onClick }: ChainItemProps) {
  return (
    <button
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 12px',
        border: 'none',
        borderRadius: '8px',
        backgroundColor: isActive ? '#2a2a4e' : 'transparent',
        color: '#fff',
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: '14px',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = '#2a2a4e'
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      {showIcon && (
        <span
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: chain.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          {chain.name[0]}
        </span>
      )}
      <span style={{ flex: 1 }}>{chain.name}</span>
      {isActive && (
        <span style={{ color: '#22c55e' }}>✓</span>
      )}
    </button>
  )
}

export default ChainSelector
