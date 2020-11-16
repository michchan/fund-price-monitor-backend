import puppeteer = require('puppeteer')

import FundPriceRecord from 'src/models/fundPriceRecord/FundPriceRecord.type'
import retryWithDelay from '../../helpers/retryWithDelay'

export interface PerfDataRecord extends Pick<FundPriceRecord<'mpf', 'record'>, 'code'> {
  priceChangeRateSinceLaunch: number;
  launchedDate: string;
}

/**
* Helpers to query the performance data from html
*/
const getPerformanceData = async (page: puppeteer.Page): Promise<PerfDataRecord[]> => {
  // Wait for the elements we want
  await retryWithDelay(() => page.waitForSelector(
    '#fundpriceslist > table > tbody > tr:not(.header):last-child > td'
  ), 'scrapeFromAIAMPF.getPerformanceData')

  // Query DOM data
  // * Constants/variables must be inside the scope of the callback function
  return page.evaluate((): PerfDataRecord[] => {
    const MAX_PERCENT = 100
    // Query table rows nodes
    const tableRows: NodeListOf<HTMLTableRowElement> = document
      .querySelectorAll('#fundpriceslist > table > tbody > tr:not(.header)')

    // Map table rows data to PerfDataRecord[]
    return Array.from(tableRows)
      .map((row): PerfDataRecord => {
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
          launchedDate: dataCells[1].innerText.trim(),
          priceChangeRateSinceLaunch: Number(dataCells[7].innerText.trim()) / MAX_PERCENT,
        }
      })
  })
}
export default getPerformanceData