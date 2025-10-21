import React from 'react'
import { instance, mock } from 'ts-mockito'

import * as utils from 'uiSrc/utils'
import {
  Database,
  DatabasesStore,
  initialDatabasesState,
  useDatabasesStore,
} from 'uiSrc/store'
import { ConnectionType, Nullable, RedisDefaultModules } from 'uiSrc/interfaces'
import { OAuthSsoDialog } from 'uiSrc/modules/oauth'
import { fireEvent, render, screen } from 'testSrc/helpers'

import { AddKeyReJSON, Props } from './AddKeyReJSON'

const mockConnectedDatabase: Nullable<Database> = {
  ...initialDatabasesState.connectedDatabase,
  id: 'mocked-id',
  name: 'mocked-database',
  host: '127.0.0.1',
  port: 6379,
  modules: [],
  username: 'mocked-user',
  password: 'mocked-password',
  tls: false,
  db: 0,
  lastConnection: new Date(),
  provider: 'RE_CLOUD',
  connectionType: ConnectionType.Standalone,
  version: null,
}

const customState: DatabasesStore = {
  ...initialDatabasesState,
  connectedDatabase: mockConnectedDatabase,
}

beforeEach(() => {
  useDatabasesStore.setState(customState)
})

const mockedProps = mock<Props>()

vi.spyOn(utils, 'sendEventTelemetry')

describe('AddKeyReJSON', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should render', () => {
    expect(
      render(<AddKeyReJSON {...instance(mockedProps)} />, { withRouter: true }),
    ).toBeTruthy()
  })

  it('should not display the JSON not supported text when JSON module is available', () => {
    useDatabasesStore.setState({
      ...customState,
      connectedDatabase: {
        ...mockConnectedDatabase,
        modules: [
          {
            name: RedisDefaultModules.ReJSON,
          },
        ],
      },
    })

    const { queryByTestId } = render(
      <AddKeyReJSON {...instance(mockedProps)} />,
      { withRouter: true },
    )

    const textId = 'json-not-loaded-text'
    expect(queryByTestId(textId)).not.toBeInTheDocument()
  })

  it('should display the JSON not supported text when JSON module is not available', () => {
    useDatabasesStore.setState({
      ...customState,
      connectedDatabase: {
        ...mockConnectedDatabase,
        modules: [],
      },
    })

    const { queryByTestId } = render(
      <AddKeyReJSON {...instance(mockedProps)} />,
      { withRouter: true },
    )

    const textId = 'json-not-loaded-text'
    expect(queryByTestId(textId)).toBeInTheDocument()
  })

  it('should open sso oauth dialog when free redis cloud database link clicked', () => {
    useDatabasesStore.setState({
      ...customState,
      connectedDatabase: {
        ...mockConnectedDatabase,
        modules: [],
      },
    })

    const { queryByTestId } = render(
      <AddKeyReJSON {...instance(mockedProps)} />,
      { withRouter: true },
    )
    render(<OAuthSsoDialog />)

    const oauthDialogId = 'social-oauth-dialog'
    expect(screen.queryByTestId(oauthDialogId)).not.toBeInTheDocument()

    const linkId = 'no-json-module-create-free-db'
    expect(queryByTestId(linkId)).toBeInTheDocument()
    fireEvent.click(queryByTestId(linkId) as HTMLAnchorElement)

    expect(screen.queryByTestId(oauthDialogId)).toBeInTheDocument()
  })
})
