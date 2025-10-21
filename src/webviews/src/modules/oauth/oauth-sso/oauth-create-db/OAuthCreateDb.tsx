import React, { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import * as l10n from '@vscode/l10n'
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react'

import { CloudJobName, CloudJobStep, OAuthSocialAction, OAuthSocialSource } from 'uiSrc/constants'
import { sendEventTelemetry, showInfinityToast, TelemetryEvent } from 'uiSrc/utils'
import { Nullable } from 'uiSrc/interfaces'
import { createFreeDbJob, fetchCloudSubscriptionPlans, useOAuthStore } from 'uiSrc/store'
import { Spacer } from 'uiSrc/ui'
import { INFINITE_MESSAGES } from 'uiSrc/components'

import { REQUIRE_LOGIN_ON_NEW_DB } from './constants'
import { OAuthForm } from '../../shared/oauth-form'
import OAuthAgreement from '../../shared/oauth-agreement/OAuthAgreement'
import { OAuthAdvantages, OAuthRecommendedSettings } from '../../shared'
import styles from './styles.module.scss'

export interface Props {
  source?: Nullable<OAuthSocialSource>
}

const OAuthCreateDb = (props: Props) => {
  const { source } = props
  const {
    data,
    setSSOFlow,
    showOAuthProgress,
    setSocialDialogState,
    setIsRecommendedSettingsSSO,
  } = useOAuthStore(useShallow((state) => ({
    data: state.user.data,
    setSSOFlow: state.setSSOFlow,
    showOAuthProgress: state.showOAuthProgress,
    setSocialDialogState: state.setSocialDialogState,
    setIsRecommendedSettingsSSO: state.setIsRecommendedSettingsSSO,
  })))

  const [isRecommended, setIsRecommended] = useState(true)

  const handleSocialButtonClick = (accountOption: string) => {
    setIsRecommendedSettingsSSO(isRecommended)
    const cloudRecommendedSettings = isRecommended ? 'enabled' : 'disabled'

    sendEventTelemetry({
      event: TelemetryEvent.CLOUD_SIGN_IN_SOCIAL_ACCOUNT_SELECTED,
      eventData: {
        accountOption,
        action: OAuthSocialAction.Create,
        cloudRecommendedSettings,
        source,
      },
    })
  }

  const handleChangeRecommendedSettings = (value: boolean) => {
    setIsRecommended(value)
  }

  const handleClickCreate = () => {
    setSSOFlow(OAuthSocialAction.Create)
    showOAuthProgress(true)
    showInfinityToast(INFINITE_MESSAGES.PENDING_CREATE_DB(CloudJobStep.Credentials)?.Inner)
    setSocialDialogState(null)

    if (isRecommended) {
      createFreeDbJob({
        name: CloudJobName.CreateFreeSubscriptionAndDatabase,
        resources: {
          isRecommendedSettings: isRecommended,
        },
        onFailAction: () => {
          setSSOFlow(undefined)
        },
      })

      return
    }

    fetchCloudSubscriptionPlans()
  }

  return (
    <div className={styles.container} data-testid="oauth-container-create-db">
      <div className={styles.advantagesContainer}>
        <OAuthAdvantages />
      </div>
      <div className={styles.socialContainer}>
        {!data || REQUIRE_LOGIN_ON_NEW_DB ? (
          <OAuthForm
            className={styles.socialButtons}
            onClick={handleSocialButtonClick}
            action={OAuthSocialAction.Create}
          >
            {(form: React.ReactNode) => (
              <>
                <div className={styles.subTitle}>{l10n.t('Get started with')}</div>
                <div className={styles.title}><h2>{l10n.t('Free Redis Cloud database')}</h2></div>
                {form}
                <div>
                  <OAuthRecommendedSettings value={isRecommended} onChange={handleChangeRecommendedSettings} />
                  <OAuthAgreement />
                </div>
              </>
            )}
          </OAuthForm>
        ) : (
          <>
            <div className={styles.subTitle}>{l10n.t('Get your')}</div>
            <div className={styles.title}><h2>{l10n.t('Free Redis Cloud database')}</h2></div>
            <Spacer size="xl" />
            <div >
              {l10n.t('The database will be created automatically and can be changed from Redis Cloud.')}
            </div>
            <Spacer size="xl" />
            <OAuthRecommendedSettings value={isRecommended} onChange={handleChangeRecommendedSettings} />
            <Spacer />
            <VSCodeButton
              appearance="primary"
              onClick={handleClickCreate}
              data-testid="oauth-create-db"
            >
              {l10n.t('Create')}
            </VSCodeButton>
          </>
        )}
      </div>
    </div>
  )
}

export default OAuthCreateDb
