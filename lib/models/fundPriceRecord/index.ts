import getTableName from "./getTableName"
import getCurrentQuarter from "lib/helpers/getCurrentQuarter"
import createTable from "./createTable"
import listLatestTables from "./listLatestTables"
import isTableOfCurrentQuarter from "./isTableOfCurrentQuarter"
import fieldNames from "./fieldNames"
import indexNames from "./indexNames"


const fundPriceRecord = {
    fieldNames,
    getTableName,
    getCurrentQuarter,
    createTable,
    listLatestTables,
    isTableOfCurrentQuarter,
} as const
export default fundPriceRecord