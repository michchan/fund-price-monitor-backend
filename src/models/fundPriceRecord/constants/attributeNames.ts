import { CompanyType, FundType, RiskLevel } from '../FundPriceRecord.type'

const attributeNames = {
  // Based table partition key
  COMPANY_CODE: 'company_code',
  // Based table sort key
  TIME_SK: 'timeSK',
  COMPANY: 'company',
  NAME: 'name',
  RISK_LEVEL: 'riskLevel',
  PRICE: 'price',
  UPDATED_DATE: 'updatedDate',
  LAUNCHED_DATE: 'launchedDate',
  INITIAL_PRICE: 'initialPrice',
  FUND_TYPE: 'fundType',
  /** Top-level fields (aggregate items) */
  PERIOD: 'period',
  PRICE_CHANGE_RATE: 'priceChangeRate',
  PRICE_LIST: 'priceList',
  /** Table-level fields (table details items) */
  COMPANIES: 'companies',
  FUND_TYPES: 'fundTypes',
} as const
export default attributeNames

export type AttrName = typeof attributeNames
export type StringAttrNameKey = keyof Pick<AttrName,
| 'COMPANY'
| 'COMPANY_CODE'
| 'TIME_SK'
| 'NAME'
| 'PRICE'
| 'UPDATED_DATE'
| 'LAUNCHED_DATE'
| 'PERIOD'
>
export type NumberAttrNameKey = keyof Pick<AttrName,
| 'PRICE'
| 'INITIAL_PRICE'
| 'PRICE_CHANGE_RATE'
>
export type NumberListAttrNameKey = keyof Pick<AttrName,
| 'PRICE_LIST'
>

export type FundPriceRecordAttributeMap <FT extends FundType = FundType> = {
  [key in AttrName[StringAttrNameKey]]: string
} & {
  [key in AttrName[NumberAttrNameKey]]: number
} & {
  [key in AttrName[NumberListAttrNameKey]]: number[]
} & {
  [key in AttrName['FUND_TYPE']]: FT
} & {
  [key in AttrName['RISK_LEVEL']]: RiskLevel
} & {
  [key in AttrName['COMPANY']]: CompanyType
}