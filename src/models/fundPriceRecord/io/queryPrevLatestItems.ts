import { CompanyType, FundPriceChangeRate, FundPriceRecord } from '@michchan/fund-price-monitor-lib'
import getQuarterOffset from 'simply-utils/dist/dateTime/getQuarterOffset'
import TableRange from '../TableRange.type'
import checkTableExistence from './checkTableExistence'
import queryItemsByCompany from './queryItemsByCompany'

type ItemOutput = FundPriceRecord[]

const queryPrevLatestItems = async (
  company: CompanyType,
  tableRange: TableRange,
  filterPredicate?: (rec: FundPriceRecord | FundPriceChangeRate) => boolean,
  shouldCountPrevQuarter: boolean = true,
): Promise<ItemOutput> => {
  const queryByTableRange = (at: TableRange) => queryItemsByCompany(company, {
    shouldQueryAll: true,
    shouldQueryLatest: true,
    at,
  })

  const queryPrevQuarter = async () => {
    const { year, quarter } = tableRange
    const [prevYear, prevQuarter] = getQuarterOffset(year, quarter, -1)

    const doesPrevTableExist = await checkTableExistence(prevYear, prevQuarter)
    if (doesPrevTableExist) {
      const { parsedItems: itemsPrevQuarter } = await queryByTableRange({
        year: prevYear,
        quarter: prevQuarter,
      })
      return itemsPrevQuarter
    }
    return []
  }

  /** Query previous latest records */
  const prevLatestItems = await (async () => {
    const { parsedItems: itemsThisQuarter } = await queryByTableRange(tableRange)

    if (itemsThisQuarter.length === 0 && shouldCountPrevQuarter)
      return queryPrevQuarter()

    return itemsThisQuarter
  })()

  return filterPredicate
    ? prevLatestItems.filter(filterPredicate)
    : prevLatestItems
}

export default queryPrevLatestItems