import { DynamoDB } from 'aws-sdk';

import { FundPriceChangeRate } from "../FundPriceRecord.type"
import attr from '../constants/attributeNames';



/**
 * Serilize a FundPriceRecord to dynamodb item
 */
const serialize = ({
    company,
    code,
    name,
    price,
    priceList,
    priceChangeRate,
    time,
    recordType,
}: FundPriceChangeRate): DynamoDB.DocumentClient.PutRequest => ({
    Item: {
        [attr.COMPANY_CODE]: `${company}_${code}`,
        [attr.TIME_SK]: `${recordType}_${company}_${time}`,
        [attr.COMPANY]: company,
        [attr.NAME]: name,
        [attr.PRICE]: price,
        [attr.PRICE_CHANGE_RATE]: priceChangeRate,
        [attr.PRICE_LIST]: priceList,
    }
})

export default serialize