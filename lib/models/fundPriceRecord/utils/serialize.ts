import { DynamoDB } from 'aws-sdk';

import { FundPriceRecord } from "../FundPriceRecord.type"
import attr from '../constants/attributeNames';



/**
 * Serilize a FundPriceRecord to dynamodb item
 */
const serialize = ({
    company,
    code,
    name,
    updatedDate,
    price,
    initialPrice,
    launchedDate,
    riskLevel,
    time,
    fundType,
    recordType,
}: FundPriceRecord): DynamoDB.DocumentClient.PutRequest => ({
    Item: {
        [attr.COMPANY_CODE]: `${company}_${code}`,
        [attr.TIME_SK]: `${recordType}_${company}_${time}`,
        [attr.COMPANY]: company,
        [attr.NAME]: name,
        [attr.PRICE]: price,
        [attr.UPDATED_DATE]: updatedDate,
        [attr.RISK_LEVEL]: riskLevel,
        [attr.FUND_TYPE]: fundType,
        [attr.INITIAL_PRICE]: initialPrice,
        [attr.LAUNCHED_DATE]: launchedDate,
    }
})

export default serialize