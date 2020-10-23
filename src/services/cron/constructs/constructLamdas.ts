import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import * as iam from '@aws-cdk/aws-iam'
import * as fs from 'fs'

import env from 'src/lib/env'
import defaultLambdaInput from 'src/common/defaultLambdaInput'

const DIRNAME = __dirname.split('/').pop()
const { TELEGRAM_BOT_API_KEY_PARAMETER_NAME } = env.values

// Common environment variables for notification handling
const getDefaultNotifierEnv = (telegramChatId: string) => ({
  TELEGRAM_CHAT_ID: telegramChatId,
  TELEGRAM_BOT_API_KEY_PARAMETER_NAME,
})
// Common input for lambda Definition
const getDefaultLambdaInput = (role: iam.Role) => {
  const MEMORY_SIZE_MB = 250
  return {
    ...defaultLambdaInput,
    code: lambda.Code.fromAsset(`bundles/${DIRNAME}/handlers`),
    memorySize: MEMORY_SIZE_MB,
    role,
  }
}
// Common lambda configs for scrape handlers
const getDefaultScrapersInput = () => {
  const MEMORY_SIZE_MB = 700
  const TIMEOUT_MINS = 15
  return {
    // Extra memory is needed for running the headless browser instance
    memorySize: MEMORY_SIZE_MB,
    // Extra timeout for scrapers
    timeout: cdk.Duration.minutes(TIMEOUT_MINS),
  }
}

interface ScrapingHandlers {
  aggregation: lambda.Function;
  scrapers: lambda.Function[];
  testScrapers: lambda.Function[];
}
const constructScrapingHandlers = (scope: cdk.Construct, role: iam.Role): ScrapingHandlers => {
  /** ---------- Aggregation Handlers ---------- */
  // Handler for aggregating top-level items of records
  const aggregationHandler = new lambda.Function(scope, 'CronAggregator', {
    ...getDefaultLambdaInput(role),
    handler: 'aggregate.handler',
  })

  /** ---------- Scrape Handlers ---------- */

  // Read handlers directory
  const handlers = fs.readdirSync(`${__dirname}/handlers`)
  /** Scraper creator */
  const getScraperCreator = (nameRegExp: RegExp, namePrefix: string) => (fileName: string) => {
    const name = fileName.replace(nameRegExp, '').replace(/\.ts$/i, '')
    return new lambda.Function(scope, `${namePrefix}${name}`, {
      ...getDefaultLambdaInput(role),
      ...getDefaultScrapersInput(),
      handler: `${fileName.replace(/\.ts$/i, '')}.handler`,
    })
  }

  // Handlers for scraping data and saving data
  const scrapeHandlers = handlers
    .filter(fileName => /^handleScrapeFrom/i.test(fileName))
    .map(getScraperCreator(/^handleScrapeFrom/i, 'CronScraper'))

  /** @DEBUG * Testing handlers for scrapers */
  const testScrapeHandlers = handlers
    .filter(fileName => /^testScrapeFrom/i.test(fileName))
    .map(getScraperCreator(/^testScrapeFrom/i, 'CronTestScraper'))

  return {
    aggregation: aggregationHandler,
    scrapers: scrapeHandlers,
    testScrapers: testScrapeHandlers,
  }
}

interface TableHandlers {
  createTable: lambda.Function;
  updateTable: lambda.Function;
}
const constructTableHandlers = (
  scope: cdk.Construct,
  role: iam.Role,
  aggregationHandler: lambda.Function,
): TableHandlers => {
  // Common environment variables for table handling
  const commonTableHandlingEnv = { AGGREGATION_HANDLER_ARN: aggregationHandler.functionArn }

  // Handler for create table for next coming quarter
  const createTableHandler = new lambda.Function(scope, 'CronTableCreateHandler', {
    ...getDefaultLambdaInput(role),
    handler: 'createTable.handler',
    environment: commonTableHandlingEnv,
  })
  // Handler for adjust the provisioned throughput of table for previous quarter
  const updateTableHandler = new lambda.Function(scope, 'CronTableUpdateHandler', {
    ...getDefaultLambdaInput(role),
    handler: 'updateTable.handler',
    environment: commonTableHandlingEnv,
  })
  return {
    createTable: createTableHandler,
    updateTable: updateTableHandler,
  }
}

interface NotificationHandlers {
  notifyDaily: lambda.Function;
  notifyWeekly: lambda.Function;
  notifyMonthly: lambda.Function;
  notifyQuarterly: lambda.Function;
}
const constructNotificationHandlers = (
  scope: cdk.Construct,
  role: iam.Role,
  telegramChatId: string,
): NotificationHandlers => {
  const notifyDailyHandler = new lambda.Function(scope, 'CronNotifierDaily', {
    ...getDefaultLambdaInput(role),
    handler: 'notifyDaily.handler',
    environment: getDefaultNotifierEnv(telegramChatId),
  })
  const notifyWeeklyHandler = new lambda.Function(scope, 'CronNotifierWeekly', {
    ...getDefaultLambdaInput(role),
    handler: 'notifyWeekly.handler',
    environment: getDefaultNotifierEnv(telegramChatId),
  })
  const notifyMonthlyHandler = new lambda.Function(scope, 'CronNotifierMonthly', {
    ...getDefaultLambdaInput(role),
    handler: 'notifyMonthly.handler',
    environment: getDefaultNotifierEnv(telegramChatId),
  })
  const notifyQuarterlyHandler = new lambda.Function(scope, 'CronNotifierQuarterly', {
    ...getDefaultLambdaInput(role),
    handler: 'notifyQuarterly.handler',
    environment: getDefaultNotifierEnv(telegramChatId),
  })
  return {
    notifyDaily: notifyDailyHandler,
    notifyWeekly: notifyWeeklyHandler,
    notifyMonthly: notifyMonthlyHandler,
    notifyQuarterly: notifyQuarterlyHandler,
  }
}

export interface Handlers extends ScrapingHandlers, TableHandlers, NotificationHandlers {}
const constructLamdas = (
  scope: cdk.Construct,
  role: iam.Role,
  telegramChatId: string
): Handlers => {
  const scrapingHandlers = constructScrapingHandlers(scope, role)
  return {
    ...scrapingHandlers,
    ...constructTableHandlers(scope, role, scrapingHandlers.aggregation),
    ...constructNotificationHandlers(scope, role, telegramChatId),
  }
}
export default constructLamdas