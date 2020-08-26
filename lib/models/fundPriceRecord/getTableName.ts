import { PROJECT_NAMESPACE } from "lib/constants"
import { Quarter } from "lib/helpers/getCurrentQuarter"



const getTableName = (
    /** In YYYY format */
    year: string | number,
    quarter: Quarter,
): string => `${PROJECT_NAMESPACE}.FundPriceRecords_${year}_${quarter}`

export default getTableName