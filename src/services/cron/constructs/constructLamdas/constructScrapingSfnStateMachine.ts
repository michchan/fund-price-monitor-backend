import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import * as sfn from '@aws-cdk/aws-stepfunctions'
import * as sfnTasks from '@aws-cdk/aws-stepfunctions-tasks'
import * as fs from 'fs'
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
  startScrapeSession: lambda.Function;
}
const constructScrapingHandlers = (
  scope: cdk.Construct,
  serviceDirname: string,
  defaultInput: ReturnType<typeof getDefaultLambdaInput>,
): ScrapingHandlers => {
  // Read handlers directory
  const handlers = fs.readdirSync(`${serviceDirname}/handlers`)
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

  const startScrapeSessionHandler = new lambda.Function(scope, 'CronStartScrapeSession', {
    ...defaultInput,
    handler: 'startScrapeSession.handler',
  })

  return {
    scrapers: scrapeHandlers,
    testScrapers: testScrapeHandlers,
    startScrapeSession: startScrapeSessionHandler,
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
    (chain, task, i) => chain
      .next(task)
      .next(new sfn.Wait(scope, `CronScrapeWaitTask${i}`, {
        time: sfn.WaitTime.duration(cdk.Duration.minutes(SCRAPER_DELAY_MINS)),
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