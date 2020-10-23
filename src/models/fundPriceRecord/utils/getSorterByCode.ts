import { FundPriceRecord } from '../FundPriceRecord.type'

export interface Item {
  code: FundPriceRecord['code'];
}

/**
 * Sort recrods by code. Default to in ascending order.
 */
const getSorterByCode = (isDescending?: boolean) => (a: Item, b: Item): number => {
  const isAGreator = a.code > b.code
  const isBGreator = a.code < b.code

  if (isDescending ? isBGreator : isAGreator) return 1
  if (isDescending ? isAGreator : isBGreator) return -1
  return 0
}

export default getSorterByCode