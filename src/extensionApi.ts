import * as vscode from 'vscode'
import * as http from 'http'
import * as https from 'https'
import { URL } from 'url'
import { getUIStorageField, setUIStorageField } from './lib'

/*
 * Extension API Usage Examples:
 *
 * // Get the extension API from the activate return value
 * const redisExtension = vscode.extensions.getExtension('Redis.redis-for-vscode')
 * const api = redisExtension?.exports
 *
 * // Example usage:
 * // 1. Get all databases
 * const databases = await api.getAllDatabases()
 * console.log('All databases:', databases)
 *
 * // 2. Get all indexes for a specific database
 * const indexes = await api.getAllIndexes('database-id-here')
 * console.log('Indexes:', indexes)
 *
 * // 3. Get index definition
 * const definition = await api.getIndexDefinition('database-id', 'index-name')
 * console.log('Index definition:', definition)
 *
 * // 4. Open CLI for a database
 * const success = await api.openCliForDatabase('database-id')
 * console.log('CLI opened:', success)
 *
 * // 5. Execute custom Redis command
 * const result = await api.executeRedisCommand('database-id', 'INFO server')
 * console.log('Command result:', result)
 */

// Types
export interface DatabaseInstance {
  id: string
  name: string
  host: string
  port: number
  connectionType?: string
  modules?: any[]
}

export interface IndexDefinition {
  [key: string]: any
}

export interface CliCommandResponse {
  response: any
  status: 'success' | 'fail'
}

// Helper function to get backend base URL
async function getBackendBaseUrl(): Promise<string> {
  const appPort = await getUIStorageField('appPort') || '5001'
  return `http://localhost:${appPort}`
}

