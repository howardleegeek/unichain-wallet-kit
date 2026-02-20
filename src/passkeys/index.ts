// ============================================
// Passkeys/WebAuthn Module - 无密码登录
// 基于 WebAuthn 标准实现
// ============================================

import { useState, useCallback, ReactNode, createContext, useContext } from 'react'

// ============================================
// Types
// ============================================

/**
 * Passkey 凭证
 */
export interface PasskeyCredential {
  id: string
  publicKey: string
  transports: AuthenticatorTransport[]
}

/**
 * Passkey 注册选项
 */
export interface PasskeyRegistrationOptions {
  challenge: string
  rp: {
    name: string
    id: string
  }
  user: {
    id: string
    name: string
    displayName: string
  }
  pubKeyCredParams: PublicKeyCredentialType[]
  timeout?: number
  excludeCredentials?: {
    id: string
    type: PublicKeyCredentialType
    transports: AuthenticatorTransport[]
  }[]
  authenticatorSelection?: {
    requireResidentKey?: boolean
    residentKey?: ResidentKeyRequirement
    authenticatorAttachment?: AuthenticatorAttachment
  }
}

/**
 * Passkey 认证选项
 */
export interface PasskeyAuthenticationOptions {
  challenge: string
  timeout?: number
  rpId?: string
  allowCredentials?: {
    id: string
    type: PublicKeyCredentialType
    transports: AuthenticatorTransport[]
  }[]
}

/**
 * Passkey 认证结果
 */
export interface PasskeyAuthenticationResult {
  credentialId: string
  authenticatorData: string
  clientDataJSON: string
  signature: string
}

/**
 * Passkey 状态
 */
export interface PasskeyState {
  isRegistered: boolean
  isSupported: boolean
  credentials: PasskeyCredential[]
}

/**
 * Passkey 配置
 */
export interface PasskeyConfig {
  /** Relying Party 名称 */
  rpName: string
  /** Relying Party ID */
  rpId?: string
  /** 允许的传输方式 */
  transports?: AuthenticatorTransport[]
}

// ============================================
// WebAuthn Core Functions
// ============================================

/**
 * 检查浏览器是否支持 WebAuthn
 */
export function isWebAuthnSupported(): boolean {
  if (typeof window === 'undefined') return false
  return !!(
    navigator.credentials &&
    navigator.credentials.create &&
    PublicKeyCredential
  )
}

/**
 * 生成随机挑战码
 */
export function generateChallenge(length: number = 32): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return arrayToBase64Url(array)
}

/**
 * Uint8Array 转 Base64URL
 */
function arrayToBase64Url(array: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...array))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Base64URL 转 Uint8Array
 */
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const decoded = atob(base64 + padding)
  const array = new Uint8Array(decoded.length)
  for (let i = 0; i < decoded.length; i++) {
    array[i] = decoded.charCodeAt(i)
  }
  return array
}

// ============================================
// Passkey Provider
// ============================================

interface PasskeyContextValue {
  state: PasskeyState
  /** 注册 Passkey */
  register: (username: string) => Promise<PasskeyCredential>
  /** 认证 Passkey */
  authenticate: (credentialId?: string) => Promise<PasskeyAuthenticationResult>
  /** 列出所有凭证 */
  listCredentials: () => Promise<PasskeyCredential[]>
  /** 删除凭证 */
  deleteCredential: (credentialId: string) => Promise<void>
}

const PasskeyContext = createContext<PasskeyContextValue | null>(null)

// Provider Props
export interface PasskeyProviderProps {
  children: ReactNode
  config: PasskeyConfig
}

