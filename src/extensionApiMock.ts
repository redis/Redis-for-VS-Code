/* eslint-disable no-console */
import * as vscode from 'vscode'

/*
 * Mock Extension API - Returns test data instead of making HTTP requests
 *
 * Usage: Replace the real extensionApi import with this mock for testing/development
 *
 * // In extension.ts for testing:
 * import * as extensionApi from './extensionApiMock' // Use mock instead of real API
 */

// Types (same as real API but extended to match actual database structure)
export interface DatabaseInstance {
  timeout?: number
  id: string
  host: string
  port: number
  name: string
  db?: number
  connectionType?: string
  provider?: string
  lastConnection?: string
  createdAt?: string
  modules?: any[]
  new?: boolean
  cloudDetails?: any
  version?: string
  tags?: any[]
}

export interface IndexDefinition {
  [key: string]: any
}

export interface CliCommandResponse {
  response: any
  status: 'success' | 'fail'
}

// Mock data - Using your exact database configuration (3 databases)
const MOCK_DATABASES: DatabaseInstance[] = [
  {
    timeout: 30000,
    id: 'd061eff6-58e4-486e-8cb5-ac6e250a7e39',
    host: '127.0.0.1',
    port: 6379,
    name: '127.0.0.1:6379',
    db: 0,
    connectionType: 'STANDALONE',
    provider: 'REDIS_COMMUNITY_EDITION',
    lastConnection: '2025-07-18T14:09:43.605Z',
    createdAt: '2025-03-10T12:35:42.000Z',
    modules: [
      {
        name: 'timeseries',
        version: 11205,
        semanticVersion: '1.12.5',
      },
      {
        name: 'redisgears_2',
        version: 20020,
      },
      {
        name: 'search',
        version: 21015,
        semanticVersion: '2.10.15',
      },
      {
        name: 'ReJSON',
        version: 20808,
        semanticVersion: '2.8.8',
      },
      {
        name: 'bf',
        version: 20805,
        semanticVersion: '2.8.5',
      },
    ],
    new: false,
    cloudDetails: null,
    version: '7.4.4',
    tags: [],
  },
  {
    timeout: 30000,
    id: '19a7bb8e-75e4-4249-8092-137451a50eae',
    host: '127.0.0.1',
    port: 6380,
    name: '127.0.0.1:6380',
    db: 0,
    connectionType: 'STANDALONE',
    provider: 'REDIS_STACK',
    lastConnection: '2025-07-17T20:16:45.773Z',
    createdAt: '2025-04-03T12:10:42.000Z',
    modules: [
      {
        name: 'timeseries',
        version: 11205,
        semanticVersion: '1.12.5',
      },
      {
        name: 'ReJSON',
        version: 20808,
        semanticVersion: '2.8.8',
      },
      {
        name: 'bf',
        version: 20805,
        semanticVersion: '2.8.5',
      },
      {
        name: 'search',
        version: 21010,
        semanticVersion: '2.10.10',
      },
      {
        name: 'redisgears_2',
        version: 20020,
      },
    ],
    new: false,
    cloudDetails: null,
    version: '7.4.2',
    tags: [],
  },
  {
    timeout: 30000,
    id: '1b1f8c08-f7d5-47a4-b225-eddb93b71c34',
    host: '127.0.0.1',
    port: 6381,
    name: '127.0.0.1:6381',
    db: 0,
    connectionType: 'STANDALONE',
    provider: 'REDIS_STACK',
    lastConnection: '2025-07-17T19:43:29.168Z',
    createdAt: '2025-05-07T08:08:15.000Z',
    modules: [
      {
        name: 'search',
        version: 21010,
        semanticVersion: '2.10.10',
      },
      {
        name: 'bf',
        version: 20805,
        semanticVersion: '2.8.5',
      },
      {
        name: 'timeseries',
        version: 11205,
        semanticVersion: '1.12.5',
      },
      {
        name: 'redisgears_2',
        version: 20020,
      },
      {
        name: 'ReJSON',
        version: 20808,
        semanticVersion: '2.8.8',
      },
    ],
    new: false,
    cloudDetails: null,
    version: '7.4.2',
    tags: [],
  },
]

// Updated mock indexes mapping to use your 3 database IDs with actual index names
const MOCK_INDEXES = {
  'd061eff6-58e4-486e-8cb5-ac6e250a7e39': ['idx:smpl_bicycle', 'idx:user_prefs', 'idx:smpl_restaurant'], // port 6379
  '19a7bb8e-75e4-4249-8092-137451a50eae': ['idx:bikes_vss', 'idx:smpl_bicycle', 'idx:user_prefs', 'idx:bicycle', 'idx:smpl_restaurant'], // port 6380
  '1b1f8c08-f7d5-47a4-b225-eddb93b71c34': ['idx:smpl_bicycle', 'idx:smpl_restaurant'], // port 6381
}

