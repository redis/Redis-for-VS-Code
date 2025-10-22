export enum ConnectionType {
  Standalone = 'STANDALONE',
  Cluster = 'CLUSTER',
  Sentinel = 'SENTINEL',
}

export enum ConnectionProvider {
  UNKNOWN = 'UNKNOWN',
  LOCALHOST = 'LOCALHOST',
  REDIS_SOFTWARE = 'REDIS_SOFTWARE',
  REDIS_CLOUD = 'REDIS_CLOUD',
  AZURE = 'AZURE',
  AWS = 'AWS',
  GOOGLE = 'GOOGLE',
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
