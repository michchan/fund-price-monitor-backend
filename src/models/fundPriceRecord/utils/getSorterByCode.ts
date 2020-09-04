import { FundPriceRecord } from "../FundPriceRecord.type"



export interface Item { 
    code: FundPriceRecord['code'] 
}

/**
 * Sort recrods by code. Default to in ascending order.
 */
const getSorterByCode = (isDescending?: boolean) => (a: Item, b: Item): number => {
    const ab = a.code > b.code
    const ba = a.code < b.code

    if (isDescending ? ba : ab) return 1
    if (isDescending ? ab : ba) return -1
    return 0
}

export default getSorterByCode