export function PasskeyProvider({ children, config }: PasskeyProviderProps) {
  const [state, setState] = useState<PasskeyState>({
    isRegistered: false,
    isSupported: isWebAuthnSupported(),
    credentials: [],
  })

  // 注册 Passkey
  const register = useCallback(async (username: string): Promise<PasskeyCredential> => {
    if (!state.isSupported) {
      throw new Error('WebAuthn not supported')
    }

    const challenge = generateChallenge()
    const userId = generateChallenge(16)

    const options: PublicKeyCredentialCreationOptions = {
      challenge: base64UrlToUint8Array(challenge),
      rp: {
        name: config.rpName,
        id: config.rpId || window.location.hostname,
      },
      user: {
        id: base64UrlToUint8Array(userId),
        name: username,
        displayName: username,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      timeout: config.timeout || 60000,
      authenticatorSelection: {
        requireResidentKey: false,
        residentKey: 'preferred',
        authenticatorAttachment: 'platform',
      },
    }

    const credential = await navigator.credentials.create({
      publicKey: options,
    }) as PublicKeyCredential

    if (!credential) {
      throw new Error('Failed to create credential')
    }

    const response = credential.response as AuthenticatorAttestationResponse
    const newCredential: PasskeyCredential = {
      id: credential.id,
      publicKey: arrayToBase64Url(new Uint8Array(response.getPublicKey())),
      transports: credential.authenticatorAttachment ? ['internal'] : ['hybrid'],
    }

    // 保存到状态
    setState(prev => ({
      ...prev,
      isRegistered: true,
      credentials: [...prev.credentials, newCredential],
    }))

    return newCredential
  }, [state.isSupported, config])

  // 认证 Passkey
  const authenticate = useCallback(async (
    credentialId?: string
  ): Promise<PasskeyAuthenticationResult> => {
    if (!state.isSupported) {
      throw new Error('WebAuthn not supported')
    }

    const challenge = generateChallenge()

    const options: PublicKeyCredentialRequestOptions = {
      challenge: base64UrlToUint8Array(challenge),
      timeout: config.timeout || 60000,
      rpId: config.rpId || window.location.hostname,
      allowCredentials: credentialId ? [{
        id: base64UrlToUint8Array(credentialId),
        type: 'public-key',
        transports: config.transports || ['internal', 'hybrid', 'cross-platform'],
      }] : [],
    }

    const credential = await navigator.credentials.get({
      publicKey: options,
    }) as PublicKeyCredential

    if (!credential) {
      throw new Error('Failed to authenticate')
    }

    const response = credential.response as AuthenticatorAssertionResponse
    return {
      credentialId: credential.id,
      authenticatorData: arrayToBase64Url(new Uint8Array(response.authenticatorData)),
      clientDataJSON: arrayToBase64Url(new Uint8Array(response.clientDataJSON)),
      signature: arrayToBase64Url(new Uint8Array(response.signature)),
    }
  }, [state.isSupported, config])

  // 列出凭证
  const listCredentials = useCallback(async (): Promise<PasskeyCredential[]> => {
    // 实际应用中应该从服务器获取
    return state.credentials
  }, [state.credentials])

  // 删除凭证
  const deleteCredential = useCallback(async (credentialId: string): Promise<void> => {
    setState(prev => ({
      ...prev,
      credentials: prev.credentials.filter(c => c.id !== credentialId),
      isRegistered: prev.credentials.length > 1,
    }))
  }, [])

  return (
    <PasskeyContext.Provider value={{
      state,
      register,
      authenticate,
      listCredentials,
      deleteCredential,
    }}>
      {children}
    </PasskeyContext.Provider>
  )
}

// Hook
export function usePasskeys() {
  const context = useContext(PasskeyContext)
  if (!context) {
    throw new Error('usePasskeys must be used within PasskeyProvider')
  }
  return context
}

// ============================================
// Utility Functions
// ============================================

/**
 * 验证签名
 */
export async function verifySignature(
  credential: PasskeyCredential,
  authentication: PasskeyAuthenticationResult,
  challenge: string
): Promise<boolean> {
  // 实际应用中需要在服务器端验证
  // 这里简化实现
  return !!authentication.credentialId
}

/**
 * 存储凭证到 localStorage (仅开发环境)
 */
export function storeCredential(credential: PasskeyCredential): void {
  if (typeof window === 'undefined') return
  try {
    const credentials = JSON.parse(localStorage.getItem('passkey_credentials') || '[]')
    credentials.push(credential)
    localStorage.setItem('passkey_credentials', JSON.stringify(credentials))
  } catch {
    // Ignore
  }
}

/**
 * 从 localStorage 获取凭证
 */
export function getStoredCredentials(): PasskeyCredential[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('passkey_credentials') || '[]')
  } catch {
    return []
  }
}

/**
 * 清除所有凭证
 */
export function clearCredentials(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('passkey_credentials')
}
