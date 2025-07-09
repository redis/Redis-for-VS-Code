import isGlob from 'is-glob'
import { cloneDeep, get } from 'lodash'
import jsonpath from 'jsonpath'

import { AdditionalRedisModule } from 'uiSrc/store'
import { apiService } from 'uiSrc/services'
import { ApiEndpoints, DEFAULT_SUMMARY, KeyTypes, SUPPORTED_REDIS_MODULES } from 'uiSrc/constants'
import { useAppInfoStore } from 'uiSrc/store/hooks/use-app-info-store/useAppInfoStore'
import { getInstanceInfo } from 'uiSrc/services/databaseService'
import { IModuleSummary, IRedisModulesSummary, ITelemetrySendEvent, MatchType, RedisModules, RedisModulesKeyType } from './interfaces'
import { isRedisearchAvailable, isTriggeredAndFunctionsAvailable } from '../database'

export const sendEventTelemetry = async ({ event, eventData = {} }: ITelemetrySendEvent) => {
  try {
    const isAnalyticsGranted = checkIsAnalyticsGranted() || import.meta.env.DEV
    if (!isAnalyticsGranted) {
      return
    }
    await apiService.post(`${ApiEndpoints.ANALYTICS_SEND_EVENT}`, { event, eventData })
  } catch (e) {
    // continue regardless of error
  }
}

export const getMatchType = (match: string): MatchType => (
  !isGlob(match, { strict: false })
    ? MatchType.EXACT_VALUE_NAME
    : MatchType.PATTERN
)

// Check is user give access to collect his events
export const checkIsAnalyticsGranted = (): boolean =>
  !!get(useAppInfoStore.getState(), 'config.agreements.analytics', false)

const getEnumKeyBValue = (myEnum: any, enumValue: number | string): string => {
  const keys = Object.keys(myEnum)
  const index = keys.findIndex((x) => myEnum[x] === enumValue)
  return index > -1 ? keys[index] : ''
}

const getModuleSummaryToSent = (module: AdditionalRedisModule): IModuleSummary => ({
  loaded: true,
  version: module.version,
  semanticVersion: module.semanticVersion,
})

export const getRedisInfoSummary = async (id: string) => {
  let infoData: any = {}
  try {
    const info = await getInstanceInfo(id)
    infoData = {
      redis_version: info?.version,
      uptime_in_days: info?.stats?.uptime_in_days,
      used_memory: info?.usedMemory,
      connected_clients: info?.connectedClients,
      maxmemory_policy: info?.stats?.maxmemory_policy,
      instantaneous_ops_per_sec: info?.stats?.instantaneous_ops_per_sec,
      instantaneous_input_kbps: info?.stats?.instantaneous_input_kbps,
      instantaneous_output_kbps: info?.stats?.instantaneous_output_kbps,
      numberOfKeysRange: info?.stats?.numberOfKeysRange,
      totalKeys: info?.totalKeys,
    }
  } catch (e) {
    // continue regardless of error
  }

  return infoData
}

export const getRedisModulesSummary = (modules: AdditionalRedisModule[] = []): IRedisModulesSummary => {
  const summary = cloneDeep(DEFAULT_SUMMARY)
  try {
    modules.forEach(((module) => {
      // @ts-ignore
      if (SUPPORTED_REDIS_MODULES[module.name as any]) {
        const moduleName = getEnumKeyBValue(RedisModules, module.name)
        summary[moduleName as RedisModulesKeyType] = getModuleSummaryToSent(module)
        return
      }

      if (isRedisearchAvailable([module])) {
        const redisearchName = getEnumKeyBValue(RedisModules, RedisModules.RediSearch)
        summary[redisearchName as RedisModulesKeyType] = getModuleSummaryToSent(module)
        return
      }

      if (isTriggeredAndFunctionsAvailable([module])) {
        const triggeredAndFunctionsName = getEnumKeyBValue(RedisModules, RedisModules['Triggers and Functions'])
        summary[triggeredAndFunctionsName as RedisModulesKeyType] = getModuleSummaryToSent(module)
        return
      }

      summary.customModules.push(module)
    }))
  } catch (e) {
    // continue regardless of error
  }
  return summary
}

export const getLengthByKeyType = (type: KeyTypes, data: any) => {
  switch (type) {
    case KeyTypes.Hash:
      return data.fields?.length
    case KeyTypes.Set:
      return data.members?.length
    case KeyTypes.ZSet:
      return data.members?.length
    case KeyTypes.String:
      return data.value?.length
    case KeyTypes.List:
      return data.elements?.length
    case KeyTypes.Stream:
      return 1
    case KeyTypes.ReJSON:
      return undefined
    default:
      return undefined
  }
}

export const getJsonPathLevel = (path: string): string => {
  try {
    if (path === '.') {
      return 'root'
    }
    const levelsLength = jsonpath.parse(
      `$${path.startsWith('.') ? '.' : '..'}${path}`,
    ).length

    return levelsLength === 2 ? 'root' : `${levelsLength - 2}`
  } catch (e) {
    return 'root'
  }
}
