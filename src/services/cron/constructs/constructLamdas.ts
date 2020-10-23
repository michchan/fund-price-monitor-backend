import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import * as iam from '@aws-cdk/aws-iam'
import * as fs from 'fs'

import env from 'src/lib/env'
import defaultLambdaInput from 'src/common/defaultLambdaInput'

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
const constructScrapingHandlers = (
  scope: cdk.Construct,
  serviceDirnameFullPath: string,
  defaultInput: ReturnType<typeof getDefaultLambdaInput>,
): ScrapingHandlers => {
  /** ---------- Aggregation Handlers ---------- */
  // Handler for aggregating top-level items of records
  const aggregationHandler = new lambda.Function(scope, 'CronAggregator', {
    ...defaultInput,
    handler: 'aggregate.handler',
  })

  /** ---------- Scrape Handlers ---------- */

  // Read handlers directory
  const handlers = fs.readdirSync(`${serviceDirnameFullPath}/handlers`)
  /** Scraper creator */
  const getScraperCreator = (nameRegExp: RegExp, namePrefix: string) => (fileName: string) => {
    const name = fileName.replace(nameRegExp, '').replace(/\.ts$/i, '')
    return new lambda.Function(scope, `${namePrefix}${name}`, {
      ...defaultInput,
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
  defaultInput: ReturnType<typeof getDefaultLambdaInput>,
  aggregationHandler: lambda.Function,
): TableHandlers => {
  // Common environment variables for table handling
  const commonTableHandlingEnv = { AGGREGATION_HANDLER_ARN: aggregationHandler.functionArn }

  // Handler for create table for next coming quarter
  const createTableHandler = new lambda.Function(scope, 'CronTableCreateHandler', {
    ...defaultInput,
    handler: 'createTable.handler',
    environment: commonTableHandlingEnv,
  })
  // Handler for adjust the provisioned throughput of table for previous quarter
  const updateTableHandler = new lambda.Function(scope, 'CronTableUpdateHandler', {
    ...defaultInput,
    handler: 'updateTable.handler',
    environment: commonTableHandlingEnv,
  })
  return {
    createTable: createTableHandler,
    updateTable: updateTableHandler,
  }
}

const { TELEGRAM_BOT_API_KEY_PARAMETER_NAME } = env.values
// Common environment variables for notification handling
const getDefaultNotifierEnv = (telegramChatId: string) => ({
  TELEGRAM_CHAT_ID: telegramChatId,
  TELEGRAM_BOT_API_KEY_PARAMETER_NAME,
})

interface NotificationHandlers {
  notifyDaily: lambda.Function;
  notifyWeekly: lambda.Function;
  notifyMonthly: lambda.Function;
  notifyQuarterly: lambda.Function;
}
const constructNotificationHandlers = (
  scope: cdk.Construct,
  defaultInput: ReturnType<typeof getDefaultLambdaInput>,
  telegramChatId: string,
): NotificationHandlers => {
  const environment = getDefaultNotifierEnv(telegramChatId)

  const notifyDailyHandler = new lambda.Function(scope, 'CronNotifierDaily', {
    ...defaultInput,
    handler: 'notifyDaily.handler',
    environment,
  })
  const notifyWeeklyHandler = new lambda.Function(scope, 'CronNotifierWeekly', {
    ...defaultInput,
    handler: 'notifyWeekly.handler',
    environment,
  })
  const notifyMonthlyHandler = new lambda.Function(scope, 'CronNotifierMonthly', {
    ...defaultInput,
    handler: 'notifyMonthly.handler',
    environment,
  })
  const notifyQuarterlyHandler = new lambda.Function(scope, 'CronNotifierQuarterly', {
    ...defaultInput,
    handler: 'notifyQuarterly.handler',
    environment,
  })
  return {
    notifyDaily: notifyDailyHandler,
    notifyWeekly: notifyWeeklyHandler,
    notifyMonthly: notifyMonthlyHandler,
    notifyQuarterly: notifyQuarterlyHandler,
  }
}

// Common input for lambda Definition
const getDefaultLambdaInput = (role: iam.Role, serviceDirname: string) => {
  const MEMORY_SIZE_MB = 250
  return {
    ...defaultLambdaInput,
    code: lambda.Code.fromAsset(`bundles/${serviceDirname}/handlers`),
    memorySize: MEMORY_SIZE_MB,
    role,
  }
}
export interface Handlers extends ScrapingHandlers, TableHandlers, NotificationHandlers {}
export interface Options {
  serviceDirname: string;
  serviceDirnameFullPath: string;
  telegramChatId: string;
}
const constructLamdas = (
  scope: cdk.Construct,
  role: iam.Role,
  {
    serviceDirname,
    serviceDirnameFullPath,
    telegramChatId,
  }: Options,
): Handlers => {
  const defaultInput = getDefaultLambdaInput(role, serviceDirname)
  const scrapingHandlers = constructScrapingHandlers(scope, serviceDirnameFullPath, defaultInput)
  return {
    ...scrapingHandlers,
    ...constructTableHandlers(scope, defaultInput, scrapingHandlers.aggregation),
    ...constructNotificationHandlers(scope, defaultInput, telegramChatId),
  }
}
export default constructLamdas