import { CompanyType, FundType, Languages, RiskLevel } from '@michchan/fund-price-monitor-lib'

export type RiskLevelMap = {
  [key in RiskLevel]: string[];
}
export type RLKey = keyof RiskLevelMap

// @TODO: Refractor with scrapeDetails
// Map gif name to risk level
export const riskLevelMap: RiskLevelMap = {
  [RiskLevel.veryLow]: ['1'],
  [RiskLevel.low]: ['2', '3'],
  [RiskLevel.neutral]: ['4'],
  [RiskLevel.high]: ['5', '6'],
  [RiskLevel.veryHigh]: ['7'],
  [RiskLevel.unknown]: [],
}

export interface SerializableStaticClientData {
  company: CompanyType;
  fundType: FundType;
  riskLevelMap: RiskLevelMap;
}

export const INDEX_PAGE_LIST_CONTAINER_SELECTOR = '.funds-list__items.latest-price'
// eslint-disable-next-line max-len
export const INDEX_PAGE_WAIT_FOR_ELEMENT_SELECTOR = `${INDEX_PAGE_LIST_CONTAINER_SELECTOR} > div:last-child > div > div:last-child`

export const serializableStaticClientData: SerializableStaticClientData = {
  company: CompanyType.manulife,
  fundType: FundType.mpf,
  riskLevelMap,
}

// Locales recognized by the Manulife website
export const locales: { [lng in Languages]: string } = {
  en: 'en',
  zh_HK: 'zh-hk',
}

export const getPageProductName = (lng: Languages): string => {
  switch (lng) {
    case Languages.en:
      return 'Manulife%20Global%20Select%20(MPF)%20Scheme'
    case Languages.zh_HK:
      return '宏利環球精選(強積金)計劃'
  }
}

export const getIndexPageUrl = (lng: Languages): string => `https://www.manulife.com.hk/${locales[lng]}/individual/fund-price/mpf.html/v2?product=${getPageProductName(lng)}`