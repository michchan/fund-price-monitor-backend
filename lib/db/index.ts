import batchCreateItems from "./batchCreateItems"
import listAllTables from "./listAllTables"



const db = {
    batchCreateItems,
    listAllTables,
} as const
export default db