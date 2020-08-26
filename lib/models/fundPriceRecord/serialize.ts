import { DynamoDB } from 'aws-sdk';

import { FundPriceRecord } from "./FundPriceRecord.type"
import attributeNames from './attributeNames';
import attributePrefixes from './attributePrefixes';



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
        [attributeNames.TIME_SK]: `${attributePrefixes.RECORD}_${company}_${time}`,
        [attributeNames.COMPANY]: company,
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