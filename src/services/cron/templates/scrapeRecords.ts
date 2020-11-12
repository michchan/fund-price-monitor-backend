import { GetDataWithPage } from 'simply-utils/dist/scraping/launchPuppeteerBrowserSession'

import FundPriceRecord, { FundType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import batchCreateItems from 'src/models/fundPriceRecord/io/batchCreateItems'
import serialize from 'src/models/fundPriceRecord/utils/serialize'
import getScraperTemplateHandler from '../helpers/getScraperTemplateHandler'

type T = FundPriceRecord<FundType, 'record'>
const scrapers: GetDataWithPage<T[]>[] = []
export const handler = getScraperTemplateHandler(
  scrapers,
  'live',
  (tableRange, records) => batchCreateItems(records, tableRange, serialize)
)