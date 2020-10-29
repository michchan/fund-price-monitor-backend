import { DynamoDB } from 'aws-sdk'

import { FundPriceRecord, RecordType } from '../FundPriceRecord.type'
import attr, { FundPriceRecordAttributeMap } from '../constants/attributeNames'

/**
 * Parse a dynamodb item to FundPriceRecord
 */
const parse = (attributeMap: DynamoDB.DocumentClient.AttributeMap): FundPriceRecord => {
  const {
    [attr.COMPANY_CODE]: company_code,
    [attr.TIME_SK]: timeSK,
    [attr.COMPANY]: company,
    [attr.NAME]: name,
    [attr.PRICE]: price,
    [attr.UPDATED_DATE]: updatedDate,
    [attr.RISK_LEVEL]: riskLevel,
    [attr.FUND_TYPE]: fundType,
    [attr.INITIAL_PRICE]: initialPrice,
    [attr.LAUNCHED_DATE]: launchedDate,
    [attr.PRICE_CHANGE_RATE]: priceChangeRate,
  } = attributeMap as unknown as FundPriceRecordAttributeMap

  const timeSKSegments = timeSK.split('_')

  return {
    company,
    // Get the last composite segment of `company_code`
    code: company_code.split('_').pop() || '',
    name,
    updatedDate,
    price,
    initialPrice,
    launchedDate,
    riskLevel,
    // Get the last composite segment of `timeSK`
    time: timeSKSegments.pop() || '',
    fundType,
    // Get the first composite segment of `timeSK`
    recordType: timeSKSegments.shift() as RecordType,
    priceChangeRate,
  }
}

export default parse