// ============================================
// Next.js Multi-Chain Example
// ============================================

'use client'

import { WalletProvider, useWallet, ConnectButton, ChainSelector } from 'unichain-wallet-kit'
import { useState } from 'react'

// Home Page
export default function Home() {
  return (
    <WalletProvider autoConnect={true}>
      <main style={{ 
        minHeight: '100vh', 
        padding: '40px',
        fontFamily: 'system-ui, sans-serif',
        backgroundColor: '#0a0a0a',
        color: '#fff'
      }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>
          Multi-Chain DApp
        </h1>
        <p style={{ color: '#888', marginBottom: '40px' }}>
          Built with unichain-wallet-kit
        </p>
        
        <NFTSection />
        <TransferSection />
      </main>
    </WalletProvider>
  )
}

// NFT Section
function NFTSection() {
  const { state, sendTransaction } = useWallet()
  const [buying, setBuying] = useState(false)
  
  const handleBuy = async () => {
    if (!state.isConnected) {
      alert('Please connect wallet first')
      return
    }
    
    setBuying(true)
    try {
      // Mock transaction
      const txHash = await sendTransaction(
        '0x742d35Cc6634C0532925a3b8D4C8db86fB5C4A7E',
        '0.01'
      )
      alert(`Purchase successful! Hash: ${txHash.slice(0, 20)}...`)
    } catch (error) {
      if (error.code === 4001) {
        alert('Transaction rejected by user')
      } else {
        alert('Transaction failed: ' + (error.message || 'Unknown error'))
      }
    } finally {
      setBuying(false)
    }
  }
  
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '24px',
    }}>
      <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>🔥 Hot NFTs</h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        <NFTCard 
          name="Bored Ape #1234"
          price="0.5 ETH"
          image="/nft1.png"
          onBuy={handleBuy}
          buying={buying}
          isConnected={state.isConnected}
        />
        <NFTCard 
          name="Punk #5678"
          price="1.2 ETH"
          image="/nft2.png"
          onBuy={handleBuy}
          buying={buying}
          isConnected={state.isConnected}
        />
        <NFTCard 
          name="Azuki #9012"
          price="0.8 ETH"
          image="/nft3.png"
          onBuy={handleBuy}
          buying={buying}
          isConnected={state.isConnected}
        />
      </div>
    </div>
  )
}

function NFTCard({ name, price, image, onBuy, buying, isConnected }: {
  name: string
  price: string
  image: string
  onBuy: () => void
  buying: boolean
  isConnected: boolean
}) {
  return (
    <div style={{
      backgroundColor: '#252525',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      <div style={{
        height: '160px',
        backgroundColor: '#333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '48px',
      }}>
        🎨
      </div>
      <div style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>{name}</h3>
        <p style={{ color: '#888', fontSize: '12px', marginBottom: '12px' }}>{price}</p>
        
        {isConnected ? (
          <button
            onClick={onBuy}
            disabled={buying}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: buying ? '#666' : '#6366f1',
              color: '#fff',
              cursor: buying ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {buying ? 'Processing...' : 'Buy Now'}
          </button>
        ) : (
          <ConnectButton 
            size="sm" 
            children="Connect to Buy"
          />
        )}
      </div>
    </div>
  )
}

// Transfer Section
function TransferSection() {
  const { state } = useWallet()
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [sending, setSending] = useState(false)
  
  const handleSend = async () => {
    if (!state.isConnected) {
      alert('Please connect wallet first')
      return
    }
    if (!to || !amount) {
      alert('Please enter address and amount')
      return
    }
    
    setSending(true)
    // Mock send
    setTimeout(() => {
      alert(`Sent ${amount} to ${to.slice(0, 10)}...`)
      setSending(false)
      setTo('')
      setAmount('')
    }, 1000)
  }
  
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '16px',
      padding: '24px',
    }}>
      <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>💸 Send Tokens</h2>
      
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Recipient address"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          style={{
            flex: '1',
            minWidth: '200px',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #333',
            backgroundColor: '#252525',
            color: '#fff',
          }}
        />
        <input
          type="text"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{
            width: '120px',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #333',
            backgroundColor: '#252525',
            color: '#fff',
          }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !state.isConnected}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: sending || !state.isConnected ? '#666' : '#22c55e',
            color: '#fff',
            cursor: sending || !state.isConnected ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
      
      {state.isConnected && (
        <p style={{ marginTop: '12px', color: '#888', fontSize: '14px' }}>
          Connected: {state.address?.slice(0, 10)}...{state.address?.slice(-8)}
        </p>
      )}
    </div>
  )
}
