import { GetDataWithPage } from 'simply-utils/dist/scraping/launchPuppeteerBrowserSession'

import FundPriceRecord, { FundType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import getScraperTemplateHandler from '../helpers/getScraperTemplateHandler'

type T = FundPriceRecord<FundType, 'record'>
const scrapers: GetDataWithPage<T[]>[] = []
export const handler = getScraperTemplateHandler(scrapers, 'test')