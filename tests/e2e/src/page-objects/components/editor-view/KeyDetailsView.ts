import { By } from 'selenium-webdriver'
import {
  ButtonActions,
  DropdownActions,
  InputActions,
} from '@e2eSrc/helpers/common-actions'
import { CommonDriverExtension } from '@e2eSrc/helpers/CommonDriverExtension'
import { WebView } from '@e2eSrc/page-objects/components/WebView'
import { InputWithButtons } from '../common/InputWithButtons'
import { Key } from 'vscode-extension-tester'

/**
 * Key details view
 */
export class KeyDetailsView extends WebView {
  keyType = By.xpath(`//div[contains(@class, '_keyFlexGroup')]`)
  keySize = By.xpath(`//div[@data-testid='key-size-text']`)
  keyLength = By.xpath(`//div[@data-testid='top-level-values']`)
  refreshKeyButton = By.xpath(`//*[@data-testid='key-refresh-btn']`)
  refreshKeyArrow = By.xpath(`//*[@data-testid='key-auto-refresh-config-btn']`)
  refreshKeyMessage = By.xpath(`//*[@data-testid='key-refresh-message']`)
  autoRefreshInput= By.xpath(`//*[@data-testid='inline-item-editor']`)
  autoRefreshCheckBox= By.xpath(`//*[contains(@class, 'popover-auto-refresh-content')]//label`)
  applyBtn = By.xpath(
    `//*[@class='key-details-body']//*[@data-testid='apply-btn']`,
  )
  applyRefreshButton = By.xpath(`//*[@data-testid='key-auto-refresh-rate-input']//*[@data-testid="apply-btn"]`)
  applyEditButton = By.xpath(`//*[@data-testid='apply-edit-btn']`)
  searchInput = By.xpath(`//*[@data-testid='search']`)
  clearSearchInput = By.xpath(`//*[@data-testid='decline-search-button']`)
  setMemberInput = By.xpath(`//*[starts-with(@data-testid, 'member-name')]`)
  keyNameInput = By.xpath(`//*[@data-testid='edit-key-input']`)
  copyKeyNameBtn = By.xpath(`//*[@data-testid='copy-name-button']`)
  editTtlInput = By.xpath(`//*[@data-testid='edit-ttl-input']`)
  // BUTTONS
  searchButtonInKeyDetails = By.xpath(
    `//vscode-button[@data-testid='search-button']`,
  )
  addKeyValueItemsButton = By.xpath(
    `//*[@data-testid='add-key-value-items-btn']`,
  )
  copyButton = By.xpath(
    `//vscode-button[starts-with(@data-testid, 'copy-name-button')]`,
  )
  detailsDeleteKeyButton = By.xpath(
    `//button[starts-with(@data-testid, 'remove-key-')]`,
  )
  submitDetailsDeleteKeyButton = By.xpath(
    `//div[@class='popup-content ']//vscode-button[starts-with(@data-testid, 'remove-key-')]`,
  )
  saveMemberButton = By.xpath(`//*[@data-testid='save-members-btn']`)
  formatSwitcher = By.xpath(`//*[@data-testid='select-format-key-value']`)
  saveButton = By.xpath(`//vscode-button[@data-testid='save-btn']`)
  applyTtlInputBtn = By.xpath(
    `//*[@data-testid='edit-ttl-btn']//*[@data-testid='apply-btn']`,
  )
  unsupportedTypeMessage = By.xpath(`//*[@data-testid='unsupported-type-details']`)

  getTrashIcon = (keyType: string, name: string): By =>
    By.xpath(
      `//*[@data-testid="remove-${keyType}-button-${name}-icon"]
      | //*[@data-testid="${keyType}-remove-button-${name}-icon"]
      | //*[@data-testid="${keyType}-remove-btn-${name}-icon"]
      | //*[@data-testid="remove-${keyType}-button-${name}-trigger"]
      | //*[@data-testid="${keyType}-remove-button-${name}-trigger"]`,
    )
  getCommonTrashIcon = (keyType: string): By =>
    By.xpath(
      `//*[contains(@data-testid,"${keyType}-remove-btn-")] | //*[contains(@data-testid,"${keyType}-remove-button-")]`,
    )
  getCommonRemoveButton = (keyType: string): By =>
    By.xpath(
      `//*[contains(@data-testid, "${keyType}-remove-btn-") and not(contains(@data-testid, "-trigger"))] | //*[contains(@data-testid, "${keyType}-remove-button-") and not(contains(@data-testid, "-trigger"))]`,
    )
  getRemoveButton = (keyType: string, name: string): By =>
    By.xpath(
      `//*[@data-testid="remove-${keyType}-button-${name}"] | //*[@data-testid="${keyType}-remove-button-${name}"]`,
    )
  getFormatterOption = (formatter: string): By =>
    By.xpath(`//vscode-option[@data-testid="format-option-${formatter}"]`)
  getKeyValue = (keyName: string, columnName: string): By =>
    By.xpath(`//*[@data-testid[starts-with(., '${keyName.split('-')[0]}') and contains(., '${columnName}')]]
    | //*[@data-testid[starts-with(., '${keyName.split('-')[0]}-field-') and contains(., '${columnName}')]]`)
  getHighlightedValue = (keyName: string, columnName: string): By =>
    By.xpath(`//*[@data-testid[starts-with(., '${keyName.split('-')[0]}') and contains(., '${columnName}')]]//*[@data-testid='value-as-json']
    | //*[@data-testid[starts-with(., '${keyName.split('-')[0]}-field-') and contains(., '${columnName}')]]//*[@data-testid='value-as-json']`)
  getEditBtnByKeyName = (keyName: string): By =>
    By.xpath(`//vscode-button[contains(@data-testid, 'edit') and contains(@data-testid, '${keyName}')]`)
  /**
   * get key size
   */
  async getKeySize(): Promise<number> {
    const keySizeText = await super.getElementText(this.keySize)
    const regex = /Key Size: (\d+)/
    const match = keySizeText.match(regex)
    return match ? parseInt(match[1], 10) : parseInt(keySizeText, 10)
  }

