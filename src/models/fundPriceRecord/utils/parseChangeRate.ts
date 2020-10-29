import { DynamoDB } from 'aws-sdk'

import { AggregatedRecordType, CompanyType, FundPriceChangeRate } from '../FundPriceRecord.type'
import attr, { FundPriceRecordAttributeMap } from '../constants/attributeNames'

/**
 * Parse a dynamodb item to FundPriceChangeRate
 */
const parseChangeRate = (
  attributeMap: DynamoDB.DocumentClient.AttributeMap
): FundPriceChangeRate => {
  const {
    [attr.COMPANY_CODE]: company_code,
    [attr.TIME_SK]: timeSK,
    [attr.NAME]: name,
    [attr.PRICE]: price,
    [attr.PRICE_LIST]: priceList = [],
    [attr.PRICE_CHANGE_RATE]: priceChangeRate,
    [attr.PERIOD]: period = '',
    [attr.UPDATED_DATE]: updatedDate,
  } = attributeMap as unknown as FundPriceRecordAttributeMap

  const [company, code] = company_code.split('_') as [CompanyType, string]

  return {
    company,
    // Get the last composite segment of `company_code`
    code,
    name,
    price,
    priceChangeRate,
    priceList: priceList.map(li => li),
    // Get the last composite segment of `timeSK`
    time: timeSK.split('@').pop() || '',
    updatedDate,
    period: period.split('_').pop()
      || timeSK.split('@')
        .shift()
        ?.split('_')
        ?.pop()
      || '',
    // Get the first composite segment of `timeSK`
    recordType: timeSK.split('_').shift() as AggregatedRecordType,
  }
}

export default parseChangeRate