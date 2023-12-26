import { Page } from 'puppeteer-core'
import { FundPriceRecord, FundType, RecordType, RiskLevel } from '@michchan/fund-price-monitor-lib'

import retryWithDelay from '../../helpers/retryWithDelay'

interface RiskLevelMap { [className: string]: RiskLevel }
// Mapper for specific node class name to RiskLevel
const riskLevelMapConfig: RiskLevelMap = {
  rating1: RiskLevel.veryLow,
  rating2: RiskLevel.low,
  rating3: RiskLevel.neutral,
  rating4: RiskLevel.high,
  rating5: RiskLevel.veryHigh,
}

export interface DetailsDataRecord extends Pick<FundPriceRecord<FundType.mpf, RecordType.record>, 'riskLevel'> {
  name: string;
}

/**
* Helpers to query the details data from html
*/
const getDetailsData = async (page: Page): Promise<DetailsDataRecord[]> => {
  // Wait for the elements we want
  await retryWithDelay(() => page.waitForSelector(
    '#funddetails_list > table > tbody > tr:not(.header):last-child > td'
  ), 'scrapeFromAIAMPF.getDetailsData')

  // Query DOM data
  // * Constants/variables must be inside the scope of the callback function
  return page.evaluate(
    // =================================== CLIENT-SIDE CODE ===================================
    // Everything should be in the same code and no module bundling to be expected
    (riskLevelMapJSON: string): DetailsDataRecord[] => {
      const riskLevelMap = JSON.parse(riskLevelMapJSON) as RiskLevelMap

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
    },
    // =================================== / CLIENT-SIDE CODE ===================================
    JSON.stringify(riskLevelMapConfig)
  )
}

export default getDetailsData