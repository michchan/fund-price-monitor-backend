import { Quarter } from 'simply-utils/dist/dateTime/getQuarter';

import { PROJECT_NAMESPACE } from "lib/constants"



const getTableName = (
    /** In YYYY format */
    year: string | number,
    quarter: Quarter,
    quarterOffset: number = 0,
): string => {
    const diffYr = Math.trunc(quarterOffset / 4)
    const diffQuarter = quarterOffset % 4

    const yr = +year + diffYr
    const qt = +quarter + diffQuarter

    if (!yr || !qt || yr < 0 || qt < 0) throw new Error(`Cannot get table name: ${JSON.stringify({ yr, qt })}`)

    return `${PROJECT_NAMESPACE}.FundPriceRecords_${yr}_q${qt}`
}

export default getTableName