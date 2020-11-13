import { GetDataWithPage } from 'simply-utils/dist/scraping/launchPuppeteerBrowserSession'
import FundDetails from 'src/models/fundPriceRecord/FundDetails.type'
import getFundsDetailsScraperTemplateHandler from '../helpers/getFundsDetailsScraperTemplateHandler'

type T = FundDetails
const scrapers: GetDataWithPage<T[]>[] = []
export const handler = getFundsDetailsScraperTemplateHandler(scrapers)