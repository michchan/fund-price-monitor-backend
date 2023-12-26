import { GetDataWithPage } from 'simply-utils/scraping/launchPuppeteerBrowserSession'
import { FundPriceRecord, FundType, RecordType } from '@michchan/fund-price-monitor-lib'

import getRecordsScraperTemplateHandler from '../helpers/getRecordsScraperTemplateHandler'
import notifyOnScrape from '../helpers/notifyOnScrape'

type T = FundPriceRecord<FundType, RecordType.record>
const scrapers: GetDataWithPage<T[]>[] = []
export const handler = getRecordsScraperTemplateHandler(
  scrapers,
  'test',
  notifyOnScrape
)