  /**
   * get key length
   */
  async getKeyLength(): Promise<number> {
    const keyLengthText = await super.getElementText(this.keyLength)
    const regex = /Length: (\d+)/
    const match = keyLengthText.match(regex)
    return match ? parseInt(match[1], 10) : NaN
  }

  /**
   * Search by the value in the key details
   * @param value The value of the search parameter
   */
  async searchByTheValueInKeyDetails(value: string): Promise<void> {
    if (!(await super.isElementDisplayed(this.searchInput))) {
      await ButtonActions.clickAndWaitForElement(
        this.searchButtonInKeyDetails,
        this.searchInput,
      )
    }
    await InputActions.typeText(this.searchInput, value)
    await InputActions.pressKey(this.searchInput, 'enter')
    await CommonDriverExtension.driverSleep(1000)
  }

  /**
   * Clear search input in key details table
   */
  async clearSearchInKeyDetails(): Promise<void> {
    if (!(await super.isElementDisplayed(this.searchInput))) {
      await ButtonActions.clickAndWaitForElement(
        this.searchButtonInKeyDetails,
        this.searchInput,
      )
    }
    await ButtonActions.clickElement(this.clearSearchInput)
    await InputActions.pressKey(this.searchInput, 'enter')
    await CommonDriverExtension.driverSleep(1000)
  }

  /**
   * Click on remove button by field
   * @param keyType The key type
   * @param name The field value
   */
  async clickRemoveRowButtonByField(
    keyType: string,
    name: string,
  ): Promise<void> {
    const removeLocator = this.getRemoveButton(keyType, name)
    await ButtonActions.clickElement(removeLocator)
  }

  /**
   * Click on copy button
   */
  async clickCopyKeyName(): Promise<void> {
    await ButtonActions.hoverElement(this.keyType)
    await ButtonActions.clickElement(this.copyButton)
  }

  /**
   * Remove row by field
   * @param keyType The key type
   * @param name The field value
   */
  async removeRowByField(keyType: string, name: string): Promise<void> {
    const rowInTheListLocator = this.getTrashIcon(keyType, name)
    await ButtonActions.clickElement(rowInTheListLocator)
  }

  /**
   * Remove the first row
   * @param keyType The key type
   */
  async removeFirstRow(keyType: string): Promise<void> {
    const rowInTheListLocator = this.getCommonTrashIcon(keyType)
    await ButtonActions.clickElement(rowInTheListLocator)
    const removeLocator = this.getCommonRemoveButton(keyType)
    await ButtonActions.clickElement(removeLocator)
  }
  /**
   * Remove multiple rows in key by field values
   * @param keyType The key type
   * @param names The field values
   */
  async removeRowsByFieldValues(
    keyType: string,
    names: string[],
  ): Promise<void> {
    for (const name of names) {
      await this.removeRowByField(keyType, name)
      await this.clickRemoveRowButtonByField(keyType, name)
    }
  }

  /**
   * Remove key from key details
   */
  async removeKeyFromDetailedView(): Promise<void> {
    await ButtonActions.clickElement(this.detailsDeleteKeyButton)
    await ButtonActions.clickElement(this.submitDetailsDeleteKeyButton)
  }

  /**
   * Edit key name from details
   * @param keyName The name of the key
   */
  async editKeyName(keyName: string): Promise<void> {
    await ButtonActions.clickElement(this.keyNameInput)
    await InputActions.slowType(this.keyNameInput, keyName)
    await ButtonActions.clickElement(InputWithButtons.applyInput)
  }

  /**
   * Open formatter dropdown and select option
   * @param formatter The name of formatter
   */
  async selectFormatter(formatter: string): Promise<void> {
    await DropdownActions.selectDropdownValueWithScroll(
      this.formatSwitcher,
      formatter,
    )
  }

  /**
   * Set auto-refresh
   * @param rate The rate for refresh
   */
  async setAutoRefresh(rate: number = 5): Promise<void> {
    await ButtonActions.clickElement(this.refreshKeyArrow)
    await ButtonActions.clickElement(this.autoRefreshInput)
    // clear the input
    for (let i = 0; i < 3; i++) {
      await InputActions.pressKey(this.autoRefreshInput, Key.BACK_SPACE)
    }
    await InputActions.typeText(this.autoRefreshInput, rate.toString())
    await ButtonActions.clickElement(this.autoRefreshInput)
    await ButtonActions.clickElement(this.applyRefreshButton)
    await ButtonActions.clickElement(this.autoRefreshCheckBox)
    await ButtonActions.clickElement(this.refreshKeyButton)
  }
}
