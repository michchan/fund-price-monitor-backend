import { DynamoDB } from 'aws-sdk';

import { FundPriceRecord } from "../FundPriceRecord.type"
import attr from '../constants/attributeNames';
import getCompositeSK from './getCompositeSK';



/**
 * Serilize a FundPriceRecord to dynamodb item
 */
const serialize = (record: FundPriceRecord): DynamoDB.DocumentClient.PutRequest => {
    const {
        company,
        code,
        name,
        updatedDate,
        price,
        initialPrice,
        launchedDate,
        riskLevel,
        fundType,
    } = record;

    return {
        Item: {
            [attr.COMPANY_CODE]: `${company}_${code}`,
            [attr.TIME_SK]: getCompositeSK(record),
            [attr.COMPANY]: company,
            [attr.NAME]: name,
            [attr.PRICE]: price,
            [attr.UPDATED_DATE]: updatedDate,
            [attr.RISK_LEVEL]: riskLevel,
            [attr.FUND_TYPE]: fundType,
            [attr.INITIAL_PRICE]: initialPrice,
            [attr.LAUNCHED_DATE]: launchedDate,
        }
    }
}

export default serialize