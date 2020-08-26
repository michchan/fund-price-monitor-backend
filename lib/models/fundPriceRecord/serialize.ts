import { DynamoDB } from 'aws-sdk';

import { FundPriceRecord } from "./FundPriceRecord.type"
import attributeNames from './attributeNames';



/**
 * Serilize FundPriceRecord to dynamodb item
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
}: FundPriceRecord): DynamoDB.DocumentClient.PutRequest => ({
    Item: {
        [attributeNames.COMPANY_CODE]: `${company}_${code}`,
        [attributeNames.TIME]: `record_${time}`,
        [attributeNames.NAME]: name,
        [attributeNames.PRICE]: price,
        [attributeNames.UPDATED_DATE]: updatedDate,
        [attributeNames.RISK_LEVEL]: riskLevel,
        [attributeNames.FUND_TYPE]: fundType,
        [attributeNames.INITIAL_PRICE]: initialPrice,
        [attributeNames.LAUNCHED_DATE]: launchedDate,
    }
})

export default serialize