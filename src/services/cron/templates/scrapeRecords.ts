import { GetDataWithPage } from 'simply-utils/scraping/launchPuppeteerBrowserSession'
import { FundPriceRecord, FundType, RecordType } from '@michchan/fund-price-monitor-lib'

import batchCreate from 'src/models/fundPriceRecord/io/batchCreate'
import serializeRecord from 'src/models/fundPriceRecord/utils/serializeRecord'
import getRecordsScraperTemplateHandler from '../helpers/getRecordsScraperTemplateHandler'
import notifyOnScrape from '../helpers/notifyOnScrape'

type T = FundPriceRecord<FundType, RecordType.record>
const scrapers: GetDataWithPage<T[]>[] = []
export const handler = getRecordsScraperTemplateHandler(
  scrapers,
  'live',
  async (tableRange, records, companies) => {
    if (records.length === 0) return
    await batchCreate(records, tableRange, serializeRecord)
    await notifyOnScrape(tableRange, records, companies)
  }
)