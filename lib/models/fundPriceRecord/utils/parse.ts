import { DynamoDB } from 'aws-sdk';

import { FundPriceRecord, CompanyType, RiskLevel, FundType, RecordType } from "../FundPriceRecord.type"
import attr from '../constants/attributeNames';



type AttrName = typeof attr

export type Item = {
    [key in string]: {
        S: string;
        N: number;
    }
}

/**
 * Parse a dynamodb item to FundPriceRecord
 */
const parse = (attributeMap: DynamoDB.AttributeMap): FundPriceRecord => {
    const {
        [attr.COMPANY_CODE]: company_code,
        [attr.TIME_SK]: timeSK,
        [attr.COMPANY]: company,
        [attr.NAME]: name,
        [attr.PRICE]: price,
        [attr.UPDATED_DATE]: updatedDate,
        [attr.RISK_LEVEL]: riskLevel,
        [attr.FUND_TYPE]: fundType,
        [attr.INITIAL_PRICE]: initialPrice,
        [attr.LAUNCHED_DATE]: launchedDate,
    } = attributeMap as unknown as Item

    return {
        company: company.S as CompanyType,
        // Get the last composite segment of `company_code`
        code: company_code.S.split('_').pop() ?? '',
        name: name.S,
        updatedDate: updatedDate.S,
        price: +price.N,
        initialPrice: +initialPrice.N,
        launchedDate: launchedDate.S,
        riskLevel: riskLevel.S as RiskLevel,
        // Get the last composite segment of `timeSK`
        time: timeSK.S.split('_').pop() ?? '',
        fundType: fundType.S as FundType,
        // Get the first composite segment of `timeSK`
        recordType: timeSK.S.split('_').shift() as RecordType,
    }
}

export default parse