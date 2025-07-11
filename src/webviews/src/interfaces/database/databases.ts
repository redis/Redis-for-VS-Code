// import { RedisResponseBuffer } from 'uiSrc/slices/interfaces/app'
import {
  // Maybe,
  Nullable,
} from 'uiSrc/interfaces'
// import { GetHashFieldsResponse } from 'apiSrc/modules/browser/dto/hash.dto'
// import { GetSetMembersResponse } from 'apiSrc/modules/browser/dto/set.dto'
// import { GetRejsonRlResponseDto, SafeRejsonRlDataDtO } from 'apiSrc/modules/browser/dto/rejson-rl.dto'
// import {
//   GetListElementsDto,
//   GetListElementsResponse,
// } from 'apiSrc/modules/browser/dto/list.dto'
// import { Database as DatabaseDatabaseResponse } from 'apiSrc/modules/database/models/database'
// import { AdditionalRedisModule } from 'apiSrc/modules/database/models/additional.redis.module'
// import { SearchZSetMembersResponse } from 'apiSrc/modules/browser/dto'
// import { SentinelMaster } from 'apiSrc/modules/redis-sentinel/models/sentinel-master'
// import { CreateSentinelDatabaseDto } from 'apiSrc/modules/redis-sentinel/dto/create.sentinel.database.dto'
// import { CreateSentinelDatabaseResponse } from 'apiSrc/modules/redis-sentinel/dto/create.sentinel.database.response'
// import { RedisNodeInfoResponse } from 'apiSrc/modules/database/dto/redis-info.dto'

// export interface Database extends DatabaseDatabaseResponse {
//   host: string
//   port: number
//   nameFromProvider?: Nullable<string>
//   provider?: string
//   id: string
//   endpoints?: Nullable<Endpoints[]>
//   connectionType?: ConnectionType
//   lastConnection?: Date
//   password?: Nullable<string>
//   username?: Nullable<string>
//   name?: string
//   db?: number
//   tls?: boolean
//   ssh?: boolean
//   sshOptions?: {
//     host: string
//     port: number
//     username?: string
//     password?: string
//     privateKey?: string
//     passphrase?: string
//   }
//   tlsClientAuthRequired?: boolean
//   verifyServerCert?: boolean
//   caCert?: CaCertificate
//   clientCert?: ClientCertificate
//   authUsername?: Nullable<string>
//   authPass?: Nullable<string>
//   isDeleting?: boolean
//   sentinelMaster?: SentinelMaster
//   modules: AdditionalRedisModule[]
//   version: Nullable<string>
//   isRediStack?: boolean
//   visible?: boolean
//   loading?: boolean
//   isFreeDb?: boolean
// }

// interface CaCertificate {
//   id?: string
//   name?: string
//   certificate?: string
// }

// interface ClientCertificate {
//   id?: string
//   name?: string
//   key?: string
//   certificate?: string
// }

export enum ConnectionType {
  Standalone = 'STANDALONE',
  Cluster = 'CLUSTER',
  Sentinel = 'SENTINEL',
}

export enum ConnectionProvider {
  UNKNOWN = 'UNKNOWN',
  LOCALHOST = 'LOCALHOST',
  RE_CLUSTER = 'RE_CLUSTER',
  RE_CLOUD = 'RE_CLOUD',
  AZURE = 'AZURE',
  AWS = 'AWS',
  GOOGLE = 'GOOGLE',
}

export const CONNECTION_TYPE_DISPLAY = Object.freeze({
  [ConnectionType.Standalone]: 'Standalone',
  [ConnectionType.Cluster]: 'OSS Cluster',
  [ConnectionType.Sentinel]: 'Sentinel',
})

export interface Endpoints {
  host: string
  port: number
}

export interface DatabaseRedisCluster {
  host: string
  port: number
  uid: number
  name: string
  id?: number
  dnsName: string
  address: string
  status: DatabaseRedisClusterStatus
  modules: RedisDefaultModules[]
  tls: boolean
  options: any
  message?: string
  uidAdded?: number
  statusAdded?: AddRedisDatabaseStatus
  messageAdded?: string
  databaseDetails?: DatabaseRedisCluster
}

