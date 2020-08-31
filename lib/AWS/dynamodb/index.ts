import batchCreateItems from "./batchCreateItems"
import listAllTables from "./listAllTables"
import queryAllItems from "./queryAllItems"
import expressionFunctions from "./expressionFunctions"
import waitForStream from "./waitForStream"
import scanAllItems from "./scanAllItems"



const db = {
    expressionFunctions,
    batchCreateItems,
    listAllTables,
    queryAllItems,
    scanAllItems,
    waitForStream,
} as const
export default db