import { Construct } from 'constructs'
import { aws_lambda as lambda, Duration } from 'aws-cdk-lib'
import * as sfn from 'aws-cdk-lib/aws-stepfunctions'
import * as sfnTasks from 'aws-cdk-lib/aws-stepfunctions-tasks'
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
    timeout: Duration.minutes(TIMEOUT_MINS),
  }
}

export interface ScrapingHandlers {
  scrapers: lambda.Function[];
  testScrapers: lambda.Function[];
  detailsScrapers: lambda.Function[];
  testDetailsScrapers: lambda.Function[];
  startScrapeSession: lambda.Function;
}

export type DefaultInput =
  & ReturnType<typeof getDefaultLambdaInput>
  & Partial<lambda.FunctionOptions>

/** Scraper creator */
const getScraperMapperCreator = (
  scope: Construct,
  defaultInput: DefaultInput,
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
  scope: Construct,
  serviceDirname: string,
  defaultInput: DefaultInput,
  // For test functions
  defaultInputTest: DefaultInput,
): ScrapingHandlers => {
  const serviceName = serviceDirname.split('/').pop()
  const serviceBundlesDir = serviceDirname.replace(/src.+/i, `bundles/${serviceName}`)
  // Read handlers directory
  const handlers = fs.readdirSync(`${serviceBundlesDir}/handlers`)
  const createMapper = getScraperMapperCreator(scope, defaultInput)
  const createTestMapper = getScraperMapperCreator(scope, defaultInputTest)

  // Handlers for scraping records and saving records
  const scrapeHandlers = handlers
    .filter(fileName => /^__recordScraper__/i.test(fileName))
    .map(createMapper(/^__recordScraper__/i, 'CronRecordScraper'))

  /** @DEBUG * Testing handlers for scrapers */
  const testScrapeHandlers = handlers
    .filter(fileName => /^__testRecordScraper__/i.test(fileName))
    .map(createTestMapper(/^__testRecordScraper__/i, 'CronTestRecordScraper'))

  // Handlers for scraping details
  const detailsScrapeHandlers = handlers
    .filter(fileName => /^__detailScraper__/i.test(fileName))
    .map(createMapper(/^__detailScraper__/i, 'CronDetailsScraper'))

  /** @DEBUG * Testing handlers for details scrapers */
  const testDetailsScrapeHandlers = handlers
    .filter(fileName => /^__testDetailScraper__/i.test(fileName))
    .map(createTestMapper(/^__testDetailScraper__/i, 'CronTestDetailsScraper'))

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
  scope: Construct,
  handlers: lambda.Function[],
  startTask: sfn.Chain | sfnTasks.LambdaInvoke | sfn.Pass,
  idPrefix: string,
) => {
  const tasks = handlers.map((scraper, i) => {
    const id = `${idPrefix}Task${i}`
    return new sfnTasks.LambdaInvoke(scope, id, { lambdaFunction: scraper })
  })
  const definition = tasks.reduce<sfn.Chain>(
    (chain, task, i, arr) => chain
      .next(task)
      .next(new sfn.Wait(scope, `${idPrefix}WaitTask${i}`, {
        time: sfn.WaitTime.duration(
          // Do not wait too long if it is the last item
          i + 1 === arr.length
            ? Duration.seconds(1)
            : Duration.minutes(SCRAPER_DELAY_MINS)
        ),
      })),
    startTask as unknown as sfn.Chain
  )
  const stateMachine = new sfn.StateMachine(scope, `${idPrefix}StateMachine`, { definition })
  // Grant execution
  handlers.forEach(scraper => scraper.grantInvoke(stateMachine.role))
  return stateMachine
}

const constructStateMachineWithStartTask = (
  scope: Construct,
  id: string,
  scrapeHandlers: lambda.Function[],
  successHandler?: lambda.Function,
): sfn.StateMachine => {
  // Create step functions
  const startTask = new sfn.Pass(scope, `${id}StartTask`)
  const handlers = [...scrapeHandlers, successHandler].filter(v => v) as lambda.Function[]
  return constructStateMachine(scope, handlers, startTask, id)
}

export interface Options {
  serviceDirname: string;
  defaultInput: DefaultInput;
  // For test functions
  defaultInputTest: DefaultInput;
  recordScrapeSuccessHandler?: lambda.Function;
  detailScrapeSuccessHandler?: lambda.Function;
}

export interface Output extends ScrapingHandlers {
  stateMachines: {
    scrape: sfn.StateMachine;
    scrapeDetails: sfn.StateMachine;
    testScrape: sfn.StateMachine;
    testScrapeDetails: sfn.StateMachine;
  };
}
const constructScrapingStateMachine = (scope: Construct, {
  serviceDirname,
  defaultInput,
  defaultInputTest,
  recordScrapeSuccessHandler,
  detailScrapeSuccessHandler,
}: Options): Output => {
  const handlers = constructScrapingHandlers(scope, serviceDirname, defaultInput, defaultInputTest)

  const scrapeRecordsStateMachine = constructStateMachineWithStartTask(
    scope,
    'CronRecordScrape',
    handlers.scrapers,
    recordScrapeSuccessHandler
  )
  const scrapeDetailsStateMachine = constructStateMachineWithStartTask(
    scope,
    'CronDetailsScrape',
    handlers.detailsScrapers,
    detailScrapeSuccessHandler
  )

  const testScrapeRecordsStateMachine = constructStateMachineWithStartTask(
    scope,
    'CronTestRecordScrape',
    handlers.testScrapers,
    recordScrapeSuccessHandler
  )
  const testScrapeDetailsStateMachine = constructStateMachineWithStartTask(
    scope,
    'CronTestDetailsScrape',
    handlers.testDetailsScrapers,
    detailScrapeSuccessHandler
  )

  return {
    ...handlers,
    stateMachines: {
      scrape: scrapeRecordsStateMachine,
      scrapeDetails: scrapeDetailsStateMachine,
      testScrape: testScrapeRecordsStateMachine,
      testScrapeDetails: testScrapeDetailsStateMachine,
    },
  }
}
export default constructScrapingStateMachine