export interface DatabaseRedisCloud {
  accessKey: string
  secretKey: string
  credentials: Nullable<ICredentialsRedisCluster>
  account: Nullable<RedisCloudAccount>
  host: string
  port: number
  uid: number
  name: string
  id?: number
  dnsName: string
  address: string
  status: DatabaseRedisClusterStatus
  modules: RedisDefaultModules[]
  tls: boolean
  options: any
  message?: string
  publicEndpoint?: string
  databaseId: number
  databaseIdAdded?: number
  subscriptionId?: number
  subscriptionType?: RedisCloudSubscriptionType
  subscriptionName: string
  subscriptionIdAdded?: number
  statusAdded?: AddRedisDatabaseStatus
  messageAdded?: string
  databaseDetails?: DatabaseRedisCluster
  free: boolean,
}

export interface IBulkOperationResult {
  status: AddRedisDatabaseStatus,
  message: string,
  error?: any,
}

export enum AddRedisDatabaseStatus {
  Success = 'success',
  Fail = 'fail',
}

export enum RedisDefaultModules {
  AI = 'ai',
  Graph = 'graph',
  Gears = 'rg',
  Bloom = 'bf',
  ReJSON = 'ReJSON',
  Search = 'search',
  SearchLight = 'searchlight',
  TimeSeries = 'timeseries',
  FT = 'ft',
  FTL = 'ftl',
  RedisGears = 'redisgears',
  RedisGears2 = 'redisgears_2',
}

export enum RedisCustomModulesName {
  Proto = 'PB',
  IpTables = 'iptables-input-filter',
}

export const REDISEARCH_MODULES: string[] = [
  RedisDefaultModules.Search,
  RedisDefaultModules.SearchLight,
  RedisDefaultModules.FT,
  RedisDefaultModules.FTL,
]

export const TRIGGERED_AND_FUNCTIONS_MODULES: string[] = [
  RedisDefaultModules.RedisGears,
  RedisDefaultModules.RedisGears2,
]

export const COMMAND_MODULES = {
  [RedisDefaultModules.Search]: REDISEARCH_MODULES,
  [RedisDefaultModules.ReJSON]: [RedisDefaultModules.ReJSON],
  [RedisDefaultModules.TimeSeries]: [RedisDefaultModules.TimeSeries],
  [RedisDefaultModules.Bloom]: [RedisDefaultModules.Bloom],
  [RedisDefaultModules.RedisGears]: TRIGGERED_AND_FUNCTIONS_MODULES,
}

const RediSearchModulesText = [...REDISEARCH_MODULES].reduce((prev, next) => ({ ...prev, [next]: 'RediSearch' }), {})
const TriggeredAndFunctionsModulesText = [...TRIGGERED_AND_FUNCTIONS_MODULES].reduce((prev, next) => ({ ...prev, [next]: 'Triggers and Functions' }), {})

// Enums don't allow to use dynamic key
export const DATABASE_LIST_MODULES_TEXT = Object.freeze({
  [RedisDefaultModules.AI]: 'RedisAI',
  [RedisDefaultModules.Graph]: 'RedisGraph',
  [RedisDefaultModules.Gears]: 'RedisGears',
  [RedisDefaultModules.Bloom]: 'RedisBloom',
  [RedisDefaultModules.ReJSON]: 'RedisJSON',
  [RedisDefaultModules.TimeSeries]: 'RedisTimeSeries',
  [RedisCustomModulesName.Proto]: 'redis-protobuf',
  [RedisCustomModulesName.IpTables]: 'RedisPushIpTables',
  ...RediSearchModulesText,
  ...TriggeredAndFunctionsModulesText,
})

export enum AddRedisClusterDatabaseOptions {
  ActiveActive = 'enabledActiveActive',
  Backup = 'enabledBackup',
  Clustering = 'enabledClustering',
  PersistencePolicy = 'persistencePolicy',
  Flash = 'enabledRedisFlash',
  Replication = 'enabledReplication',
  ReplicaDestination = 'isReplicaDestination',
  ReplicaSource = 'isReplicaSource',
}

// Enums don't allow to use dynamic key
export const DATABASE_LIST_OPTIONS_TEXT = Object.freeze({
  [AddRedisClusterDatabaseOptions.ActiveActive]: 'Active-Active',
  [AddRedisClusterDatabaseOptions.Backup]: 'Backup',
  [AddRedisClusterDatabaseOptions.Clustering]: 'Clustering',
  [AddRedisClusterDatabaseOptions.PersistencePolicy]: 'Persistence',
  [AddRedisClusterDatabaseOptions.Flash]: 'Flash',
  [AddRedisClusterDatabaseOptions.Replication]: 'Replication',
  [AddRedisClusterDatabaseOptions.ReplicaDestination]: 'Replica Destination',
  [AddRedisClusterDatabaseOptions.ReplicaSource]: 'Replica Source',
})

