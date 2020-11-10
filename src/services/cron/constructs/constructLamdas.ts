import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import * as iam from '@aws-cdk/aws-iam'
import * as fs from 'fs'
import * as sfn from '@aws-cdk/aws-stepfunctions'
import * as sfnTasks from '@aws-cdk/aws-stepfunctions-tasks'

import env from 'src/lib/buildEnv'
import defaultLambdaInput from 'src/common/defaultLambdaInput'
import { CronRoles } from './constructIamRoles'
import { ARE_ALL_BATCHES_AGGREGATED } from '../constants'

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

interface Aggregators {
  aggregation: lambda.Function;
}
const constructAggregators = (
  scope: cdk.Construct,
  defaultInput: ReturnType<typeof getDefaultLambdaInput>,
  postAggregateStateMachine: sfn.StateMachine,
): Aggregators => {
  // Handler for aggregating top-level items of records
  const aggregation = new lambda.Function(scope, 'CronAggregator', {
    ...defaultInput,
    handler: 'aggregate.handler',
    environment: {
      POST_AGGREGATE_STATE_MACHINE_ARN: postAggregateStateMachine.stateMachineArn,
    },
  })
  return { aggregation }
}

interface ScrapingHandlers {
  scrapers: lambda.Function[];
  testScrapers: lambda.Function[];
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

