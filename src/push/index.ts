// ============================================
// Push Protocol Module - Real Web3 Notifications
// Push (previously EPNS) Integration
// ============================================

import { useState, useCallback, useEffect, ReactNode, createContext, useContext } from 'react'

// Types
export interface PushNotification {
  id: string
  title: string
  body: string
  icon?: string
  url?: string
  timestamp: number
  read: boolean
  channel?: string
}

export interface PushConfig {
  env?: 'staging' | 'prod'
  projectId?: string
  signer?: any
}

export interface ChannelInfo {
  channel: string
  name: string
  icon: string
  subscriberCount: number
  description?: string
}

// Push Protocol API endpoints
const PUSH_API: Record<'staging' | 'prod', { epns: string; api: string }> = {
  staging: {
    epns: 'https://staging.push.org',
    api: 'https://backend.staging.push.org',
  },
  prod: {
    epns: 'https://push.org',
    api: 'https://backend.push.org',
  },
}

// Context
interface PushContextValue {
  isInitialized: boolean
  notifications: PushNotification[]
  channels: ChannelInfo[]
  initialize: (address: string) => Promise<void>
  subscribe: (channel: string) => Promise<void>
  unsubscribe: (channel: string) => Promise<void>
  sendNotification: (channel: string, notification: Omit<PushNotification, 'id' | 'timestamp' | 'read'>) => Promise<void>
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  getNotifications: (limit?: number) => Promise<PushNotification[]>
  getChannels: () => Promise<ChannelInfo[]>
}

const PushContext = createContext<PushContextValue | null>(null)

// Provider
export function PushProvider({ children, config }: { children: ReactNode; config?: PushConfig }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [notifications, setNotifications] = useState<PushNotification[]>([])
  const [channels, setChannels] = useState<ChannelInfo[]>([])
  const [userAddress, setUserAddress] = useState<string | null>(null)
  
  const env = config?.env || 'prod'
  const api = PUSH_API[env].api

  // Initialize with user address
  const initialize = useCallback(async (address: string) => {
    setUserAddress(address)
    setIsInitialized(true)
    
    // Fetch initial notifications
    try {
      const response = await fetch(
        `${api}/v1/users/${address}/notifications?limit=20`
      )
      
      if (response.ok) {
        const data = await response.json()
        const notifs: PushNotification[] = data.notifications?.map((n: any) => ({
          id: n.sid || n.messageId,
          title: n.title || n.notification?.title,
          body: n.body || n.notification?.body,
          icon: n.icon || n.notification?.icon,
          url: n.url || n.notification?.url,
          timestamp: n.timestamp * 1000,
          read: !!n.read,
          channel: n.channel,
        })) || []
        
        setNotifications(notifs)
      }
    } catch (e) {
      console.error('Error fetching notifications:', e)
    }
  }, [api])

  // Subscribe to a channel
  const subscribe = useCallback(async (channel: string) => {
    if (!userAddress) {
      throw new Error('Push not initialized')
    }

    try {
      // In production, use Push SDK to subscribe
      // This involves signing a message and making API call
      const response = await fetch(`${api}/v1/channels/${channel}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: userAddress.toLowerCase(),
          channelAddress: channel.toLowerCase(),
          // signature would be needed in production
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to subscribe')
      }
    } catch (e) {
      console.error('Subscribe error:', e)
      throw e
    }
  }, [userAddress, api])

  // Unsubscribe from a channel
  const unsubscribe = useCallback(async (channel: string) => {
    if (!userAddress) {
      throw new Error('Push not initialized')
    }

    try {
      const response = await fetch(`${api}/v1/channels/${channel}/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: userAddress.toLowerCase(),
          channelAddress: channel.toLowerCase(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to unsubscribe')
      }
    } catch (e) {
      console.error('Unsubscribe error:', e)
      throw e
    }
  }, [userAddress, api])

  // Send notification (requires channel owner)
  const sendNotification = useCallback(async (
    channel: string,
    notification: Omit<PushNotification, 'id' | 'timestamp' | 'read'>
  ) => {
    if (!userAddress) {
      throw new Error('Push not initialized')
    }

    try {
      const response = await fetch(`${api}/v1/notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: channel.toLowerCase(),
          recipient: userAddress.toLowerCase(),
          notification: {
            title: notification.title,
            body: notification.body,
            icon: notification.icon,
          },
          payload: {
            url: notification.url,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send notification')
      }
    } catch (e) {
      console.error('Send notification error:', e)
      throw e
    }
  }, [userAddress, api])

  // Mark as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  // Get notifications (refresh)
  const getNotifications = useCallback(async (limit = 20): Promise<PushNotification[]> => {
    if (!userAddress) return []

    try {
      const response = await fetch(
        `${api}/v1/users/${userAddress}/notifications?limit=${limit}`
      )
      
      if (response.ok) {
        const data = await response.json()
        return data.notifications?.map((n: any) => ({
          id: n.sid || n.messageId,
          title: n.title || n.notification?.title,
          body: n.body || n.notification?.body,
          icon: n.icon || n.notification?.icon,
          url: n.url || n.notification?.url,
          timestamp: n.timestamp * 1000,
          read: !!n.read,
          channel: n.channel,
        })) || []
      }
    } catch (e) {
      console.error('Error fetching notifications:', e)
    }
    
    return []
  }, [userAddress, api])

  // Get subscribed channels
  const getChannels = useCallback(async (): Promise<ChannelInfo[]> => {
    if (!userAddress) return []

    try {
      const response = await fetch(
        `${api}/v1/users/${userAddress}/channels`
      )
      
      if (response.ok) {
        const data = await response.json()
        return data.channels?.map((c: any) => ({
          channel: c.channelAddress,
          name: c.name,
          icon: c.icon,
          subscriberCount: c.subscriberCount,
          description: c.description,
        })) || []
      }
    } catch (e) {
      console.error('Error fetching channels:', e)
    }
    
    return []
  }, [userAddress, api])

  return (
    <PushContext.Provider value={{
      isInitialized,
      notifications,
      channels,
      initialize,
      subscribe,
      unsubscribe,
      sendNotification,
      markAsRead,
      markAllAsRead,
      getNotifications,
      getChannels,
    }}>
      {children}
    </PushContext.Provider>
  )
}

// Hook
export function usePush() {
  const context = useContext(PushContext)
  if (!context) {
    throw new Error('usePush must be used within PushProvider')
  }
  return context
}

// Convenience hooks
export function useNotifications() {
  const { notifications, markAsRead, markAllAsRead, getNotifications } = usePush()
  return { notifications, markAsRead, markAllAsRead, getNotifications }
}

export function useChannels() {
  const { channels, subscribe, unsubscribe, getChannels } = usePush()
  return { channels, subscribe, unsubscribe, getChannels }
}

// Export API endpoints for external use
export { PUSH_API }
