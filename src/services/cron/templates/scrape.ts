import { ScheduledHandler } from 'aws-lambda'
import { GetDataWithPage } from 'simply-utils/dist/scraping/launchPuppeteerBrowserSession'

import FundPriceRecord, { FundType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import scrapeAndReduce from 'src/services/cron/helpers/scrapeAndReduce'
import batchCreateItems from 'src/models/fundPriceRecord/io/batchCreateItems'
import serialize from 'src/models/fundPriceRecord/utils/serialize'
import getCurrentYearAndQuarter from 'src/helpers/getCurrentYearAndQuarter'
import reduceScrapeMetaInfo from 'src/models/fundPriceRecord/utils/reduceScrapeMetaInfo'
import saveScrapeMetadata from 'src/models/fundPriceRecord/utils/saveScrapeMetadata'
import withStatus from '../helpers/withStatus'

// Create list of scrapers
const scrapers: GetDataWithPage<FundPriceRecord<FundType, 'record'>[]>[] = []
/**
 * Scrape and Create records
 */
export const handler: ScheduledHandler = async () => {
  const [year, quarter] = getCurrentYearAndQuarter()
  const tableRange = { year, quarter }

  const [status, err, records, companies] = await withStatus(async () => {
    // Scrape records from the site
    const [records, companies] = await scrapeAndReduce(scrapers)
    // Write batch data to the table
    await batchCreateItems(records, tableRange, serialize)
    return [records, companies]
  })

  const info = reduceScrapeMetaInfo(records, status, companies)
  await saveScrapeMetadata({ info }, tableRange)

  if (err) throw err
}