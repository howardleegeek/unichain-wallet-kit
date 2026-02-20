// ============================================
// The Graph Module - Blockchain Data Indexing
// Subgraph Query + GraphQL
// ============================================

// ============================================
// Types
// ============================================

/**
 * GraphQL 查询结果
 */
export interface GraphQueryResult<T> {
  data?: T
  errors?: Array<{
    message: string
    locations?: Array<{ line: number; column: number }>
    path?: string[]
  }>
}

/**
 * Subgraph 配置
 */
export interface SubgraphConfig {
  /** Subgraph 端点 */
  endpoint: string
  /** 链 */
  chain: string
  /** 网络 ID */
  networkId: number
}

/**
 * 常用 Subgraph 端点
 */
export const SUBGRAPH_ENDPOINTS: Record<string, Record<string, string>> = {
  // Uniswap V3
  uniswap: {
    '1': 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
    '8453': 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-base',
  },
  // Aave
  aave: {
    '1': 'https://api.thegraph.com/subgraphs/name/aave/aave-v3',
    '8453': 'https://api.thegraph.com/subgraphs/name/aave/aave-v3-base',
  },
  // Compound
  compound: {
    '1': 'https://api.thegraph.com/subgraphs/name/compound-finance/compound-v3',
  },
  // Curve
  curve: {
    '1': 'https://api.thegraph.com/subgraphs/name/curvefi/curve-v1',
  },
  // ENS
  ens: {
    '1': 'https://api.thegraph.com/subgraphs/name/ensdomains/ens',
  },
  // Lens Protocol
  lens: {
    '1': 'https://api.thegraph.com/subgraphs/name/lens-protocol/lens',
  },
  // OpenSea
  opensea: {
    '1': 'https://api.thegraph.com/subgraphs/name/opensea-v2/seaport',
  },
  // Uniswap V2 (legacy)
  uniswapV2: {
    '1': 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
  },
}

// ============================================
// Graph Client
// ============================================

/**
 * The Graph Client
 */
export class GraphClient {
  private endpoint: string

  constructor(endpoint: string) {
    this.endpoint = endpoint
  }

  /**
   * 执行 GraphQL 查询
   */
  async query<T>(query: string, variables?: Record<string, any>): Promise<GraphQueryResult<T>> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      })

      const result = await response.json()
      return result as GraphQueryResult<T>
    } catch (error) {
      console.error('Graph query failed:', error)
      return {
        errors: [{ message: error instanceof Error ? error.message : 'Unknown error' }],
      }
    }
  }
}

// ============================================
// React Hooks
// ============================================

import { useState, useCallback, useEffect } from 'react'

/**
 * 创建 Graph Client 的 Hook
 */
export function useGraphClient(endpoint: string) {
  const [client] = useState(() => new GraphClient(endpoint))

  const query = useCallback(async <T,>(
    query: string,
    variables?: Record<string, any>
  ): Promise<GraphQueryResult<T>> => {
    return client.query<T>(query, variables)
  }, [client])

  return { client, query }
}

// ============================================
// Pre-built Queries
// ============================================

/**
 * 获取钱包的代币余额
 */
export const GET_TOKEN_BALANCES = `
  query GetTokenBalances($owner: String!) {
    tokens(where: { balances_: { account: $owner } }) {
      id
      symbol
      name
      decimals
      balances(where: { account: $owner }) {
        amount
      }
    }
  }
`

/**
 * 获取钱包的 NFT
 */
export const GET_NFTS = `
  query GetNFTs($owner: String!) {
    tokens(where: { 
      owner: $owner,
      uri_not: null
    }) {
      id
      identifier
      contract {
        id
        name
        symbol
      }
      uri
      owner {
        id
      }
    }
  }
`

/**
 * 获取交易历史
 */
export const GET_TRANSACTIONS = `
  query GetTransactions($owner: String!, $first: Int = 10) {
    swaps(where: { 
      token0_: { symbol: "WETH" }
    }, first: $first, orderBy: timestamp, orderDirection: desc) {
      id
      timestamp
      token0 {
        id
        symbol
      }
      token1 {
        id
        symbol
      }
      amount0
      amount1
      pool {
        token0 {
          symbol
        }
        token1 {
          symbol
        }
      }
    }
  }
`

/**
 * 获取池子信息
 */
export const GET_POOLS = `
  query GetPools($tokenA: String!, $tokenB: String!, $first: Int = 10) {
    pools(where: { 
      token0: $tokenA,
      token1: $tokenB
    }, first: $first, orderBy: totalValueLockedUSD, orderDirection: desc) {
      id
      token0 {
        id
        symbol
        decimals
      }
      token1 {
        id
        symbol
        decimals
      }
      feeTier
      liquidity
      totalValueLockedUSD
      volumeUSD
    }
  }
`

/**
 * 获取 ENS 域名
 */
export const GET_ENS_NAME = `
  query GetENSName($address: String!) {
    domains(where: { owner: $address, resolvedName_not: null }) {
      name
      resolvedName
      registrationDate
    }
  }
`

/**
 * 获取 Aave 存款
 */
export const GET_AAVE_DEPOSITS = `
  query GetAaveDeposits($user: String!) {
    deposits(where: { user: $user }, first: 10, orderBy: timestamp, orderDirection: desc) {
      id
      amount
      asset
      user {
        id
      }
      timestamp
    }
  }
`

// ============================================
// Utility Functions
// ============================================

/**
 * 创建预配置的 Client
 */
export function createSubgraphClient(name: string, chainId: string | number): GraphClient | null {
  const endpoints = SUBGRAPH_ENDPOINTS[name]
  if (!endpoints) return null

  const chainKey = chainId.toString()
  const endpoint = endpoints[chainKey]
  if (!endpoint) return null

  return new GraphClient(endpoint)
}

/**
 * 获取 Aave 数据
 */
export async function getAaveHealthFactor(
  user: string,
  chainId: number = 1
): Promise<string | null> {
  const client = createSubgraphClient('aave', chainId)
  if (!client) return null

  const result = await client.query<{
    users: Array<{ healthFactor: string }>
  }>(`
    query GetHealthFactor($user: String!) {
      users(where: { id: $user }) {
        healthFactor
      }
    }
  `, { user: user.toLowerCase() })

  return result.data?.users[0]?.healthFactor || null
}

/**
 * 获取池子 TVL
 */
export async function getPoolTVL(
  tokenA: string,
  tokenB: string,
  chainId: number = 1
): Promise<string | null> {
  const client = createSubgraphClient('uniswap', chainId)
  if (!client) return null

  const result = await client.query<{
    pools: Array<{ totalValueLockedUSD: string }>
  }>(GET_POOLS, { tokenA, tokenB, first: 1 })

  return result.data?.pools[0]?.totalValueLockedUSD || null
}
