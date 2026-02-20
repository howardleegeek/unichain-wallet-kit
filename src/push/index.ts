// ============================================
// Push Protocol Module - Notifications
// Web3 推送通知
// ============================================

import { useState, useCallback, ReactNode, createContext, useContext } from 'react'

// ============================================
// Types
// ============================================

export interface PushNotification {
  id: string
  title: string
  body: string
  icon?: string
  url?: string
  timestamp: number
  read: boolean
}

export interface PushConfig {
  env?: 'staging' | 'prod'
  epnsProjectID?: string
}

// ============================================
// Context
// ============================================

interface PushContextValue {
  isInitialized: boolean
  notifications: PushNotification[]
  initialize: () => Promise<void>
  subscribe: (channel: string) => Promise<void>
  unsubscribe: (channel: string) => Promise<void>
  sendNotification: (notification: Omit<PushNotification, 'id' | 'timestamp' | 'read'>) => Promise<void>
  markAsRead: (id: string) => void
  markAllAsRead: () => void
}

const PushContext = createContext<PushContextValue | null>(null)

// ============================================
// Provider
// ============================================

export interface PushProviderProps {
  children: ReactNode
  config?: PushConfig
}

export function PushProvider({ children, config }: PushProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [notifications, setNotifications] = useState<PushNotification[]>([])

  // 初始化
  const initialize = useCallback(async () => {
    // TODO: 集成 EPNS SDK
    setIsInitialized(true)
  }, [])

  // 订阅频道
  const subscribe = useCallback(async (channel: string) => {
    console.log('Subscribing to channel:', channel)
  }, [])

  // 取消订阅
  const unsubscribe = useCallback(async (channel: string) => {
    console.log('Unsubscribing from channel:', channel)
  }, [])

  // 发送通知
  const sendNotification = useCallback(async (
    notification: Omit<PushNotification, 'id' | 'timestamp' | 'read'>
  ) => {
    const newNotification: PushNotification = {
      ...notification,
      id: `notif_${Date.now()}`,
      timestamp: Date.now(),
      read: false,
    }
    setNotifications(prev => [newNotification, ...prev])
  }, [])

  // 标记已读
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }, [])

  // 全部标记已读
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  return (
    <PushContext.Provider value={{
      isInitialized,
      notifications,
      initialize,
      subscribe,
      unsubscribe,
      sendNotification,
      markAsRead,
      markAllAsRead,
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
