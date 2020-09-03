import batchWriteItems from "./batchWriteItems"
import listAllTables from "./listAllTables"
import queryAllItems from "./queryAllItems"
import expressionFunctions from "./expressionFunctions"
import waitForStream from "./waitForStream"
import scanAllItems from "./scanAllItems"
import mapRawAttributes from "./mapRawAttributes"



const db = {
    expressionFunctions,
    batchWriteItems,
    listAllTables,
    queryAllItems,
    scanAllItems,
    waitForStream,
    mapRawAttributes,
} as const
export default db