export enum PersistencePolicy {
  'none' = 'none',
  'aof-every-1-second' = 'Append-only file (AOF) every 1 second',
  'aof-every-write' = 'Append-only file (AOF) every write',
  'snapshot-every-1-hour' = 'Redis database backup (RDB) every 1 hour',
  'snapshot-every-6-hours' = 'Redis database backup (RDB) every 6 hours',
  'snapshot-every-12-hours' = 'Redis database backup (RDB) every 12 hours',
}

export enum DatabaseRedisClusterStatus {
  Pending = 'pending',
  CreationFailed = 'creation-failed',
  Active = 'active',
  ActiveChangePending = 'active-change-pending',
  ImportPending = 'import-pending',
  DeletePending = 'delete-pending',
  Recovery = 'recovery',
}

export interface TlsSettings {
  caCertId?: string
  clientCertPairId?: string
  verifyServerCert?: boolean
}

export interface ClusterNode {
  host: string
  port: number
  role?: 'slave' | 'master'
  slot?: number
}

export enum RedisCloudSubscriptionStatus {
  Active = 'active',
  NotActivated = 'not_activated',
  Deleting = 'deleting',
  Pending = 'pending',
  Error = 'error',
}

export const RedisCloudSubscriptionStatusText = Object.freeze({
  [RedisCloudSubscriptionStatus.Active]: 'Active',
  [RedisCloudSubscriptionStatus.NotActivated]: 'Not Activated',
  [RedisCloudSubscriptionStatus.Deleting]: 'Deleting',
  [RedisCloudSubscriptionStatus.Pending]: 'Pending',
  [RedisCloudSubscriptionStatus.Error]: 'Error',
})

export enum RedisCloudSubscriptionType {
  Flexible = 'flexible',
  Fixed = 'fixed',
}

export const RedisCloudSubscriptionTypeText = Object.freeze({
  [RedisCloudSubscriptionType.Fixed]: 'Fixed',
  [RedisCloudSubscriptionType.Flexible]: 'Flexible',
})

export interface RedisCloudSubscription {
  id: number
  name: string
  type: RedisCloudSubscriptionType
  numberOfDatabases: number
  provider: string
  region: string
  status: RedisCloudSubscriptionStatus
  free: boolean
}

export interface DatabaseConfigInfo {
  version: string
  totalKeys?: Nullable<number>
  usedMemory?: Nullable<number>
  connectedClients?: Nullable<number>
  opsPerSecond?: Nullable<number>
  networkInKbps?: Nullable<number>
  networkOutKbps?: Nullable<number>
  cpuUsagePercentage?: Nullable<number>
}

// export interface InitialStateDatabases {
//   loading: boolean
//   error: string
//   data: Database[]
//   loadingChanging: boolean
//   errorChanging: string
//   changedSuccessfully: boolean
//   deletedSuccessfully: boolean
//   connectedDatabase: Database
//   editedDatabase: InitialStateEditedDatabase
//   databaseOverview: DatabaseConfigInfo
//   databaseInfo: RedisNodeInfoResponse
//   freeDatabase: Nullable<Database>
//   importDatabases: {
//     loading: boolean
//     error: string
//     data: Nullable<ImportDatabasesData>
//   }
// }

export interface ErrorImportResult {
  statusCode: number
  message: string
  error: string
}

export interface ImportDatabasesData {
  fail: Array<FailedImportStatusResult>
  partial: Array<FailedImportStatusResult>
  success: Array<SuccessImportStatusResult>
  total: number
}

export interface FailedImportStatusResult {
  host?: string
  port?: number
  index: number
  errors: Array<ErrorImportResult>
  status: string
}

export interface SuccessImportStatusResult {
  host: string
  port: number
  index: number
  status: string
}

// export interface InitialStateEditedDatabase {
//   loading: boolean
//   error: string
//   data: Nullable<Database>
// }

export interface InitialStateCluster {
  loading: boolean
  data: Nullable<DatabaseRedisCluster[]>
  dataAdded: DatabaseRedisCluster[]
  error: string
  credentials: Nullable<ICredentialsRedisCluster>
}

