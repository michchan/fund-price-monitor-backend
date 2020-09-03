import { Quarter } from "simply-utils/dist/dateTime/getQuarter"
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import db from "src/lib/AWS/dynamodb"
import getTableName from "../utils/getTableName"
import { FundPriceTableDetails } from "../FundPriceRecord.type";
import attrs from "../constants/attributeNames";
import topLevelKeysValues from "../constants/topLevelKeysValues";
import AWS from 'src/lib/AWS'


const docClient = new AWS.DynamoDB.DocumentClient()

function createTableDetails (
    details: FundPriceTableDetails,
    year: string | number,
    quarter: Quarter,
) {
    return db.putItem({
        TableName: getTableName(year, quarter),
        Item: {
            [attrs.COMPANY_CODE]: `${topLevelKeysValues.TABLE_DETAILS_PK}`,
            [attrs.TIME_SK]: `${topLevelKeysValues.TABLE_DETAILS_PK}@${details.time}`,
            [attrs.COMPANIES]: docClient.createSet(details.companies),
            [attrs.FUND_TYPES]: docClient.createSet(details.fundTypes)
        } as DocumentClient.AttributeValue,
    });
}

export default createTableDetails