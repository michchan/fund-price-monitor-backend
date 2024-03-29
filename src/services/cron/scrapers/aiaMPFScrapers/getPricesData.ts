import { Page } from 'puppeteer-core'
import { FundPriceRecord, FundType, RecordType } from '@michchan/fund-price-monitor-lib'

import retryWithDelay from '../../helpers/retryWithDelay'

export interface PriceDataRecord extends Pick<FundPriceRecord<FundType.mpf, RecordType.record>,
| 'code'
| 'price'
| 'updatedDate'
> {
  name: string;
}

// =================================== CLIENT-SIDE CODE ===================================
// Everything should be in the same code and no module bundling to be expected
const evaluatePage = (): PriceDataRecord[] => {
  const ZERO_PADDING_UPPER_LIMIT = 10
  // Query table rows nodes
  const tableRows: NodeListOf<HTMLTableRowElement> = document
    .querySelectorAll('#fundpriceslist > table > tbody > tr:not(.header)')
  // Get page-level updatedDate
  const updatedDateEl = document
    .querySelector('#main-block > table > tbody > tr > td > font') as HTMLFontElement

  const [year, month, date] = ((updatedDateEl?.innerText ?? '')
    .match(/(\d{4})年(\d{1,2})月(\d{1,2})/i) ?? [])
    .slice(1)

  const MM = Number(month) < ZERO_PADDING_UPPER_LIMIT ? `0${month}` : month
  const DD = Number(date) < ZERO_PADDING_UPPER_LIMIT ? `0${date}` : date
  const updatedDate = `${year}-${MM}-${DD}`
  const numCells = 3

  // Map table rows data to PriceDataRecord[]
  return Array.from(tableRows)
    // Filter out that some funds might not have a unit price
    .filter(row => row.children.length === numCells)
    .map((row): PriceDataRecord => {
      // Get table cells list
      const dataCells = row.children as HTMLCollectionOf<HTMLTableDataCellElement>
      // Get ID from the url of the item
      const anchor = dataCells[0].children[0] as HTMLAnchorElement
      // ID Getter
      const getIDFromAnchorTag = (anchor: HTMLAnchorElement): string => {
        const matches = (anchor?.href ?? '').match(/id=(.+)$/i) ?? []
        return (matches[1] ?? '').trim()
      }

      return {
        code: getIDFromAnchorTag(anchor),
        name: dataCells[0].innerText.trim(),
        price: Number(dataCells[2].innerText.trim()),
        updatedDate,
      }
    })
}
// =================================== / CLIENT-SIDE CODE ===================================

/**
 * Helpers to query the prices data from html
 */
const getPricesData = async (page: Page): Promise<PriceDataRecord[]> => {
  // Wait for the elements we want
  await retryWithDelay(() => page.waitForSelector(
    '#fundpriceslist > table > tbody > tr:not(.header):last-child > td'
  ), 'scrapeFromAIAMPF.getPricesData')

  // Query DOM data
  // * Constants/variables must be inside the scope of the callback function
  return page.evaluate(evaluatePage)
}
export default getPricesData