export interface InitialStateCloud {
  loading: boolean
  data: Nullable<DatabaseRedisCloud[]>
  dataAdded: DatabaseRedisCloud[]
  error: string
  credentials: Nullable<ICredentialsRedisCloud>
  subscriptions: Nullable<RedisCloudSubscription[]>
  isAutodiscoverySSO: boolean
  account: {
    data: Nullable<RedisCloudAccount>
    error: string
  }
  loaded: ILoadedCloud
}

// export interface InitialStateSentinel {
//   loading: boolean
//   database: Nullable<Database>
//   data: ModifiedSentinelMaster[]
//   statuses: CreateSentinelDatabaseResponse[]
//   error: string
//   loaded: ILoadedSentinel
// }

export enum LoadedCloud {
  Subscriptions = 'subscriptions',
  Databases = 'databases',
  DatabasesAdded = 'databasesAdded',
}

export enum LoadedSentinel {
  Masters = 'masters',
  MastersAdded = 'mastersAdded',
}

export interface ILoadedCloud {
  [LoadedCloud.Subscriptions]?: boolean
  [LoadedCloud.Databases]?: boolean
  [LoadedCloud.DatabasesAdded]?: boolean
}

export interface ILoadedSentinel {
  [LoadedSentinel.Masters]?: boolean
  [LoadedSentinel.MastersAdded]?: boolean
}

// export interface ModifiedGetSetMembersResponse extends GetSetMembersResponse {
//   key?: RedisResponseBuffer
//   match?: string
// }

// export interface ModifiedZsetMembersResponse extends SearchZSetMembersResponse {
//   key?: RedisResponseBuffer
//   match?: string
// }

// export interface ModifiedGetHashMembersResponse extends GetHashFieldsResponse {
//   key?: RedisResponseBuffer
//   match?: string
// }

// export interface ModifiedSentinelMaster extends CreateSentinelDatabaseDto {
//   id?: string
//   alias: string
//   host?: string
//   port?: string
//   username?: string
//   password?: string
//   loading?: boolean
//   message?: string
//   status?: AddRedisDatabaseStatus
//   error?: string | object
// }

// export interface ModifiedGetListElementsResponse
//   extends GetListElementsDto,
//   GetListElementsResponse {
//   key?: string;
//   searchedIndex: Nullable<number>;
// }

// export interface InitialStateSet {
//   loading: boolean;
//   error: string;
//   data: ModifiedGetSetMembersResponse;
// }

// export interface GetRejsonRlResponse extends GetRejsonRlResponseDto {
//   data: Maybe<SafeRejsonRlDataDtO[] | string | number | boolean | null>
// }

// export interface InitialStateRejson {
//   loading: boolean
//   error: string
//   data: GetRejsonRlResponse
// }

export interface ICredentialsRedisCluster {
  host: string
  port: number
  username: string
  password: string
}

export interface RedisCloudAccount {
  accountId: Nullable<number>
  accountName: Nullable<string>
  ownerEmail: Nullable<string>
  ownerName: Nullable<string>
}

export interface ICredentialsRedisCloud {
  accessKey: Nullable<string>
  secretKey: Nullable<string>
}

export enum DatabaseType {
  Standalone = 'Redis Database',
  RedisCloudPro = 'Redis Enterprise Cloud',
  RedisEnterpriseCluster = 'Redis Enterprise Cluster',
  AWSElasticache = 'AWS Elasticache',
  Sentinel = 'Redis Sentinel',
}

export interface AdditionalRedisModule {
  name: string
  version?: number
  semanticVersion?: string
}

interface RedisDatabaseStatsDto {
  instantaneous_input_kbps: string | undefined
  instantaneous_ops_per_sec: string | undefined
  instantaneous_output_kbps: string | undefined
  maxmemory_policy: string | undefined
  numberOfKeysRange: string | undefined
  uptime_in_days: string | undefined
}

export interface RedisNodeInfoResponseInterface {
  version: string
  role?: 'master' | 'slave'
  server?: any
  stats?: RedisDatabaseStatsDto
  databases?: number
  usedMemory?: number
  totalKeys?: number
  connectedClients?: number
  uptimeInSeconds?: number
  hitRatio?: number
  cashedScripts?: number
}
