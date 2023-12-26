import { FundDetails } from '@michchan/fund-price-monitor-lib'
import { GetDataWithPage } from 'simply-utils/scraping/launchPuppeteerBrowserSession'
import getFundsDetailsScraperTemplateHandler from '../helpers/getFundsDetailsScraperTemplateHandler'

type T = FundDetails
const scrapers: GetDataWithPage<T[]>[] = []
export const handler = getFundsDetailsScraperTemplateHandler(scrapers)