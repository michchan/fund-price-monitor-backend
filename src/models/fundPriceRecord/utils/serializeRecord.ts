import { DynamoDB } from 'aws-sdk'

import FundPriceRecord from '../FundPriceRecord.type'
import attr from '../constants/attributeNames'
import getCompositeSK from './getCompositeSK'
import getCompanyCodePK from './getCompanyCodePK'

/**
 * Serilize a FundPriceRecord to dynamodb item
 */
const serializeRecord = (record: FundPriceRecord): DynamoDB.DocumentClient.AttributeMap => {
  const {
    company,
    code,
    updatedDate,
    price,
    priceChangeRate,
    riskLevel,
    fundType,
  } = record

  return {
    [attr.COMPANY_CODE]: getCompanyCodePK({ company, code }),
    [attr.TIME_SK]: getCompositeSK(record),
    [attr.COMPANY]: company,
    [attr.PRICE]: price,
    [attr.PRICE_CHANGE_RATE]: priceChangeRate,
    [attr.UPDATED_DATE]: updatedDate,
    [attr.RISK_LEVEL]: riskLevel,
    [attr.FUND_TYPE]: fundType,
  }
}

export default serializeRecord