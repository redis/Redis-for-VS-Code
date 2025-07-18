/* eslint-disable import/no-mutable-exports */
import * as vscode from 'vscode'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { WebviewPanel } from './Webview'
import { startBackend, getBackendGracefulShutdown } from './server/bootstrapBackend'
import { startBackendE2E } from './server/bootstrapBackendE2E'
import { checkVersionUpdate, initWorkspaceState, setUIStorageField } from './lib'
import { WebViewProvider } from './WebViewProvider'
import { getTitleForKey, handleMessage } from './utils'
import { ViewId } from './constants'
import { logger } from './logger'
import { registerUriHandler } from './utils/handleUri'
import * as extensionApiMock from './extensionApiMock'

dotenv.config({ path: path.join(__dirname, '..', '.env') })

export let sidebarProvider: WebViewProvider
export let panelProvider: WebViewProvider

export async function activate(context: vscode.ExtensionContext) {
  logger.logCore('Extension activated')
  await initWorkspaceState(context)
  checkVersionUpdate()

  try {
    if (process.env.RI_WITHOUT_BACKEND !== 'true') {
      if (process.env.RI_TEST !== 'true') {
        await startBackend(logger)
      } else {
        await startBackendE2E(logger)
      }
    }
  } catch (error) {
    logger.logCore(`startBackend error: ${error}`)
  }

  sidebarProvider = new WebViewProvider('sidebar', context)
  panelProvider = new WebViewProvider('cli', context)

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('ri-sidebar', sidebarProvider),
    vscode.window.registerWebviewViewProvider('ri-panel', panelProvider, { webviewOptions: { retainContextWhenHidden: true } }),

    vscode.commands.registerCommand('RedisForVSCode.addCli', async (args) => {
      await setUIStorageField('database', args.data?.database)

      vscode.commands.executeCommand('setContext', 'RedisForVSCode.showCliPanel', true)
      vscode.commands.executeCommand('ri-panel.focus')

      panelProvider.view?.webview.postMessage({ action: 'AddCli', data: args.data })
    }),

    vscode.commands.registerCommand('RedisForVSCode.openKey', async (args) => {
      const keyInfo = args.data?.keyInfo
      const title = getTitleForKey(keyInfo?.displayedKeyType, keyInfo?.keyString)

      await setUIStorageField('keyInfo', keyInfo)
      await setUIStorageField('database', args.data?.database)

      WebviewPanel.getInstance({
        context,
        title,
        route: 'main/key',
        viewId: ViewId.Key,
        // todo: connection between webviews
        message: args,
      })
    }),

    vscode.commands.registerCommand('RedisForVSCode.addKeyOpen', async (args) => {
      await setUIStorageField('database', args.data?.database)

      WebviewPanel.getInstance({
        context,
        route: 'main/add_key',
        title: vscode.l10n.t('Redis for VS Code - Add new key'),
        viewId: ViewId.AddKey,
        handleMessage: (message) => handleMessage(message),
        message: args,
      }).postMessage({ action: 'SetDatabase', data: { database: args.data?.database } })
    }),

    vscode.commands.registerCommand('RedisForVSCode.addDatabase', (args) => {
      WebviewPanel.getInstance({
        context,
        route: 'main/add_database',
        title: vscode.l10n.t('Redis for VS Code - Add Database connection'),
        viewId: ViewId.AddDatabase,
        handleMessage: (message) => handleMessage(message),
        message: args,
      }).postMessage({
        action: 'OpenOAuthSsoDialog',
        data: { source: args?.source, ssoFlow: args?.ssoFlow },
      })
    }),

    vscode.commands.registerCommand('RedisForVSCode.openSettings', (args) => {
      WebviewPanel.getInstance({
        context,
        route: 'main/settings',
        title: vscode.l10n.t('Redis for VS Code - Settings'),
        viewId: ViewId.Settings,
        handleMessage: (message) => handleMessage(message),
        message: args,
      })
    }),

    vscode.commands.registerCommand('RedisForVSCode.openEula', (args) => {
      vscode.commands.executeCommand('setContext', 'ri.openEula', true)

      WebviewPanel.instances[ViewId.AddDatabase]?.dispose()
      WebviewPanel.instances[ViewId.Settings]?.dispose()

      WebviewPanel.getInstance({
        context,
        route: 'main/eula',
        title: vscode.l10n.t('Redis for VS Code - EULA'),
        viewId: ViewId.Eula,
        handleMessage: (message) => handleMessage(message),
        message: args,
      })
    }),

    vscode.commands.registerCommand('RedisForVSCode.closeEula', (args) => {
      WebviewPanel.instances[ViewId.Eula]?.dispose()

      vscode.commands.executeCommand('setContext', 'ri.openEula', false)
      sidebarProvider.view?.webview.postMessage({ action: 'CloseEula', data: args })
      sidebarProvider.view?.webview.postMessage({ action: 'RefreshTree', data: args })

      WebviewPanel.getInstance({
        context,
        route: 'main/welcome',
        title: vscode.l10n.t('Redis for VS Code - Welcome'),
        viewId: ViewId.Welcome,
        handleMessage: (message) => handleMessage(message),
        message: args,
      })
    }),

    vscode.commands.registerCommand('RedisForVSCode.editDatabase', (args) => {
      WebviewPanel.getInstance({
        context,
        route: 'main/edit_database',
        title: vscode.l10n.t('Redis for VS Code - Edit Database connection'),
        viewId: ViewId.EditDatabase,
        handleMessage: (message) => handleMessage(message),
        message: args,
      })
    }),

    vscode.commands.registerCommand('RedisForVSCode.addKeyClose', () => {
      WebviewPanel.getInstance({ viewId: ViewId.Key }).dispose()
    }),

    vscode.commands.registerCommand('RedisForVSCode.addDatabaseClose', (args) => {
      WebviewPanel.getInstance({ viewId: ViewId.AddDatabase }).dispose()
      sidebarProvider.view?.webview.postMessage({ action: 'AddDatabase', data: args })
    }),

    vscode.commands.registerCommand('RedisForVSCode.editDatabaseClose', (args) => {
      WebviewPanel.getInstance({ viewId: ViewId.EditDatabase }).dispose()
      sidebarProvider.view?.webview.postMessage({ action: 'UpdateDatabaseInList', data: args })

      const keyDetailsWebview = WebviewPanel.instances[ViewId.Key]
      if (keyDetailsWebview) {
        keyDetailsWebview.postMessage({ action: 'SetDatabase', data: args })
      }
    }),

    vscode.commands.registerCommand('RedisForVSCode.closeAddKeyAndRefresh', (args) => {
      WebviewPanel.getInstance({ viewId: ViewId.AddKey })?.dispose()
      sidebarProvider.view?.webview.postMessage({ action: 'SetSelectedKeyAction', data: args })
      vscode.commands.executeCommand('RedisForVSCode.openKey', { action: 'SelectKey', data: args })
    }),

    vscode.commands.registerCommand('RedisForVSCode.closeKeyAndRefresh', (args) => {
      sidebarProvider.view?.webview.postMessage({ action: 'SetSelectedKeyAction', data: args })
      WebviewPanel.getInstance({ viewId: ViewId.Key })?.dispose()
    }),

    vscode.commands.registerCommand('RedisForVSCode.closeKey', () => {
      WebviewPanel.getInstance({ viewId: ViewId.Key })?.dispose()
    }),

    vscode.commands.registerCommand('RedisForVSCode.editKeyName', (args) => {
      sidebarProvider.view?.webview.postMessage({ action: 'SetSelectedKeyAction', data: args })
      const title = getTitleForKey(args.keyInfo?.displayedKeyType, args.keyInfo?.newKeyString)
      WebviewPanel.getInstance({ viewId: ViewId.Key }).setTitle(title)
    }),

    vscode.commands.registerCommand('RedisForVSCode.resetSelectedKey', () => {
      sidebarProvider.view?.webview.postMessage({ action: 'ResetSelectedKey' })
    }),

    vscode.commands.registerCommand('RedisForVSCode.updateSettings', (args) => {
      const message = { action: 'UpdateSettings', data: args.data }

      // send a new settings to all open panels
      Object.values(WebviewPanel.instances).forEach((instance) => {
        instance.update({ message })
      })

      sidebarProvider.view?.webview.postMessage(message)
      panelProvider.view?.webview.postMessage(message)
    }),

    vscode.commands.registerCommand('RedisForVSCode.updateSettingsDelimiter', (args) => {
      sidebarProvider.view?.webview.postMessage({ action: 'UpdateSettingsDelimiter', data: args.data })
    }),

    vscode.commands.registerCommand('RedisForVSCode.showExtensionOutput', () => {
      logger.show()
    }),

    vscode.commands.registerCommand('RedisForVSCode.refreshDatabases', () => {
      sidebarProvider.view?.webview.postMessage({ action: 'RefreshTree' })
    }),

    // TODO [DA]: Remove, added for testing purposes
    vscode.commands.registerCommand('RedisForVSCode.getAllDatabases', async () => {
      const dbs = await extensionApiMock.getAllDatabases()
      vscode.window.showInformationMessage(
        `Found ${dbs.length} database(s).: ${dbs.map((db) => db.name).join(', ')}`,
      )
    }),
  )

  registerUriHandler()

  // Return the extension API to expose functionalities to the outer world
  return {
    // Core database operations
    getAllDatabases: extensionApiMock.getAllDatabases,
    getDatabaseById: extensionApiMock.getDatabaseById,

    // Index operations
    getIndexDefinition: extensionApiMock.getIndexDefinition,
    getAllIndexes: extensionApiMock.getAllIndexes,
    hasRedisSearchModule: extensionApiMock.hasRedisSearchModule,

    // CLI operations
    openCliForDatabase: extensionApiMock.openCliForDatabase,
    executeRedisCommand: extensionApiMock.executeRedisCommand,
  }
}

export function deactivate() {
  try {
    getBackendGracefulShutdown()
  } catch (error) {
    logger.logCore(`Deactivating error: ${error}`)
  }
}
