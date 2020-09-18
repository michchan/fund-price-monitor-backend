import batchWriteItems from "./batchWriteItems"
import listAllTables from "./listAllTables"
import queryAllItems from "./queryAllItems"
import expressionFunctions from "./expressionFunctions"
import waitForStream from "./waitForStream"
import scanAllItems from "./scanAllItems"
import putItem from "./putItem"
import updateItem from "./updateItem"
import queryItems from "./queryItems"



const db = {
    queryItems,
    putItem,
    updateItem,
    expressionFunctions,
    batchWriteItems,
    listAllTables,
    queryAllItems,
    scanAllItems,
    waitForStream,
} as const
export default db