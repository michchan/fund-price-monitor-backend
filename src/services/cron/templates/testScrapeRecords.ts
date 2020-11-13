import { GetDataWithPage } from 'simply-utils/dist/scraping/launchPuppeteerBrowserSession'

import FundPriceRecord, { FundType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import getRecordsScraperTemplateHandler from '../helpers/getRecordsScraperTemplateHandler'

type T = FundPriceRecord<FundType, 'record'>
const scrapers: GetDataWithPage<T[]>[] = []
export const handler = getRecordsScraperTemplateHandler(scrapers, 'test')