import { GetDataWithPage } from 'simply-utils/dist/scraping/launchPuppeteerBrowserSession'
import logObj from 'src/helpers/logObj'

import FundPriceRecord, { FundType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import batchCreate from 'src/models/fundPriceRecord/io/batchCreate'
import queryItemsByCompany from 'src/models/fundPriceRecord/io/queryItemsByCompany'
import serializeRecord from 'src/models/fundPriceRecord/utils/serializeRecord'
import toLatestPriceRecord from 'src/models/fundPriceRecord/utils/toLatestPriceRecord'
import getRecordsScraperTemplateHandler from '../helpers/getRecordsScraperTemplateHandler'
import notifyAll from '../helpers/notifyAll'

type T = FundPriceRecord<FundType, 'record'>
const scrapers: GetDataWithPage<T[]>[] = []
export const handler = getRecordsScraperTemplateHandler(
  scrapers,
  'live',
  async (tableRange, records, companies) => {
    await batchCreate(records, tableRange, serializeRecord)

    // @TODO: Separate as another lambda function call
    // @TODO: Refractor with aggregate
    // Handle notification
    for (const company of companies) {
      /** Query previous latest records */
      const { parsedItems: prevLatestItems } = await queryItemsByCompany(company, {
        shouldQueryAll: true,
        shouldQueryLatest: true,
        at: tableRange,
      })
      const date = new Date()
      const latestItems = records.map(item => {
        const prevItem = prevLatestItems.find(eachItem => eachItem.code === item.code)
        return toLatestPriceRecord(item, date, prevItem)
      })
      logObj(`Derived TEMP latestItems for notification: (${latestItems.length}): `, latestItems)
      const itemsDict = { [company]: latestItems }
      // @TODO: Always notify changed items only
      await notifyAll('onUpdate', [company], itemsDict)
    }
  }
)