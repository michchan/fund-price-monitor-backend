import { DynamoDB } from 'aws-sdk'

import FundPriceChangeRate from '../FundPriceChangeRate.type'
import attr from '../constants/attributeNames'
import getCompositeSKFromChangeRate from './getCompositeSKFromChangeRate'
import getCompanyCodePK from './getCompanyCodePK'
import getCompositePeriod from './getCompositePeriod'

/**
 * Serilize a FundPriceChangeRate to dynamodb item
 */
const serializeChangeRate = (record: FundPriceChangeRate): DynamoDB.DocumentClient.AttributeMap => {
  const {
    company,
    code,
    price,
    priceList,
    priceTimestampList,
    priceChangeRate,
    updatedDate,
    period,
    recordType,
  } = record

  return {
    [attr.COMPANY_CODE]: getCompanyCodePK({ company, code }),
    [attr.TIME_SK]: getCompositeSKFromChangeRate(record),
    [attr.PERIOD]: getCompositePeriod({ recordType, company, period }),
    [attr.COMPANY]: company,
    [attr.UPDATED_DATE]: updatedDate,
    [attr.PRICE]: price,
    [attr.PRICE_CHANGE_RATE]: priceChangeRate,
    [attr.PRICE_LIST]: priceList,
    [attr.PRICE_TIMESTAMP_LIST]: priceTimestampList,
  }
}

export default serializeChangeRate