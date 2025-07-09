import React, { useEffect, useState } from 'react'
import cx from 'classnames'
import { VscEdit, VscRefresh } from 'react-icons/vsc'
import { isUndefined, toNumber, isEqual } from 'lodash'
import * as l10n from '@vscode/l10n'
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react'

import {
  TelemetryEvent,
  formatLongName,
  getRedisModulesSummary,
  sendEventTelemetry,
  getRedisInfoSummary,
} from 'uiSrc/utils'
import { ContextStoreProvider, Database, DatabaseOverview, checkConnectToDatabase, deleteDatabases, fetchDatabaseOverviewById } from 'uiSrc/store'
import { Chevron, DatabaseIcon, Tooltip } from 'uiSrc/ui'
import { PopoverDelete } from 'uiSrc/components'
import { POPOVER_WINDOW_BORDER_WIDTH, StorageItem, VscodeMessageAction } from 'uiSrc/constants'
import { sessionStorageService, vscodeApi } from 'uiSrc/services'
import { Maybe } from 'uiSrc/interfaces'

import { LogicalDatabaseWrapper } from '../logical-database-wrapper'
import { KeysTreeHeader } from '../keys-tree-header'
import { KeysStoreProvider } from '../../hooks/useKeys'
import { KeysTree } from '../../KeysTree'
import styles from './styles.module.scss'

export interface Props {
  database: Database
}

const LogicalDatabase = (
  { database, open, dbTotal }:
  { database: Database, open?: boolean, dbTotal?: number },
) => (
  <ContextStoreProvider >
    <KeysStoreProvider>
      <LogicalDatabaseWrapper database={database}>
        <KeysTreeHeader
          database={database}
          open={open}
          dbTotal={dbTotal}
        >
          <KeysTree database={database} />
        </KeysTreeHeader>
      </LogicalDatabaseWrapper>
    </KeysStoreProvider>
  </ContextStoreProvider>
)

export const DatabaseWrapper = React.memo(({ database }: Props) => {
  const { id, name } = database

  const [loading, setLoading] = useState<boolean>(false)
  const [showTree, setShowTree] = useState<boolean>(false)
  const [totalKeysPerDb, setTotalKeysPerDb] = useState<Maybe<Record<string, number>>>(undefined)

  useEffect(() => {
    const showTreeInit = !!sessionStorageService.get(`${StorageItem.openTreeDatabase + id}`)

    if (showTreeInit) {
      checkConnectToDatabase(id, connectToInstance)
    }
  }, [])

  const handleCheckConnectToDatabase = async ({ id, provider, modules }: Database) => {
    const newShowTree = !showTree
    sessionStorageService.set(`${StorageItem.openTreeDatabase + id}`, newShowTree)

    if (showTree) {
      setShowTree(newShowTree)
      return
    }
    const modulesSummary = getRedisModulesSummary(modules)
    const infoData = await getRedisInfoSummary(id)

    sendEventTelemetry({
      event: TelemetryEvent.CONFIG_DATABASES_OPEN_DATABASE,
      eventData: {
        databaseId: id,
        provider,
        ...modulesSummary,
        ...infoData,
      },
    })

    checkConnectToDatabase(id, connectToInstance)
  }

  const connectToInstance = (database: Database, overview: DatabaseOverview) => {
    // TODO: fix for cli first open
    // TODO: remove after tests
    // set(window, 'ri.database', database)
    setShowTree(!showTree)
    setTotalKeysPerDb(overview?.totalKeysPerDb)
  }

  const editHandle = () => {
    sendEventTelemetry({
      event: TelemetryEvent.CONFIG_DATABASES_DATABASE_EDIT_CLICKED,
      eventData: {
        databaseId: id,
      },
    })

    vscodeApi.postMessage({ action: VscodeMessageAction.EditDatabase, data: { database } })
  }

  const refreshHandle = async () => {
    setLoading(true)
    const overview = await fetchDatabaseOverviewById(id)
    setLoading(false)

    if (!isEqual(totalKeysPerDb, overview?.totalKeysPerDb)) {
      setTotalKeysPerDb(overview?.totalKeysPerDb)
    }
  }

  const deleteDatabaseHandle = () => {
    deleteDatabases([database])
  }

  const clickDeleteDatabaseHandle = () => {
    sendEventTelemetry({
      event: TelemetryEvent.CONFIG_DATABASES_SINGLE_DATABASE_DELETE_CLICKED,
      eventData: {
        databaseId: id,
      },
    })
  }

  return (
    <div className={cx('flex w-full flex-col')}>
      <div className={cx('flex justify-between flex-1 min-h-[22px] flex-row group')}>
        <div
          onClick={() => handleCheckConnectToDatabase(database)}
          role="button"
          aria-hidden="true"
          className={styles.databaseNameWrapper}
          data-testid={`database-${id}`}
        >
          {<Chevron open={showTree} />}
          {<DatabaseIcon open={showTree} />}
          <Tooltip
            content={formatLongName(name, 100, 20)}
            position="bottom center"
            keepTooltipInside={false}
            mouseEnterDelay={2_000}
          >
            <div className={styles.databaseName}>
              <div className="truncate">{name}</div>
            </div>
          </Tooltip>
        </div>
        <div className="flex pr-3.5">
          <VSCodeButton
            appearance="icon"
            onClick={refreshHandle}
            className={cx('hidden', 'group-hover:!flex', { '!flex': showTree })}
            data-testid="refresh-databases"
          >
            <VscRefresh />
          </VSCodeButton>
          <VSCodeButton
            appearance="icon"
            onClick={editHandle}
            className={cx('hidden', 'group-hover:!flex', { '!flex': showTree })}
            data-testid="edit-database"
          >
            <VscEdit />
          </VSCodeButton>
          <PopoverDelete
            header={formatLongName(name, 50, 10, '...')}
            text={l10n.t('will be removed from Redis for VS Code.')}
            item={id}
            position="bottom right"
            maxWidth={window.innerWidth - POPOVER_WINDOW_BORDER_WIDTH}
            disabled={false}
            triggerClassName={cx('hidden h-[22px] group-hover:!flex', { '!flex': showTree })}
            handleDeleteItem={() => deleteDatabaseHandle()}
            handleButtonClick={() => clickDeleteDatabaseHandle()}
            testid={`delete-database-${id}`}
          />
        </div>
      </div>
      {loading && <div className="data-loading" />}
      {showTree && (<>
        {!isUndefined(totalKeysPerDb) && Object.keys(totalKeysPerDb).map((databaseIndex) => (
          <LogicalDatabase
            key={id + databaseIndex}
            open={Object.keys(totalKeysPerDb)?.length === 1}
            dbTotal={totalKeysPerDb?.[databaseIndex]}
            database={{
              ...database,
              db: toNumber(databaseIndex.replace('db', '')),
            }}
          />
        ))}
        {isUndefined(totalKeysPerDb) && (
          <LogicalDatabase
            key={id}
            database={{ ...database, db: 0 }}
            open={true}
          />
        )}
      </>)}
    </div>
  )
})
