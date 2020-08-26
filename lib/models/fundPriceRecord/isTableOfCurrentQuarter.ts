import getCurrentQuarter from "lib/helpers/getCurrentQuarter"
import getTableName from "./getTableName"



/**
 * Check whether the table is of the current quarter given the table name
 */
const isTableOfCurrentQuarter = (tableName: string): boolean => {
    const year = new Date().getFullYear()
    const quarter = getCurrentQuarter()
    
    return tableName === getTableName(year, quarter)
}

export default isTableOfCurrentQuarter