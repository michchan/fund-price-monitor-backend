import { GetDataWithPage } from 'simply-utils/dist/scraping/launchPuppeteerBrowserSession'

import FundPriceRecord, { FundType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import batchCreate from 'src/models/fundPriceRecord/io/batchCreate'
import serializeRecord from 'src/models/fundPriceRecord/utils/serializeRecord'
import getRecordsScraperTemplateHandler from '../helpers/getRecordsScraperTemplateHandler'

type T = FundPriceRecord<FundType, 'record'>
const scrapers: GetDataWithPage<T[]>[] = []
export const handler = getRecordsScraperTemplateHandler(
  scrapers,
  'live',
  (tableRange, records) => batchCreate(records, tableRange, serializeRecord)
)