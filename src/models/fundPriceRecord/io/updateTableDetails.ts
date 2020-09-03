import { Quarter } from "simply-utils/dist/dateTime/getQuarter"
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import db from "src/lib/AWS/dynamodb"
import getTableName from "../utils/getTableName"
import attrs from "../constants/attributeNames";
import topLevelKeysValues from "../constants/topLevelKeysValues";
import { Input } from "src/lib/AWS/dynamodb/updateItem";


function updateTableDetails (
    input: Omit<Input, 'TableName' | 'Key'>,
    year: string | number,
    quarter: Quarter,
) {
    return db.updateItem({
        ...input,
        TableName: getTableName(year, quarter),
        Key: {
            [attrs.COMPANY_CODE]: `${topLevelKeysValues.TABLE_DETAILS_PK}`,
        } as DocumentClient.AttributeValue,
    });
}

export default updateTableDetails