import { filter, find, first, toNumber } from 'lodash'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { VscCheck, VscClose } from 'react-icons/vsc'
import Popup from 'reactjs-popup'
import { useShallow } from 'zustand/react/shallow'
import * as l10n from '@vscode/l10n'
import cx from 'classnames'
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react'
import { CloudJobName, CloudJobStep, OAuthProvider, OAuthProviders } from 'uiSrc/constants'
import { createFreeDbJob, useOAuthStore } from 'uiSrc/store'
import { CloudSubscriptionPlanResponse, Region } from 'uiSrc/store/hooks/use-oauth/interface'
import { RiButton, Select, SelectOption, DropdownMenuPosition } from 'uiSrc/ui'
import { sendEventTelemetry, showInfinityToast, TelemetryEvent } from 'uiSrc/utils'

import { INFINITE_MESSAGES } from 'uiSrc/components'
import styles from './styles.module.scss'

interface PlanLabelData {
  id: number,
  region: string,
  countryName: string,
  cityName: string,
  provider: string,
}

const getProviderRegions = (regions: Region[], provider: OAuthProvider) =>
  (find(regions, { provider }) || {}).regions || []

const DEFAULT_REGIONS = ['us-east-2', 'asia-northeast1']
const DEFAULT_PROVIDER = OAuthProvider.AWS

