import getTableName from "./getTableName"
import getCurrentQuarter from "lib/helpers/getCurrentQuarter"
import createTable from "./createTable"
import listLatestTables from "./listLatestTables"
import isTableOfCurrentQuarter from "./isTableOfCurrentQuarter"
import attributeNames from "./attributeNames"
import indexNames from "./indexNames"
import batchCreateItems from "./batchCreateItems"
import serialize from "./serialize"


const fundPriceRecord = {
    serialize,
    batchCreateItems,
    attributeNames,
    indexNames,
    getTableName,
    getCurrentQuarter,
    createTable,
    listLatestTables,
    isTableOfCurrentQuarter,
} as const
export default fundPriceRecord