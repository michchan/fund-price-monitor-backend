import batchCreateItems from "./batchCreateItems"
import listAllTables from "./listAllTables"
import queryAllItems from "./queryAllItems"
import expressionFunctions from "./expressionFunctions"
import waitForStream from "./waitForStream"



const db = {
    expressionFunctions,
    batchCreateItems,
    listAllTables,
    queryAllItems,
    waitForStream,
} as const
export default db