const MOCK_INDEX_DEFINITIONS = {
  'idx:smpl_bicycle': {
    index_name: 'idx:smpl_bicycle',
    index_type: 'HASH',
    index_definition: ['ON', 'HASH', 'PREFIX', '1', 'bicycle:'],
    attributes: [
      ['model', 'type', 'TEXT', 'SORTABLE'],
      ['brand', 'type', 'TEXT', 'SORTABLE'],
      ['price', 'type', 'NUMERIC', 'SORTABLE'],
      ['condition', 'type', 'TAG', 'SORTABLE'],
      ['description', 'type', 'TEXT'],
      ['year', 'type', 'NUMERIC', 'SORTABLE'],
    ],
    num_docs: '2,456',
    max_doc_id: '3000',
    num_terms: '8,234',
    num_records: '24,560',
    inverted_sz_mb: '4.12',
    vector_index_sz_mb: '0.00',
    total_inverted_index_blocks: '156',
    offset_vectors_sz_mb: '0.41',
    doc_table_size_mb: '1.85',
    sortable_values_size_mb: '0.92',
    key_table_size_mb: '0.18',
  },
  'idx:user_prefs': {
    index_name: 'idx:user_prefs',
    index_type: 'HASH',
    index_definition: ['ON', 'HASH', 'PREFIX', '1', 'user_prefs:'],
    attributes: [
      ['user_id', 'type', 'TAG'],
      ['theme', 'type', 'TAG', 'SORTABLE'],
      ['language', 'type', 'TAG', 'SORTABLE'],
      ['notifications', 'type', 'TAG'],
      ['created_at', 'type', 'NUMERIC', 'SORTABLE'],
      ['updated_at', 'type', 'NUMERIC', 'SORTABLE'],
    ],
    num_docs: '1,789',
    max_doc_id: '2500',
    num_terms: '456',
    num_records: '17,890',
    inverted_sz_mb: '0.87',
    vector_index_sz_mb: '0.00',
    total_inverted_index_blocks: '45',
    offset_vectors_sz_mb: '0.08',
    doc_table_size_mb: '0.65',
    sortable_values_size_mb: '0.32',
    key_table_size_mb: '0.12',
  },
  'idx:smpl_restaurant': {
    index_name: 'idx:smpl_restaurant',
    index_type: 'HASH',
    index_definition: ['ON', 'HASH', 'PREFIX', '1', 'restaurant:'],
    attributes: [
      ['name', 'type', 'TEXT', 'SORTABLE'],
      ['cuisine', 'type', 'TAG', 'SORTABLE'],
      ['rating', 'type', 'NUMERIC', 'SORTABLE'],
      ['price_range', 'type', 'TAG', 'SORTABLE'],
      ['location', 'type', 'GEO'],
      ['description', 'type', 'TEXT'],
    ],
    num_docs: '3,567',
    max_doc_id: '4500',
    num_terms: '12,345',
    num_records: '35,670',
    inverted_sz_mb: '6.78',
    vector_index_sz_mb: '0.00',
    total_inverted_index_blocks: '234',
    offset_vectors_sz_mb: '0.67',
    doc_table_size_mb: '2.89',
    sortable_values_size_mb: '1.45',
    key_table_size_mb: '0.34',
  },
  'idx:bikes_vss': {
    index_name: 'idx:bikes_vss',
    index_type: 'HASH',
    index_definition: ['ON', 'HASH', 'PREFIX', '1', 'bikes_vss:'],
    attributes: [
      ['model', 'type', 'TEXT', 'SORTABLE'],
      ['features', 'type', 'VECTOR', 'FLAT', '6', 'TYPE', 'FLOAT32', 'DIM', '512', 'DISTANCE_METRIC', 'COSINE'],
      ['category', 'type', 'TAG', 'SORTABLE'],
      ['price', 'type', 'NUMERIC', 'SORTABLE'],
      ['availability', 'type', 'TAG'],
    ],
    num_docs: '1,234',
    max_doc_id: '1500',
    num_terms: '5,678',
    num_records: '12,340',
    inverted_sz_mb: '3.45',
    vector_index_sz_mb: '15.67',
    total_inverted_index_blocks: '89',
    offset_vectors_sz_mb: '0.34',
    doc_table_size_mb: '1.23',
    sortable_values_size_mb: '0.67',
    key_table_size_mb: '0.15',
  },
  'idx:bicycle': {
    index_name: 'idx:bicycle',
    index_type: 'HASH',
    index_definition: ['ON', 'HASH', 'PREFIX', '1', 'bike:'],
    attributes: [
      ['title', 'type', 'TEXT', 'SORTABLE'],
      ['brand', 'type', 'TAG', 'SORTABLE'],
      ['type', 'type', 'TAG', 'SORTABLE'],
      ['size', 'type', 'TAG', 'SORTABLE'],
      ['price', 'type', 'NUMERIC', 'SORTABLE'],
      ['color', 'type', 'TAG'],
    ],
    num_docs: '4,321',
    max_doc_id: '5000',
    num_terms: '9,876',
    num_records: '43,210',
    inverted_sz_mb: '8.54',
    vector_index_sz_mb: '0.00',
    total_inverted_index_blocks: '287',
    offset_vectors_sz_mb: '0.85',
    doc_table_size_mb: '3.76',
    sortable_values_size_mb: '1.89',
    key_table_size_mb: '0.42',
  },
}

