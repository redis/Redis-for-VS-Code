import React from 'react'
import * as l10n from '@vscode/l10n'
import cx from 'classnames'
import { VscChevronRight, VscCloud } from 'react-icons/vsc'

import { RiButton } from 'uiSrc/ui'
import { useOAuthStore } from 'uiSrc/store'
import { OAuthSocialAction, OAuthSocialSource, VscodeMessageAction } from 'uiSrc/constants'
import { sendEventTelemetry, TelemetryEvent } from 'uiSrc/utils'
import { vscodeApi } from 'uiSrc/services'
import styles from './styles.module.scss'

interface Props {
  source: OAuthSocialSource
  compressed?: boolean
}

const OAuthCreateFreeDb = ({ source, compressed }: Props) => {
  const { setSSOFlow, setSocialDialogState } = useOAuthStore((state) => ({
    setSSOFlow: state.setSSOFlow,
    setSocialDialogState: state.setSocialDialogState,
  }))

  const handleClick = () => {
    sendEventTelemetry({
      event: TelemetryEvent.CLOUD_FREE_DATABASE_CLICKED,
      eventData: { source },
    })

    if (compressed) {
      vscodeApi.postMessage({
        action: VscodeMessageAction.OpenAddDatabase,
        data: {
          ssoFlow: OAuthSocialAction.Create,
          source,
        },
      })

      return
    }

    setSSOFlow(OAuthSocialAction.Create)
    setSocialDialogState(source)
  }

  const description = !compressed
    ? l10n.t('Includes native support for JSON, Query and Search and more.')
    : l10n.t('Get free Redis Cloud database')

  return (
    <>
      {!compressed && <h2 className="pt-8 text-[16px]">{l10n.t('Create free Redis Cloud database')}</h2>}
      <RiButton
        className={cx(styles.link, { [styles.compressed]: compressed })}
        onClick={handleClick}
        data-testid="create-free-db-btn"
      >
        <VscCloud className={styles.iconCloud} />
        <div className={styles.content}>
          <div className={styles.title}>
            <span>{l10n.t('Try Redis Cloud database: your ultimate Redis starting point')}</span>
          </div>
          <div className={styles.description}>
            <span>{description}</span>
          </div>
        </div>
        <VscChevronRight className={styles.iconChevron} />
        <span className={styles.compressedBtn}>{l10n.t('Create')}</span>
      </RiButton>
    </>
  )
}

export default OAuthCreateFreeDb
