// ============================================
// UI Components - ConnectButton
// ============================================

import React, { useState } from 'react'
import { useWallet, formatAddress } from '../core/provider'

// Button Styles
const buttonStyles: React.CSSProperties = {
  padding: '12px 24px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 600,
  transition: 'all 0.2s ease',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
}

const connectedStyles: React.CSSProperties = {
  backgroundColor: '#1a1a2e',
  color: '#fff',
}

const disconnectedStyles: React.CSSProperties = {
  backgroundColor: '#6366f1',
  color: '#fff',
}

const loadingStyles: React.CSSProperties = {
  backgroundColor: '#6366f1',
  color: '#fff',
  opacity: 0.7,
  cursor: 'wait',
}

// ConnectButton Props
export interface ConnectButtonProps {
  /** Show balance when connected */
  showBalance?: boolean
  /** Show chain indicator */
  showChain?: boolean
  /** Custom chain names */
  chainNames?: Record<string, string>
  /** Theme */
  variant?: 'primary' | 'secondary' | 'ghost'
  /** Size */
  size?: 'sm' | 'md' | 'lg'
  /** Custom className */
  className?: string
  /** Children */
  children?: React.ReactNode
  /** On click handler */
  onClick?: () => void
}

export function ConnectButton({
  showBalance = true,
  showChain = true,
  chainNames = { evm: 'EVM', solana: 'Solana', ton: 'TON' },
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  onClick,
}: ConnectButtonProps) {
  const { state, chain, connect, disconnect } = useWallet()
  const { isConnected, address, isConnecting, error, balance } = state
  const [showDropdown, setShowDropdown] = useState(false)

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '8px 16px', fontSize: '12px' },
    md: { padding: '12px 24px', fontSize: '14px' },
    lg: { padding: '16px 32px', fontSize: '16px' },
  }

  const getButtonStyle = () => {
    const base = {
      ...buttonStyles,
      ...sizeStyles[size],
    }
    
    if (isConnecting) {
      return { ...base, ...loadingStyles }
    }
    
    if (isConnected) {
      return { ...base, ...connectedStyles }
    }
    
    return { ...base, ...disconnectedStyles }
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
    }
    
    if (isConnected) {
      setShowDropdown(!showDropdown)
    } else {
      connect()
    }
  }

  const handleDisconnect = (e: React.MouseEvent) => {
    e.stopPropagation()
    disconnect()
    setShowDropdown(false)
  }

  // Render connected state
  if (isConnected && address) {
    return (
      <div style={{ position: 'relative' }}>
        <button
          className={className}
          style={getButtonStyle()}
          onClick={handleClick}
          disabled={isConnecting}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
          {showChain && chain && (
            <span style={{ opacity: 0.7 }}>{chainNames[chain]}</span>
          )}
          <span>{formatAddress(address)}</span>
          {showBalance && balance && (
            <span style={{ opacity: 0.7 }}>· {balance}</span>
          )}
        </button>
        
        {/* Dropdown menu */}
        {showDropdown && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              backgroundColor: '#1a1a2e',
              borderRadius: '8px',
              padding: '8px 0',
              minWidth: '150px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              zIndex: 1000,
            }}
          >
            <button
              style={{
                width: '100%',
                padding: '10px 16px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#fff',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              onClick={handleDisconnect}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2a2a4e')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    )
  }

  // Render disconnected state
  return (
    <button
      className={className}
      style={getButtonStyle()}
      onClick={handleClick}
      disabled={isConnecting}
    >
      {isConnecting ? (
        <>
          <span style={{ 
            width: '16px', 
            height: '16px', 
            border: '2px solid #fff', 
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          Connecting...
        </>
      ) : children || 'Connect Wallet'}
    </button>
  )
}

export default ConnectButton