const MOCK_COMMAND_RESPONSES = {
  'INFO server': {
    redis_version: '7.4.4',
    redis_git_sha1: '00000000',
    redis_git_dirty: '0',
    redis_build_id: 'abcd1234',
    redis_mode: 'standalone',
    os: 'Linux 5.4.0-74-generic x86_64',
    arch_bits: '64',
    multiplexing_api: 'epoll',
    atomicvar_api: 'c11-builtin',
    gcc_version: '9.4.0',
    process_id: '1234',
    process_supervised: 'no',
    run_id: 'abcdef1234567890abcdef1234567890abcdef12',
    tcp_port: '6379',
    server_time_usec: '1703123456789012',
    uptime_in_seconds: '123456',
    uptime_in_days: '1',
    hz: '10',
    configured_hz: '10',
    lru_clock: '12345678',
    executable: '/usr/local/bin/redis-server',
    config_file: '/etc/redis/redis.conf',
    io_threads_active: '0',
  },
  PING: 'PONG',
  'SET test_key test_value': 'OK',
  'GET test_key': 'test_value',
  'KEYS *': ['user:1', 'user:2', 'product:1', 'product:2', 'order:1'],
  DBSIZE: '1234',
}

// Utility function to simulate async delay
const delay = (ms: number = 100) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Get all databases from mock data
 * @returns Promise<DatabaseInstance[]> Array of all database instances
 */
export async function getAllDatabases(): Promise<DatabaseInstance[]> {
  await delay() // Simulate network delay
  console.log('Mock: getAllDatabases called')
  return [...MOCK_DATABASES] // Return copy to prevent mutations
}

/**
 * Get index definition by database ID and index name (mock)
 * @param databaseId The database ID
 * @param indexName The name of the index
 * @returns Promise<IndexDefinition | null> The index definition or null if not found
 */
export async function getIndexDefinition(databaseId: string, indexName: string): Promise<IndexDefinition | null> {
  await delay()
  console.log(`Mock: getIndexDefinition called with databaseId=${databaseId}, indexName=${indexName}`)

  // Check if database exists
  const database = MOCK_DATABASES.find((db) => db.id === databaseId)
  if (!database) {
    console.warn(`Mock: Database '${databaseId}' not found`)
    return null
  }

  // Check if database has Redis Search module
  const hasSearchModule = database.modules?.some((module) =>
    ['search', 'searchlight', 'ft', 'ftl'].includes(module.name?.toLowerCase() || ''))

  if (!hasSearchModule) {
    console.warn(`Mock: Database '${databaseId}' does not have Redis Search module`)
    return null
  }

  // Return mock index definition
  const definition = MOCK_INDEX_DEFINITIONS[indexName as keyof typeof MOCK_INDEX_DEFINITIONS]
  if (!definition) {
    console.warn(`Mock: Index '${indexName}' not found`)
    return null
  }

  return { ...definition } // Return copy
}

/**
 * Get all indexes for a specific database (mock)
 * @param databaseId The database ID
 * @returns Promise<string[]> Array of index names
 */
export async function getAllIndexes(databaseId: string): Promise<string[]> {
  await delay()
  console.log(`Mock: getAllIndexes called with databaseId=${databaseId}`)

  // Check if database exists
  const database = MOCK_DATABASES.find((db) => db.id === databaseId)
  if (!database) {
    console.warn(`Mock: Database '${databaseId}' not found`)
    return []
  }

  // Check if database has Redis Search module
  const hasSearchModule = database.modules?.some((module) =>
    ['search', 'searchlight', 'ft', 'ftl'].includes(module.name?.toLowerCase() || ''))

  if (!hasSearchModule) {
    console.warn(`Mock: Database '${databaseId}' does not have Redis Search module`)
    return []
  }

  // Return mock indexes for this database
  const indexes = MOCK_INDEXES[databaseId as keyof typeof MOCK_INDEXES] || []
  return [...indexes] // Return copy
}

