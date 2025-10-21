import React from 'react'
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react'
import * as l10n from '@vscode/l10n'

import { Spacer, Spinner } from 'uiSrc/ui'
import { CloudJobName, CloudJobStep } from 'uiSrc/constants'
import { Maybe } from 'uiSrc/interfaces'
import ChampagneIcon from 'uiSrc/assets/icons/champagne.svg?react'

export enum InfiniteMessagesIds {
  oAuthProgress = 'oAuthProgress',
  oAuthSuccess = 'oAuthSuccess',
  autoCreateDb = 'autoCreateDb',
  databaseExists = 'databaseExists',
  subscriptionExists = 'subscriptionExists',
  appUpdateAvailable = 'appUpdateAvailable',
  pipelineDeploySuccess = 'pipelineDeploySuccess',
}

export const INFINITE_MESSAGES = {
  AUTHENTICATING: () => ({
    id: InfiniteMessagesIds.oAuthProgress,
    Inner: (
      <div
        role="presentation"
        data-testid="authenticating-notification"
        className="flex"
      >
        <Spinner type="clip" size="20px" className="min-w-5" />
        <div className="ml-2">
          <div className="text-[15px]">
            {l10n.t('Authenticating…')}
          </div>
          <Spacer size="m" />
          <div>
            {l10n.t('This may take several seconds, but it is totally worth it!')}
          </div>
        </div>
      </div>
    ),
  }),
  PENDING_CREATE_DB: (step?: CloudJobStep) => ({
    id: InfiniteMessagesIds.oAuthProgress,
    Inner: (
      <div
        role="presentation"
        data-testid="pending-create-db-notification"
        className="flex"
      >
        <Spinner type="clip" size="20px" className="min-w-5" />
        <div className="ml-2 flex flex-col">
          <span className="text-[15px]">
            { (step === CloudJobStep.Credentials || !step) && l10n.t('Processing Cloud API keys…')}
            { step === CloudJobStep.Subscription && l10n.t('Processing Cloud subscriptions…')}
            { step === CloudJobStep.Database && l10n.t('Creating a free Redis Cloud database…')}
            { step === CloudJobStep.Import && l10n.t('Importing a free Redis Cloud database…')}
          </span>
          <Spacer size="m" />
          <div>
            {l10n.t('This may take several minutes, but it is totally worth it!')}
          </div>
          {/* <div>
            You can continue working in Redis Insight, and we will notify you once done.
          </div> */}
        </div>
      </div>
    ),
  }),
  SUCCESS_CREATE_DB: (jobName: Maybe<CloudJobName>, onSuccess?: () => void) => {
    const withFeed = jobName
      && [CloudJobName.CreateFreeDatabase, CloudJobName.CreateFreeSubscriptionAndDatabase].includes(jobName)
    const text = `${l10n.t('You can now use your Redis Stack database in Redis Cloud')}${withFeed ? l10n.t(' with pre-loaded sample data') : ''}.`
    return ({
      id: InfiniteMessagesIds.oAuthSuccess,
      Inner: (
        <div
          role="presentation"
          onMouseDown={(e) => { e.preventDefault() }}
          onMouseUp={(e) => { e.preventDefault() }}
          data-testid="success-create-db-notification"
        >
          <div className="flex justify-end flex-row">
            <div>
              <ChampagneIcon />
            </div>
            <div className="flex-grow ml-3">
              <div className="text-[15px]" >{l10n.t('Congratulations!')}</div>
              <Spacer size="s" />
              <div >
                {text}
                <Spacer size="s" />
                <b>{l10n.t('Notice: ')}</b>{l10n.t('the database will be deleted after 15 days of inactivity.')}
              </div>
              {/* <VSCodeButton
                appearance="primary"
                onClick={() => onSuccess()}
                data-testid="notification-connect-db"
              >
                {l10n.t('Connect')}
              </VSCodeButton> */}
            </div>
          </div>
        </div>
      ),
    })
  },
  DATABASE_EXISTS: (onSuccess?: () => void, onClose?: () => void) => ({
    id: InfiniteMessagesIds.databaseExists,
    Inner: (
      <div
        role="presentation"
        onMouseDown={(e) => { e.preventDefault() }}
        onMouseUp={(e) => { e.preventDefault() }}
        data-testid="database-exists-notification"
        className="flex"
      >
        <Spinner type="clip" size="20px" className="min-w-5" />
        <div className="ml-2">
          <div className="text-[15px]">{l10n.t('You already have a free Redis Cloud subscription.')}</div>
          <Spacer size="s" />
          <div>
            {l10n.t('Do you want to import your existing database into Redis Insight?')}
          </div>
          <Spacer size="m" />
          <div className="flex justify-between">
            <div>
              <VSCodeButton
                appearance="primary"
                onClick={() => onSuccess?.()}
                data-testid="import-db-sso-btn"
            >
                {l10n.t('Import')}
              </VSCodeButton>
            </div>
            <div>
              <VSCodeButton
                appearance="secondary"
                onClick={() => onClose?.()}
                data-testid="cancel-import-db-sso-btn"
              >
                {l10n.t('Cancel')}
              </VSCodeButton>
            </div>
          </div>
        </div>
      </div>
    ),
  }),
  SUBSCRIPTION_EXISTS: (onSuccess?: () => void, onClose?: () => void) => ({
    id: InfiniteMessagesIds.subscriptionExists,
    Inner: (
      <div
        role="presentation"
        onMouseDown={(e) => { e.preventDefault() }}
        onMouseUp={(e) => { e.preventDefault() }}
        className="flex"
        data-testid="subscription-exists-notification"
      >
        <Spinner type="clip" size="20px" className="min-w-5" />
        <div className="ml-2">
          <div className="text-[15px]">{l10n.t('Your subscription does not have a free Redis Cloud database.')}</div>
          <Spacer size="s" />
          <div>
            {l10n.t('Do you want to create a free database in your existing subscription?')}
          </div>
          <Spacer size="m" />
          <div className="flex justify-between">
            <VSCodeButton
              appearance="primary"
              onClick={() => onSuccess?.()}
              data-testid="create-subscription-sso-btn"
            >
              {l10n.t('Create')}
            </VSCodeButton>
            <VSCodeButton
              appearance="secondary"
              className="infiniteMessage__btn"
              onClick={() => onClose?.()}
              data-testid="cancel-create-subscription-sso-btn"
            >
              {l10n.t('Cancel')}
            </VSCodeButton>
          </div>
        </div>
      </div>
    ),
  }),
}
