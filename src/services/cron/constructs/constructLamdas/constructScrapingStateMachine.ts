import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import * as sfn from '@aws-cdk/aws-stepfunctions'
import * as sfnTasks from '@aws-cdk/aws-stepfunctions-tasks'
import * as fs from 'fs'
import upperFirst from 'lodash/upperFirst'
import getDefaultLambdaInput from './getDefaultLambdaInput'

// Common lambda configs for scrape handlers
const getDefaultScrapersInput = () => {
  const MEMORY_SIZE_MB = 800
  const TIMEOUT_MINS = 15
  return {
    // Extra memory is needed for running the headless browser instance
    memorySize: MEMORY_SIZE_MB,
    // Extra timeout for scrapers
    timeout: cdk.Duration.minutes(TIMEOUT_MINS),
  }
}

export interface ScrapingHandlers {
  scrapers: lambda.Function[];
  testScrapers: lambda.Function[];
  detailsScrapers: lambda.Function[];
  testDetailsScrapers: lambda.Function[];
  startScrapeSession: lambda.Function;
}

/** Scraper creator */
const getScraperCreatorGetter = (
  scope: cdk.Construct,
  defaultInput: ReturnType<typeof getDefaultLambdaInput>,
) => (nameRegExp: RegExp, namePrefix: string) => (fileName: string) => {
  const name = fileName
    .replace(nameRegExp, '')
    .replace(/\.(ts|js)$/i, '')
    .replace(/(scrapeFrom|scrape|scraper|scrapers)/i, '')
  return new lambda.Function(scope, `${namePrefix}${upperFirst(name)}`, {
    ...defaultInput,
    ...getDefaultScrapersInput(),
    handler: `${fileName.replace(/(\.js|\.ts)$/i, '')}.handler`,
  })
}

const constructScrapingHandlers = (
  scope: cdk.Construct,
  serviceDirname: string,
  defaultInput: ReturnType<typeof getDefaultLambdaInput>,
): ScrapingHandlers => {
  const serviceName = serviceDirname.split('/').pop()
  const serviceBundlesDir = serviceDirname.replace(/src.+/i, `bundles/${serviceName}`)
  // Read handlers directory
  const handlers = fs.readdirSync(`${serviceBundlesDir}/handlers`)
  const getScraperCreator = getScraperCreatorGetter(scope, defaultInput)

  // Handlers for scraping records and saving records
  const scrapeHandlers = handlers
    .filter(fileName => /^__recordScraper__/i.test(fileName))
    .map(getScraperCreator(/^__recordScraper__/i, 'CronRecordScraper'))

  /** @DEBUG * Testing handlers for scrapers */
  const testScrapeHandlers = handlers
    .filter(fileName => /^__testRecordScraper__/i.test(fileName))
    .map(getScraperCreator(/^__testRecordScraper__/i, 'CronTestRecordScraper'))

  // Handlers for scraping details
  const detailsScrapeHandlers = handlers
    .filter(fileName => /^__detailScraper__/i.test(fileName))
    .map(getScraperCreator(/^__detailScraper__/i, 'CronDetailsScraper'))

  /** @DEBUG * Testing handlers for details scrapers */
  const testDetailsScrapeHandlers = handlers
    .filter(fileName => /^__testDetailScraper__/i.test(fileName))
    .map(getScraperCreator(/^__testDetailScraper__/i, 'CronTestDetailsScraper'))

  const startScrapeSessionHandler = new lambda.Function(scope, 'CronStartScrapeSession', {
    ...defaultInput,
    handler: 'startScrapeSession.handler',
  })
  return {
    scrapers: scrapeHandlers,
    testScrapers: testScrapeHandlers,
    startScrapeSession: startScrapeSessionHandler,
    detailsScrapers: detailsScrapeHandlers,
    testDetailsScrapers: testDetailsScrapeHandlers,
  }
}

const SCRAPER_DELAY_MINS = 3
const constructStateMachine = (
  scope: cdk.Construct,
  { scrapers, startScrapeSession }: Pick<ScrapingHandlers, 'scrapers' | 'startScrapeSession'>,
): sfn.StateMachine => {
  // Create step functions
  const startTask = new sfnTasks.LambdaInvoke(scope, 'CronScrapeTaskStart', {
    lambdaFunction: startScrapeSession,
  })
  const tasks = scrapers.map((scraper, i) => {
    const id = `CronScrapeTask${i}`
    return new sfnTasks.LambdaInvoke(scope, id, { lambdaFunction: scraper })
  })
  const definition = tasks.reduce<sfn.Chain>(
    (chain, task, i, arr) => chain
      .next(task)
      .next(new sfn.Wait(scope, `CronScrapeWaitTask${i}`, {
        time: sfn.WaitTime.duration(
          // Do not wait too long if it is the last item
          i + 1 === arr.length
            ? cdk.Duration.seconds(1)
            : cdk.Duration.minutes(SCRAPER_DELAY_MINS)
        ),
      })),
    startTask as unknown as sfn.Chain
  )
  const stateMachine = new sfn.StateMachine(scope, 'CronScrapeStateMachine', { definition })
  // Grant execution
  scrapers.forEach(scraper => scraper.grantInvoke(stateMachine.role))
  return stateMachine
}

export interface Output extends ScrapingHandlers {
  stateMachine: sfn.StateMachine;
}
const constructScrapingStateMachine = (
  scope: cdk.Construct,
  serviceDirname: string,
  defaultInput: ReturnType<typeof getDefaultLambdaInput>,
): Output => {
  const handlers = constructScrapingHandlers(scope, serviceDirname, defaultInput)
  const stateMachine = constructStateMachine(scope, handlers)
  return { ...handlers, stateMachine }
}
export default constructScrapingStateMachine