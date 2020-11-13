import puppeteer = require('puppeteer')

import FundPriceRecord, { RiskLevel } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import retryWithDelay from '../../helpers/retryWithDelay'

export interface DetailsDataRecord extends Pick<FundPriceRecord<'mpf', 'record'>,
| 'name'
| 'riskLevel'
> {}

/**
* Helpers to query the details data from html
*/
const getDetailsData = async (page: puppeteer.Page): Promise<DetailsDataRecord[]> => {
  // Wait for the elements we want
  await retryWithDelay(() => page.waitForSelector(
    '#funddetails_list > table > tbody > tr:not(.header):last-child > td'
  ), 'scrapeFromAIAMPF.getDetailsData')

  // Query DOM data
  // * Constants/variables must be inside the scope of the callback function
  return page.evaluate((): DetailsDataRecord[] => {
    // Mapper for specific node class name to RiskLevel
    const riskLevelMap: { [className: string]: RiskLevel } = {
      rating1: 'veryLow',
      rating2: 'low',
      rating3: 'neutral',
      rating4: 'high',
      rating5: 'veryHigh',
    }
    // Query table rows nodes
    const tables: NodeListOf<HTMLTableElement> = document
      .querySelectorAll('#funddetails_list > table:not(:first-child)')

    // Map table rows data to PriceDataRecord[]
    return Array.from(tables)
      .map((table): DetailsDataRecord => {
        const rows = table.querySelectorAll('tr')
        const nameCell = rows[0].children[0] as HTMLTableDataCellElement
        const riskRow = rows[rows.length - 1]
        const riskCell = riskRow.children[riskRow.children.length - 1] as HTMLTableDataCellElement
        return {
          name: nameCell.innerText,
          riskLevel: riskLevelMap[riskCell.className.trim().toLowerCase()],
        }
      })
  })
}
export default getDetailsData