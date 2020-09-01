import getTableName from "./utils/getTableName"
import getQuarter from "lib/helpers/getQuarter"
import createTable from "./io/createTable"
import listLatestTables from "./io/listLatestTables"
import isTableOfCurrentQuarter from "./utils/isTableOfCurrentQuarter"
import attributeNames from "./constants/attributeNames"
import indexNames from "./constants/indexNames"
import batchCreateItems from "./io/batchCreateItems"
import serialize from "./utils/serialize"
import parse from "./utils/parse"
import toLatestPriceRecord from "./utils/toLatestPriceRecord"
import getQueryStartTimeByPeriodDifference from "./utils/getQueryStartTimeByPeriodDifference"
import scanQuarterRecords from "./io/scanQuarterRecords"
import queryAllItems from "./io/queryAllItems"
import parseChangeRate from './utils/parseChangeRate'
import serializeChangeRate from './utils/serializeChangeRate'
import getChangeRate from "./utils/getChangeRate"



const fundPriceRecord = {
    queryAllItems,
    scanQuarterRecords,
    getQueryStartTimeByPeriodDifference,
    toLatestPriceRecord,
    serialize,
    parse,
    parseChangeRate,
    serializeChangeRate,
    batchCreateItems,
    attributeNames,
    indexNames,
    getTableName,
    getQuarter,
    createTable,
    listLatestTables,
    getChangeRate,
    isTableOfCurrentQuarter,
} as const
export default fundPriceRecord