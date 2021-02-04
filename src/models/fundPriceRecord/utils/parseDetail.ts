import { DynamoDB } from 'aws-sdk'

import attr, { FundPriceRecordAttributeMap } from '../constants/attributeNames'
import FundDetails from '../FundDetails.type'
import { CompanyType } from '../FundPriceRecord.type'

/**
 * Parse a dynamodb item to FundPriceRecord
 */
const parseDetail = (attributeMap: DynamoDB.DocumentClient.AttributeMap): FundDetails => {
  const {
    [attr.TIME_SK]: timeSK,
    [attr.NAME]: name,
    [attr.INITIAL_PRICE]: initialPrice,
    [attr.LAUNCHED_DATE]: launchedDate,
    [attr.FUND_TYPE]: fundType,
    [attr.RISK_LEVEL]: riskLevel,
  } = attributeMap as unknown as FundPriceRecordAttributeMap

  const [company, code] = timeSK.split('_').slice(1) as [CompanyType, string]

  return {
    company,
    code,
    name,
    initialPrice,
    launchedDate,
    fundType,
    riskLevel,
  }
}

export default parseDetail