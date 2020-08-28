import { DynamoDB } from 'aws-sdk';

import { FundPriceRecord, CompanyType, RiskLevel, FundType } from "../FundPriceRecord.type"
import attributeNames from '../constants/attributeNames';
import attributeConstants from '../constants/attributeConstants';



type AttrName = typeof attributeNames

export type Item = {
    [key in AttrName[keyof AttrName]]: {
        S: string;
        N: number;
    }
}

/**
 * Parse a dynamodb item to FundPriceRecord
 */
const parse = ({
    [attributeNames.COMPANY_CODE]: company_code,
    [attributeNames.TIME_SK]: timeSK,
    [attributeNames.COMPANY]: company,
    [attributeNames.NAME]: name,
    [attributeNames.PRICE]: price,
    [attributeNames.UPDATED_DATE]: updatedDate,
    [attributeNames.RISK_LEVEL]: riskLevel,
    [attributeNames.FUND_TYPE]: fundType,
    [attributeNames.INITIAL_PRICE]: initialPrice,
    [attributeNames.LAUNCHED_DATE]: launchedDate,
}: Item): FundPriceRecord => ({
    company: company.S as CompanyType,
    code: company_code.S.split('_').pop() ?? '',
    name: name.S,
    updatedDate: updatedDate.S,
    price: +price.N,
    initialPrice: +initialPrice.N,
    launchedDate: launchedDate.S,
    riskLevel: riskLevel.S as RiskLevel,
    time: timeSK.S.split('_').pop() ?? '',
    fundType: fundType.S as FundType,
})

export default parse