/**
 * Open CLI for a specific database (mock)
 * @param databaseId The database ID to open CLI for
 * @returns Promise<boolean> True if CLI was opened successfully
 */
export async function openCliForDatabase(databaseId: string): Promise<boolean> {
  await delay()
  console.log(`Mock: openCliForDatabase called with databaseId=${databaseId}`)

  // Check if database exists
  const database = MOCK_DATABASES.find((db) => db.id === databaseId)
  if (!database) {
    console.warn(`Mock: Database '${databaseId}' not found`)
    return false
  }

  try {
    // Simulate VS Code command execution
    await vscode.commands.executeCommand('RedisForVSCode.addCli', {
      data: { database },
    })

    console.log(`Mock: CLI opened successfully for database '${databaseId}'`)
    return true
  } catch (error) {
    console.error(`Mock: Error opening CLI for database '${databaseId}':`, error)
    return false
  }
}

/**
 * Execute a custom Redis command on a database (mock)
 * @param databaseId The database ID
 * @param command The Redis command to execute
 * @returns Promise<any> The command response
 */
export async function executeRedisCommand(databaseId: string, command: string): Promise<any> {
  await delay()
  console.log(`Mock: executeRedisCommand called with databaseId=${databaseId}, command=${command}`)

  // Check if database exists
  const database = MOCK_DATABASES.find((db) => db.id === databaseId)
  if (!database) {
    console.warn(`Mock: Database '${databaseId}' not found`)
    return null
  }

  // Return mock response based on command
  const upperCommand = command.toUpperCase().trim()

  // Handle specific commands
  const matchedCommand = Object.entries(MOCK_COMMAND_RESPONSES).find(([mockCommand]) =>
    upperCommand.startsWith(mockCommand.toUpperCase()),
  )

  if (matchedCommand) {
    console.log(`Mock: Returning mock response for command '${command}'`)
    return matchedCommand[1]
  }

  // Handle FT commands for Redis Search
  if (upperCommand.startsWith('FT.')) {
    if (upperCommand.startsWith('FT._LIST')) {
      const indexes = MOCK_INDEXES[databaseId as keyof typeof MOCK_INDEXES] || []
      return indexes
    }

    if (upperCommand.startsWith('FT.INFO')) {
      const indexName = command.split(' ')[1]
      const definition = MOCK_INDEX_DEFINITIONS[indexName as keyof typeof MOCK_INDEX_DEFINITIONS]
      if (definition) {
        // Convert to FT.INFO response format (array of key-value pairs)
        const response: any[] = []
        Object.entries(definition).forEach(([key, value]) => {
          response.push(key, value)
        })
        return response
      }
      return 'ERR no such index'
    }

    if (upperCommand.startsWith('FT.SEARCH')) {
      return [
        '2', // Number of results
        'user:1',
        ['name', 'John Doe', 'email', 'john@example.com', 'age', '30'],
        'user:2',
        ['name', 'Jane Smith', 'email', 'jane@example.com', 'age', '25'],
      ]
    }
  }

  // Default response for unknown commands
  console.log(`Mock: Unknown command '${command}', returning generic response`)
  return `Mock response for: ${command}`
}

/**
 * Check if a database has Redis Search module (mock)
 * @param databaseId The database ID
 * @returns Promise<boolean> True if the database has Redis Search module
 */
export async function hasRedisSearchModule(databaseId: string): Promise<boolean> {
  await delay(50)
  console.log(`Mock: hasRedisSearchModule called with databaseId=${databaseId}`)

  const database = MOCK_DATABASES.find((db) => db.id === databaseId)
  if (!database) {
    console.warn(`Mock: Database '${databaseId}' not found`)
    return false
  }

  const hasModule = database.modules?.some((module) =>
    ['search', 'searchlight', 'ft', 'ftl'].includes(module.name?.toLowerCase() || '')) || false

  console.log(`Mock: Database '${databaseId}' has Redis Search module: ${hasModule}`)
  return hasModule
}

/**
 * Get database by ID (mock)
 * @param databaseId The database ID
 * @returns Promise<DatabaseInstance | null> The database instance or null if not found
 */
export async function getDatabaseById(databaseId: string): Promise<DatabaseInstance | null> {
  await delay(50)
  console.log(`Mock: getDatabaseById called with databaseId=${databaseId}`)

  const database = MOCK_DATABASES.find((db) => db.id === databaseId)
  if (!database) {
    console.warn(`Mock: Database '${databaseId}' not found`)
    return null
  }

  return { ...database } // Return copy
}

// Export mock configuration for testing
export const MOCK_CONFIG = {
  databases: MOCK_DATABASES,
  indexes: MOCK_INDEXES,
  indexDefinitions: MOCK_INDEX_DEFINITIONS,
  commandResponses: MOCK_COMMAND_RESPONSES,
}
