import getTableName from "./getTableName"
import getCurrentQuarter from "lib/helpers/getCurrentQuarter"
import createTable from "./createTable"
import listLatestTables from "./listLatestTables"
import isTableOfCurrentQuarter from "./isTableOfCurrentQuarter"


const fundPriceRecord = {
    getTableName,
    getCurrentQuarter,
    createTable,
    listLatestTables,
    isTableOfCurrentQuarter,
} as const
export default fundPriceRecord