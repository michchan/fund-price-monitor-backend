import getTableName from "./getTableName"
import getCurrentQuarter from "lib/helpers/getCurrentQuarter"
import createTable from "./createTable"
import listLatestTables from "./listLatestTables"


const fundPriceRecord = {
    getTableName,
    getCurrentQuarter,
    createTable,
    listLatestTables,
} as const
export default fundPriceRecord