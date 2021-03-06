import { GetDataWithPage } from 'simply-utils/dist/scraping/launchPuppeteerBrowserSession'
import { FundPriceRecord, FundType } from '@michchan/fund-price-monitor-lib'

import getRecordsScraperTemplateHandler from '../helpers/getRecordsScraperTemplateHandler'
import notifyOnScrape from '../helpers/notifyOnScrape'

type T = FundPriceRecord<FundType, 'record'>
const scrapers: GetDataWithPage<T[]>[] = []
export const handler = getRecordsScraperTemplateHandler(
  scrapers,
  'test',
  notifyOnScrape
)