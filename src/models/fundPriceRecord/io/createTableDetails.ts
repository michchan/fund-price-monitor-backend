import { Quarter } from "simply-utils/dist/dateTime/getQuarter"
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import db from "src/lib/AWS/dynamodb"
import getTableName from "../utils/getTableName"
import { FundPriceTableDetails } from "../FundPriceRecord.type";
import attrs from "../constants/attributeNames";
import topLevelKeysValues from "../constants/topLevelKeysValues";
import AWS from 'src/lib/AWS'


const docClient = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true })

function createTableDetails (
    details: FundPriceTableDetails,
    year: string | number,
    quarter: Quarter,
) {
    const { time, companies, fundTypes } = details;

    return db.putItem({
        TableName: getTableName(year, quarter),
        Item: {
            [attrs.COMPANY_CODE]: `${topLevelKeysValues.TABLE_DETAILS_PK}`,
            [attrs.TIME_SK]: `${topLevelKeysValues.TABLE_DETAILS_PK}@${time}`,
            [attrs.COMPANIES]: companies.length > 0 ? docClient.createSet(companies) : undefined,
            [attrs.FUND_TYPES]: fundTypes.length > 0 ? docClient.createSet(fundTypes) : undefined,
        } as DocumentClient.AttributeValue,
    });
}

export default createTableDetails