// Helper function to make HTTP requests using Node.js built-in modules
async function makeHttpRequest(
  url: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  data?: any,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const isHttps = parsedUrl.protocol === 'https:'
    const httpModule = isHttps ? https : http

    const headers: { [key: string]: string | number } = {
      'Content-Type': 'application/json',
    }

    if (data && method === 'POST') {
      const postData = JSON.stringify(data)
      headers['Content-Length'] = Buffer.byteLength(postData)
    }

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers,
    }

    const req = httpModule.request(options, (res) => {
      let responseData = ''

      res.on('data', (chunk) => {
        responseData += chunk
      })

      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {}
          resolve({
            status: res.statusCode,
            data: parsedData,
          })
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData,
          })
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    if (data && method === 'POST') {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

// Helper function to execute Redis CLI command on a database
async function executeCliCommand(databaseId: string, command: string): Promise<CliCommandResponse | null> {
  try {
    const baseUrl = await getBackendBaseUrl()

    // First create a CLI client for the database
    const createResponse = await makeHttpRequest(`${baseUrl}/databases/${databaseId}/cli`, 'POST')

    if (createResponse.status !== 201) {
      console.error('Failed to create CLI client')
      return null
    }

    const cliClientUuid = createResponse.data?.uuid

    if (!cliClientUuid) {
      console.error('No CLI client UUID received')
      return null
    }

    try {
      // Execute the command
      const commandResponse = await makeHttpRequest(
        `${baseUrl}/databases/${databaseId}/cli/${cliClientUuid}/send-command`,
        'POST',
        {
          command,
          outputFormat: 'RAW',
        },
      )

      // Clean up: delete the CLI client
      await makeHttpRequest(`${baseUrl}/databases/${databaseId}/cli/${cliClientUuid}`, 'DELETE')

      if (commandResponse.status === 200) {
        return {
          response: commandResponse.data.response,
          status: commandResponse.data.status,
        }
      }

      return null
    } catch (error) {
      // Clean up: delete the CLI client even if command execution failed
      try {
        await makeHttpRequest(`${baseUrl}/databases/${databaseId}/cli/${cliClientUuid}`, 'DELETE')
      } catch (cleanupError) {
        console.error('Failed to cleanup CLI client:', cleanupError)
      }
      throw error
    }
  } catch (error) {
    console.error(`Error executing command '${command}' on database '${databaseId}':`, error)
    return null
  }
}

/**
 * Get all databases from the backend
 * @returns Promise<DatabaseInstance[]> Array of all database instances
 */
export async function getAllDatabases(): Promise<DatabaseInstance[]> {
  try {
    const baseUrl = await getBackendBaseUrl()
    const response = await makeHttpRequest(`${baseUrl}/databases`)

    if (response.status === 200 && Array.isArray(response.data)) {
      return response.data.map((db: any) => ({
        id: db.id,
        name: db.name || `${db.host}:${db.port}`,
        host: db.host,
        port: db.port,
        connectionType: db.connectionType,
        modules: db.modules || [],
      }))
    }

    return []
  } catch (error) {
    console.error('Error getting all databases:', error)
    return []
  }
}

/**
 * Get index definition by database ID and index name
 * @param databaseId The database ID
 * @param indexName The name of the index
 * @returns Promise<IndexDefinition | null> The index definition or null if not found
 */
export async function getIndexDefinition(databaseId: string, indexName: string): Promise<IndexDefinition | null> {
  try {
    // Get database info first to check if it has Redis Search module
    const databases = await getAllDatabases()
    const database = databases.find((db) => db.id === databaseId)

    if (!database) {
      throw new Error(`Database with ID '${databaseId}' not found`)
    }

    // Check if the database has Redis Search module
    const hasSearchModule = database.modules?.some((module) =>
      ['search', 'searchlight', 'ft', 'ftl'].includes(module.name?.toLowerCase() || ''),
    )

    if (!hasSearchModule) {
      console.warn(`Database '${databaseId}' does not have Redis Search module loaded`)
      return null
    }

    // Execute FT.INFO command to get index definition
    const result = await executeCliCommand(databaseId, `FT.INFO ${indexName}`)

    if (result && result.status === 'success') {
      const { response } = result

      if (Array.isArray(response)) {
        // FT.INFO returns an array with alternating keys and values
        const definition: IndexDefinition = {}
        for (let i = 0; i < response.length; i += 2) {
          if (i + 1 < response.length) {
            const key = String(response[i])
            const value = response[i + 1]
            definition[key] = value
          }
        }
        return definition
      } if (typeof response === 'string') {
        // Handle error responses
        if (response.includes('Unknown index name')
            || response.includes('no such index')
            || response.includes('ERR no such index')) {
          return null
        }

        // Try to parse as JSON in case of different format
        try {
          return JSON.parse(response)
        } catch {
          // Return as raw string if can't parse
          return { raw: response }
        }
      }
    }

    return null
  } catch (error) {
    console.error(`Error getting index definition for '${indexName}' in database '${databaseId}':`, error)
    return null
  }
}

/**
 * Get all indexes for a specific database
 * @param databaseId The database ID
 * @returns Promise<string[]> Array of index names
 */
export async function getAllIndexes(databaseId: string): Promise<string[]> {
  try {
    // Get database info first to check if it has Redis Search module
    const databases = await getAllDatabases()
    const database = databases.find((db) => db.id === databaseId)

    if (!database) {
      throw new Error(`Database with ID '${databaseId}' not found`)
    }

    // Check if the database has Redis Search module
    const hasSearchModule = database.modules?.some((module) =>
      ['search', 'searchlight', 'ft', 'ftl'].includes(module.name?.toLowerCase() || ''),
    )

    if (!hasSearchModule) {
      console.warn(`Database '${databaseId}' does not have Redis Search module loaded`)
      return []
    }

    // Execute FT._LIST command to get all indexes
    const result = await executeCliCommand(databaseId, 'FT._LIST')

    if (result && result.status === 'success') {
      const { response } = result

      if (Array.isArray(response)) {
        return response.map((index) => String(index))
      } if (typeof response === 'string') {
        // Handle string response - might be space/newline separated or JSON
        try {
          const parsed = JSON.parse(response)
          if (Array.isArray(parsed)) {
            return parsed.map((index) => String(index))
          }
        } catch {
          // If not JSON, might be space/newline separated
          const trimmed = response.trim()
          if (trimmed === '') {
            return []
          }
          return trimmed.split(/\s+/).filter((name) => name.length > 0)
        }
      }
    }

    return []
  } catch (error) {
    console.error(`Error getting indexes for database '${databaseId}':`, error)
    return []
  }
}

/**
 * Open CLI for a specific database
 * @param databaseId The database ID to open CLI for
 * @returns Promise<boolean> True if CLI was opened successfully
 */
export async function openCliForDatabase(databaseId: string): Promise<boolean> {
  try {
    // Get database info first
    const databases = await getAllDatabases()
    const database = databases.find((db) => db.id === databaseId)

    if (!database) {
      throw new Error(`Database with ID '${databaseId}' not found`)
    }

    // Set the database in UI storage
    await setUIStorageField('database', database)

    // Execute the addCli command
    await vscode.commands.executeCommand('RedisForVSCode.addCli', {
      data: { database },
    })

    return true
  } catch (error) {
    console.error(`Error opening CLI for database '${databaseId}':`, error)
    return false
  }
}

/**
 * Execute a custom Redis command on a database
 * @param databaseId The database ID
 * @param command The Redis command to execute
 * @returns Promise<any> The command response
 */
export async function executeRedisCommand(databaseId: string, command: string): Promise<any> {
  try {
    const result = await executeCliCommand(databaseId, command)
    return result?.response || null
  } catch (error) {
    console.error(`Error executing command '${command}' on database '${databaseId}':`, error)
    return null
  }
}

/**
 * Check if a database has Redis Search module
 * @param databaseId The database ID
 * @returns Promise<boolean> True if the database has Redis Search module
 */
export async function hasRedisSearchModule(databaseId: string): Promise<boolean> {
  try {
    const databases = await getAllDatabases()
    const database = databases.find((db) => db.id === databaseId)

    if (!database) {
      return false
    }

    return database.modules?.some((module) =>
      ['search', 'searchlight', 'ft', 'ftl'].includes(module.name?.toLowerCase() || ''),
    ) || false
  } catch (error) {
    console.error(`Error checking Redis Search module for database '${databaseId}':`, error)
    return false
  }
}

/**
 * Get database by ID
 * @param databaseId The database ID
 * @returns Promise<DatabaseInstance | null> The database instance or null if not found
 */
export async function getDatabaseById(databaseId: string): Promise<DatabaseInstance | null> {
  try {
    const databases = await getAllDatabases()
    return databases.find((db) => db.id === databaseId) || null
  } catch (error) {
    console.error(`Error getting database by ID '${databaseId}':`, error)
    return null
  }
}
