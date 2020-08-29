import batchCreateItems from "./batchCreateItems"
import listAllTables from "./listAllTables"
import queryAllItems from "./queryAllItems"



const db = {
    batchCreateItems,
    listAllTables,
    queryAllItems,
} as const
export default db