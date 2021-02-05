import { DynamoDB } from 'aws-sdk'

import FundDetails from '../FundDetails.type'
import attr from '../constants/attributeNames'
import getRecordDetailsSK from './getRecordDetailsSK'
import topLevelKeysValues from '../constants/topLevelKeysValues'

/**
 * Serilize a FundPriceRecord to dynamodb item
 */
const serializeFundDetails = (record: FundDetails): DynamoDB.DocumentClient.AttributeMap => {
  const {
    name,
    initialPrice,
    launchedDate,
    riskLevel,
    fundType,
  } = record

  return {
    [attr.COMPANY_CODE]: topLevelKeysValues.DETAILS_PK,
    [attr.TIME_SK]: getRecordDetailsSK(record),
    [attr.NAME]: name,
    [attr.INITIAL_PRICE]: initialPrice,
    [attr.LAUNCHED_DATE]: launchedDate,
    [attr.RISK_LEVEL]: riskLevel,
    [attr.FUND_TYPE]: fundType,
  }
}

export default serializeFundDetails