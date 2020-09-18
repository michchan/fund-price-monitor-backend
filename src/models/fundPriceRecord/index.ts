import getTableName from "./utils/getTableName"
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
import queryAllItems from "./io/queryItems"
import parseChangeRate from './utils/parseChangeRate'
import serializeChangeRate from './utils/serializeChangeRate'
import getChangeRate from "./utils/getChangeRate"
import batchDeleteItems from "./io/batchDeleteItems"
import getCompositeSK from "./utils/getCompositeSK"
import getCompositeSKFromChangeRate from "./utils/getCompositeSKFromChangeRate"
import updateTable from "./io/updateTable"
import describeTable from "./io/describeTable"
import queryItemsByCompany from "./io/queryItemsByCompany"
import queryPeriodPriceChangeRate from "./io/queryPeriodPriceChangeRate"
import getPeriodByRecordType from "./utils/getPeriodByRecordType"
import toTelegramMessages from "./utils/toTelegramMessages"
import getTableDetails from "./io/getTableDetails"
import topLevelKeysValues from "./constants/topLevelKeysValues"
import createTableDetails from "./io/createTableDetails"
import updateTableDetails from "./io/updateTableDetails"
import getSorterByCode from "./utils/getSorterByCode"
import calculatePriceChangeRate from "./utils/calculatePriceChangeRate"
import queryItemsByRiskLevel from "./io/queryItemsByRiskLevel"
import isValidCompany from "./utils/isValidCompany"
import isValidRiskLevel from "./utils/isValidRiskLevel"



const fundPriceRecord = {
    isValidCompany,
    isValidRiskLevel,
    queryItemsByRiskLevel,
    getSorterByCode,
    createTableDetails,
    updateTableDetails,
    topLevelKeysValues,
    getTableDetails,
    toTelegramMessages,
    getPeriodByRecordType,
    queryItemsByCompany,
    queryPeriodPriceChangeRate,
    updateTable,
    describeTable,
    getCompositeSK,
    getCompositeSKFromChangeRate,
    queryAllItems,
    scanQuarterRecords,
    getQueryStartTimeByPeriodDifference,
    toLatestPriceRecord,
    serialize,
    parse,
    parseChangeRate,
    serializeChangeRate,
    batchCreateItems,
    batchDeleteItems,
    attributeNames,
    indexNames,
    getTableName,
    createTable,
    listLatestTables,
    getChangeRate,
    isTableOfCurrentQuarter,
    calculatePriceChangeRate,
} as const
export default fundPriceRecord