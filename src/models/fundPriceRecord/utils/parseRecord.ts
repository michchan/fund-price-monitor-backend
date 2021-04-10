import { DynamoDB } from 'aws-sdk'

import { FundPriceRecord, FundType, RecordType } from '@michchan/fund-price-monitor-lib'
import attr, { FundPriceRecordAttributeMap } from '../constants/attributeNames'

/**
 * Parse a dynamodb item to FundPriceRecord
 */
const parseRecord = <FT extends FundType, RT extends RecordType> (
  attributeMap: DynamoDB.DocumentClient.AttributeMap
): FundPriceRecord<FT, RT> => {
  const {
    [attr.COMPANY_CODE]: company_code,
    [attr.TIME_SK]: timeSK,
    [attr.COMPANY]: company,
    [attr.PRICE]: price,
    [attr.UPDATED_DATE]: updatedDate,
    [attr.RISK_LEVEL]: riskLevel,
    [attr.FUND_TYPE]: fundType,
    [attr.PRICE_CHANGE_RATE]: priceChangeRate,
    [attr.DAY_PRICE_CHANGE_RATE]: dayPriceChangeRate,
    [attr.PREVIOUS_PRICE]: previousPrice,
    [attr.PREVIOUS_DAY_PRICE]: previousDayPrice,
    [attr.PREVIOUS_TIME]: previousTime,
  } = attributeMap as unknown as FundPriceRecordAttributeMap<FT>

  const timeSKSegments = timeSK.split('_')

  return {
    company,
    // Get the last composite segment of `company_code`
    code: company_code.split('_').pop() || '',
    updatedDate,
    price,
    riskLevel,
    // Get the last composite segment of `timeSK`
    time: timeSKSegments.pop() || '',
    fundType,
    // Get the first composite segment of `timeSK`
    recordType: timeSKSegments.shift() as RT,
    priceChangeRate,
    dayPriceChangeRate,
    previousPrice,
    previousDayPrice,
    previousTime,
  }
}

export default parseRecord