  return {
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
  notifyOnUpdate: lambda.Function;
  notifyMonthly: lambda.Function;
  notifyQuarterly: lambda.Function;
}
const constructNotificationHandlers = (
  scope: cdk.Construct,
  defaultInput: ReturnType<typeof getDefaultLambdaInput>,
  telegramChatId: string,
): NotificationHandlers => {
  const environment = getDefaultNotifierEnv(telegramChatId)

  const notifyOnUpdateHandler = new lambda.Function(scope, 'CronNotifierOnUpdate', {
    ...defaultInput,
    handler: 'notifyOnUpdate.handler',
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
    notifyOnUpdate: notifyOnUpdateHandler,
    notifyMonthly: notifyMonthlyHandler,
    notifyQuarterly: notifyQuarterlyHandler,
  }
}

interface CleanupHandlers {
  dedup: lambda.Function;
}
const constructCleanupHandlers = (
  scope: cdk.Construct,
  defaultInput: ReturnType<typeof getDefaultLambdaInput>,
): CleanupHandlers => {
  // Handler for de-duplications of records
  const dedupHandler = new lambda.Function(scope, 'CronDedupHandler', {
    ...defaultInput,
    handler: 'dedup.handler',
  })
  return { dedup: dedupHandler }
}

const STEP_FUNC_INTERVAL_MS = 3000
const STEP_FUNC_TIMEOUT_MINS = 10
const ARE_ALL_BATCHES_AGGREGATED_PATH = `$.${ARE_ALL_BATCHES_AGGREGATED}`

interface PostScrapeInputHandlers extends
  Pick<CleanupHandlers, 'dedup'>,
  Pick<NotificationHandlers, 'notifyOnUpdate'> {}
interface PostScrapeOutputHandlers {
  checkLastBatchHandler: lambda.Function;
}
interface PostScrapeOutput extends PostScrapeOutputHandlers {
  stateMachine: sfn.StateMachine;
}
const constructPostAggregateSfnStateMachine = (
  scope: cdk.Construct,
  defaultInput: ReturnType<typeof getDefaultLambdaInput>,
  { dedup, notifyOnUpdate }: PostScrapeInputHandlers,
): PostScrapeOutput => {
  // Define tasks for condition
  const checkLastBatchHandler = new lambda.Function(scope, 'CronPostAggLastBatchChecker', {
    ...defaultInput,
    handler: 'checkLastBatchPostAggregate.handler',
  })
  const checkLastBatchTask = new sfnTasks.LambdaInvoke(scope, 'Check if it is the last batch', {
    lambdaFunction: checkLastBatchHandler,
    outputPath: ARE_ALL_BATCHES_AGGREGATED_PATH,
  })
  // Define tasks for jobs
  const waitTask = new sfn.Wait(scope, 'CronPostScrapeWaitTask', {
    time: sfn.WaitTime.duration(cdk.Duration.millis(STEP_FUNC_INTERVAL_MS)),
  })
  const dedupTask = new sfnTasks.LambdaInvoke(scope, 'Dedup task', {
    lambdaFunction: dedup,
  })
  const notifyOnUpdateTask = new sfnTasks.LambdaInvoke(scope, 'Notify on update task', {
    lambdaFunction: notifyOnUpdate,
  })
  // Create job chain
  const jobsChain = dedupTask
    .next(waitTask)
    .next(notifyOnUpdateTask)
  // Create condition to start the jobs
  const startChoice = new sfn.Choice(scope, 'Are all batches aggregated?')
  const startCondition = sfn.Condition.booleanEquals(ARE_ALL_BATCHES_AGGREGATED_PATH, true)
  // Create chain with start condition
  const definition = checkLastBatchTask.next(startChoice.when(startCondition, jobsChain))
  // Create state machine
  const stateMachine = new sfn.StateMachine(scope, 'CronPostAggStateMachine', {
    definition,
    timeout: cdk.Duration.minutes(STEP_FUNC_TIMEOUT_MINS),
  })
  // Grant lambda execution roles
  checkLastBatchHandler.grantInvoke(stateMachine.role)
  dedup.grantInvoke(stateMachine.role)
  notifyOnUpdate.grantInvoke(stateMachine.role)

  return { stateMachine, checkLastBatchHandler }
}

// Common input for lambda Definition
const getDefaultLambdaInput = (role: iam.Role, servicePathname: string) => {
  const MEMORY_SIZE_MB = 250
  return {
    ...defaultLambdaInput,
    code: lambda.Code.fromAsset(`bundles/${servicePathname}/handlers`),
    memorySize: MEMORY_SIZE_MB,
    role,
  }
}

export interface Handlers extends ScrapingHandlers,
  Aggregators,
  TableHandlers,
  NotificationHandlers,
  CleanupHandlers,
  PostScrapeOutputHandlers {}
export interface Options {
  servicePathname: string;
  serviceDirname: string;
  telegramChatId: string;
}
const constructLamdas = (
  scope: cdk.Construct,
  {
    tableHandler,
    itemsReader,
    itemsAlterer,
    aggregator,
  }: CronRoles,
  {
    servicePathname,
    serviceDirname,
    telegramChatId,
  }: Options,
): Handlers => {
  const getDefaultInput = (role: iam.Role) => getDefaultLambdaInput(role, servicePathname)
  const notificationHandlers = constructNotificationHandlers(
    scope,
    getDefaultInput(itemsReader),
    telegramChatId
  )
  const cleanupHandlers = constructCleanupHandlers(scope, getDefaultInput(itemsAlterer))
  const {
    stateMachine,
    checkLastBatchHandler,
  } = constructPostAggregateSfnStateMachine(scope, getDefaultInput(itemsReader), {
    dedup: cleanupHandlers.dedup,
    notifyOnUpdate: notificationHandlers.notifyOnUpdate,
  })
  const scrapingHandlers = constructScrapingHandlers(
    scope,
    serviceDirname,
    getDefaultInput(itemsAlterer),
  )
  const aggregators = constructAggregators(scope, getDefaultInput(aggregator), stateMachine)
  const tableHandlers = constructTableHandlers(
    scope,
    getDefaultInput(tableHandler),
    aggregators.aggregation
  )
  return {
    checkLastBatchHandler,
    ...scrapingHandlers,
    ...notificationHandlers,
    ...tableHandlers,
    ...cleanupHandlers,
    ...aggregators,
  }
}
export default constructLamdas