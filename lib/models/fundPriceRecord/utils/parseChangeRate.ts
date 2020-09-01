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
const parse = (attributeMap: DynamoDB.AttributeMap): FundPriceChangeRate => {
    const {
        [attr.COMPANY_CODE]: company_code,
        [attr.TIME_SK]: timeSK,
        [attr.COMPANY]: company,
        [attr.NAME]: name,
        [attr.PRICE]: price,
        [attr.PRICE_LIST]: priceList,
        [attr.PRICE_CHANGE_RATE_SK]: priceChangeRateSK,
        [attr.UPDATED_DATE]: updatedDate,
    } = attributeMap as unknown as Item

    const [priceChangeRate, time] = priceChangeRateSK.S.split('@')

    return {
        company: company.S as CompanyType,
        // Get the last composite segment of `company_code`
        code: company_code.S.split('_').pop() ?? '',
        name: name.S,
        price: +price.N,
        priceChangeRate: +priceChangeRate,
        priceList: priceList.NS,
        // Get the last composite segment of `timeSK`
        time,
        updatedDate: updatedDate.S,
        period: timeSK.S.split('_').pop() ?? '',
        // Get the first composite segment of `timeSK`
        recordType: timeSK.S.split('_').shift() as AggregatedRecordType,
    }
}

export default parse