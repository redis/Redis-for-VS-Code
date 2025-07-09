import apiService from 'uiSrc/services/apiService'
import { ApiEndpoints } from 'uiSrc/constants'
import { isStatusSuccessful } from 'uiSrc/utils'
import { RedisNodeInfoResponseInterface } from 'uiSrc/interfaces'

const endpoint = ApiEndpoints.DATABASES

export async function getInstanceInfo(id: string) {
  const {
    data,
    status,
  } = await apiService.get<RedisNodeInfoResponseInterface>(
    `${endpoint}/${id}/info`,
  )
  return isStatusSuccessful(status) ? data : null
}
