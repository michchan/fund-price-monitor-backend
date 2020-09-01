import batchWriteItems from "./batchWriteItems"
import listAllTables from "./listAllTables"
import queryAllItems from "./queryAllItems"
import expressionFunctions from "./expressionFunctions"
import waitForStream from "./waitForStream"
import scanAllItems from "./scanAllItems"



const db = {
    expressionFunctions,
    batchWriteItems,
    listAllTables,
    queryAllItems,
    scanAllItems,
    waitForStream,
} as const
export default db