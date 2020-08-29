import batchCreateItems from "./batchCreateItems"
import listAllTables from "./listAllTables"
import queryAllItems from "./queryAllItems"
import expressionFunctions from "./expressionFunctions"



const db = {
    expressionFunctions,
    batchCreateItems,
    listAllTables,
    queryAllItems,
} as const
export default db