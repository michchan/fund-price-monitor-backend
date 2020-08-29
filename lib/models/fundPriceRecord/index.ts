import getTableName from "./utils/getTableName"
import getCurrentQuarter from "lib/helpers/getCurrentQuarter"
import createTable from "./io/createTable"
import listLatestTables from "./io/listLatestTables"
import isTableOfCurrentQuarter from "./utils/isTableOfCurrentQuarter"
import attributeNames from "./constants/attributeNames"
import indexNames from "./constants/indexNames"
import batchCreateItems from "./io/batchCreateItems"
import serialize from "./utils/serialize"
import parse from "./utils/parse"
import toLatestPriceRecord from "./utils/toLatestPriceRecord"



const fundPriceRecord = {
    toLatestPriceRecord,
    serialize,
    parse,
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