const OAuthSelectPlan = () => {
  const {
    isOpenDialog,
    fetchedPlans,
    loading,
    setIsOpenSelectPlanDialog,
    setSocialDialogState,
  } = useOAuthStore(useShallow((state) => ({
    isOpenDialog: state.plan.isOpenDialog,
    fetchedPlans: state.plan.data,
    loading: state.plan.loading,
    setIsOpenSelectPlanDialog: state.setIsOpenSelectPlanDialog,
    setSocialDialogState: state.setSocialDialogState,
  })))

  // TODO [DA]: Replace redis stack regions [] with the following lines, once feature flags are implemented
  // const { [FeatureFlags.cloudSso]: cloudSsoFeature = {} } = useSelector(appFeatureFlagsFeaturesSelector)
  // const rsRegions: Region[] = get(cloudSsoFeature, 'data.selectPlan.components.redisStackPreview', [])
  const rsRegions: Region[] = []

  const [plans, setPlans] = useState(fetchedPlans || [])
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<OAuthProvider>(DEFAULT_PROVIDER)
  const [redisStackProviderRegions, setRedisStackProviderRegions] = useState(getProviderRegions(rsRegions, selectedProvider))

  useEffect(() => {
    setRedisStackProviderRegions(getProviderRegions(rsRegions, selectedProvider))
  }, [selectedProvider, fetchedPlans])

  useEffect(() => {
    if (!fetchedPlans.length) {
      return
    }

    const filteredPlans = filter(fetchedPlans, { provider: selectedProvider })
      .sort((a, b) => (a?.details?.displayOrder || 0) - (b?.details?.displayOrder || 0))

    const defaultPlan = filteredPlans.find(({ region = '' }) => DEFAULT_REGIONS.includes(region))
    const rsPreviewPlan = filteredPlans.find(({ region = '' }) => redisStackProviderRegions?.includes(region))
    const planId = (defaultPlan || rsPreviewPlan || first(filteredPlans) || {}).id?.toString() || ''

    setPlans(filteredPlans)
    setSelectedPlanId(planId)
  }, [fetchedPlans, selectedProvider, redisStackProviderRegions])

  const handleOnClose = useCallback(() => {
    sendEventTelemetry({
      event: TelemetryEvent.CLOUD_SIGN_IN_PROVIDER_FORM_CLOSED,
    })
    setSelectedPlanId('')
    setSelectedProvider(DEFAULT_PROVIDER)
    setIsOpenSelectPlanDialog(false)
    setSocialDialogState(null)
  }, [])

  const regionOptions: SelectOption[] = useMemo(() => {
    const getPlanOptionLabel = (plan: PlanLabelData) => {
      const redisStackProviderRegions: string[] = find(rsRegions, { provider: plan.provider })?.regions || []
      return (
        <div data-testid={`option-${plan.region}`}>
          <span className="text-[11px]">{`${plan.countryName} (${plan.cityName})`}</span>
          <span className="text-[10px]"> {plan.region}</span>
          {redisStackProviderRegions?.includes(plan.region)
            && (<span className="text-[10px] ml-[10px]" data-testid={`rs-text-${plan.region}`}> (Redis 7.2)</span>)
          }
        </div>
      )
    }

    return plans.map(
      (item: CloudSubscriptionPlanResponse) => {
        const plan: PlanLabelData = {
          id: item.id,
          region: item.region ?? '',
          cityName: item.details.cityName ?? '',
          countryName: item.details.countryName ?? '',
          provider: item.provider,
        }

        return {
          value: `${plan.id}`,
          label: getPlanOptionLabel(plan),
          testid: `oauth-region-${plan.region}`,
        }
      },
    )
  }, [plans],
  )

  const onChangeRegion = (region: string) => {
    setSelectedPlanId(region || '')
  }

  const handleSubmit = () => {
    createFreeDbJob({
      name: CloudJobName.CreateFreeSubscriptionAndDatabase,
      resources: { planId: toNumber(selectedPlanId) },
      onSuccessAction: () => {
        setIsOpenSelectPlanDialog(false)
        showInfinityToast(INFINITE_MESSAGES.PENDING_CREATE_DB(CloudJobStep.Credentials)?.Inner)
      },
    })
  }

  if (!isOpenDialog) return null

  return (
    <Popup
      modal
      open={!!isOpenDialog}
      closeOnDocumentClick={false}
      className="oauth-select-plan-dialog"
      data-testid="oauth-select-plan-dialog"
    >
      <RiButton data-testid="close-icon-oauth-select-plan-dialog" className={styles.closeBtn} onClick={handleOnClose} >
        <VscClose />
      </RiButton>
      <section className={styles.content}>

        <h2 className={styles.title}>{l10n.t('Choose a cloud vendor')}</h2>

        <div className={styles.subTitle}>
          {l10n.t(
            'Select a cloud vendor and region to complete the final step towards your free Redis Cloud database.',
          )}
          &nbsp;
          {l10n.t(
            'No credit card is required.',
          )}
        </div>

        <section className={styles.providers}>
          {OAuthProviders.map(({ icon: Icon, id, label }) => (
            <div className={styles.provider} key={id}>
              {id === selectedProvider
                && <div className={cx(styles.providerActiveIcon)}>
                  <VSCodeButton appearance="icon">
                    <VscCheck />
                  </VSCodeButton>
                </div>
              }

              <RiButton onClick={() => setSelectedProvider(id)}
                className={cx(styles.providerBtn,
                  { [styles.activeProvider]: id === selectedProvider },
                  { [styles.awsIcon]: id === OAuthProvider.AWS },
                )}>
                <Icon />
              </RiButton>

              <div className={styles.providerLabel}>{label}</div>
            </div>
          ))}
        </section>

        <section className={styles.region}>
          <div>{l10n.t('Region')}</div>
          <Select
            disabled={loading || !regionOptions.length}
            idSelected={selectedPlanId}
            onChange={onChangeRegion}
            options={regionOptions}
            containerClassName={styles.select}
            testid="select-oauth-region"
            itemClassName={styles.option}
            position={regionOptions.length > 2 ? DropdownMenuPosition.ABOVE : DropdownMenuPosition.BELOW}
          />

          {!regionOptions.length && (
            <div className={styles.selectDescription}
              data-testid="select-region-select-description">
              {l10n.t('No regions available, try another vendor.')}
            </div>
          )}
        </section>

        <footer className={styles.footer}>
          <VSCodeButton
            appearance="secondary"
            onClick={handleOnClose}
            className={styles.button}
            data-testid="close-oauth-select-plan-dialog"
            aria-labelledby="close oauth select plan dialog"
          >
            {l10n.t('Cancel')}
          </VSCodeButton>
          <VSCodeButton
            disabled={loading || !selectedPlanId}
            onClick={handleSubmit}
            className={styles.button}
            data-testid="submit-oauth-select-plan-dialog"
            aria-labelledby="submit oauth select plan dialog"
          >
            {l10n.t('Create database')}
          </VSCodeButton>
        </footer>
      </section>
    </Popup >
  )
}

export default OAuthSelectPlan
