import { DynamoDB } from 'aws-sdk'

import { FundPriceChangeRate } from "../FundPriceRecord.type"
import attr from '../constants/attributeNames'
import getCompositeSKFromChangeRate from './getCompositeSKFromChangeRate'



/**
 * Serilize a FundPriceChangeRate to dynamodb item
 */
const serializeChangeRate = (record: FundPriceChangeRate): DynamoDB.DocumentClient.PutRequest => {
  const {
    company,
    code,
    name,
    price,
    priceList,
    priceChangeRate,
    updatedDate,
    period,
    recordType,
  } = record

  return {
    Item: {
      [attr.COMPANY_CODE]: `${company}_${code}`,
      [attr.TIME_SK]: getCompositeSKFromChangeRate(record),
      [attr.PERIOD]: `${recordType}_${company}_${period}`,
      [attr.COMPANY]: company,
      [attr.NAME]: name,
      [attr.UPDATED_DATE]: updatedDate,
      [attr.PRICE]: price,
      [attr.PRICE_CHANGE_RATE]: priceChangeRate,
      [attr.PRICE_LIST]: priceList,
    }
  }
}

export default serializeChangeRate
