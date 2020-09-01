import { DynamoDB } from 'aws-sdk';

import { CompanyType, FundPriceChangeRate, AggregatedRecordType } from "../FundPriceRecord.type"
import attr from '../constants/attributeNames';



type AttrName = typeof attr

export type Item = {
    [key in string]: {
        S: string;
        N: number;
        NS: number[];
    }
}

/**
 * Parse a dynamodb item to FundPriceChangeRate
 */
const parseChangeRate = (attributeMap: DynamoDB.AttributeMap): FundPriceChangeRate => {
    try {
        const {
            [attr.COMPANY_CODE]: company_code,
            [attr.TIME_SK]: timeSK,
            [attr.NAME]: name,
            [attr.PRICE]: price,
            [attr.PRICE_LIST]: priceList,
            [attr.PRICE_CHANGE_RATE]: priceChangeRate,
            [attr.PERIOD]: period,
            [attr.UPDATED_DATE]: updatedDate,
        } = attributeMap as unknown as Item
        
        const [company, code] = company_code.S.split('_') as [CompanyType, string]

        return {
            company,
            // Get the last composite segment of `company_code`
            code,
            name: name.S,
            price: +price.N,
            priceChangeRate: +priceChangeRate.N,
            priceList: priceList.NS,
            // Get the last composite segment of `timeSK`
            time: timeSK.S.split('@').pop() ?? '',
            updatedDate: updatedDate.S,
            period: period.S.split('_').pop() ?? '',
            // Get the first composite segment of `timeSK`
            recordType: timeSK.S.split('_').shift() as AggregatedRecordType,
        }
    } catch (error) {
        console.log('ERROR ITEM: ', JSON.stringify(attributeMap, null, 2))
        throw error
    }
}

export default parseChangeRate