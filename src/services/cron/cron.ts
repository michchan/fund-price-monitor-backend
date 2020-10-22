import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import * as iam from '@aws-cdk/aws-iam'
import * as events from '@aws-cdk/aws-events'
import * as targets from '@aws-cdk/aws-events-targets'
import { Effect } from '@aws-cdk/aws-iam'
import * as ssm from '@aws-cdk/aws-ssm'
import * as fs from 'fs'

import env from 'src/lib/env'
import defaultLambdaInput from 'src/common/defaultLambdaInput'

const DIRNAME = __dirname.split('/').pop()

export interface ReturnType {
  handlers: {
    aggregation: lambda.Function;
    scrapers: lambda.Function[];
    testScrapers: lambda.Function[];
    createTable: lambda.Function;
    updateTable: lambda.Function;
    notifyDaily: lambda.Function;
    notifyWeekly: lambda.Function;
    notifyMonthly: lambda.Function;
    notifyQuarterly: lambda.Function;
  };
}

function construct (scope: cdk.Construct): ReturnType {
  /** ------------------ IAM Role Definition ------------------ */

  // Create IAM roles for scraping handlers
  const cronRole = new iam.Role(scope, 'CronRole', { assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com') })

  // Common attributes in IAM statement
  const commonIamStatementInput = {
    resources: ['*'],
    effect: Effect.ALLOW,
  }

  // Grant db access permissions for handler by assigning role
  cronRole.addToPolicy(new iam.PolicyStatement({
    ...commonIamStatementInput,
    sid: 'ListCreateTableBatchWriteItem',
    actions: [
      'dynamodb:ListTables',
      // For `waitFor` operation
      'dynamodb:DescribeTable',
      'dynamodb:CreateTable',
      'dynamodb:UpdateTable',
      'dynamodb:BatchWriteItem',
      'dynamodb:Query',
      'dynamodb:PutItem',
      'dynamodb:UpdateItem',
    ],
  }))
  // Grant cloudwatch log group access
  cronRole.addToPolicy(new iam.PolicyStatement({
    ...commonIamStatementInput,
    sid: 'LogGroupWrite',
    actions: [
      'logs:CreateLogGroup',
      'logs:CreateLogStream',
      'logs:PutLogEvents',
    ],
  }))
  // Grant lambda-stream mapping policy
  cronRole.addToPolicy(new iam.PolicyStatement({
    ...commonIamStatementInput,
    sid: 'LambdaStreamMapping',
    actions: [
      'lambda:CreateEventSourceMapping',
      'lambda:DeleteEventSourceMapping',
      'lambda:ListEventSourceMappings',
      // For `waitFor` operation
      'lambda:GetFunctionConfiguration',
      'dynamodb:DescribeStream',
      'dynamodb:GetRecords',
      'dynamodb:GetShardIterator',
      'dynamodb:ListStreams',
    ],
  }))
  // Grant SSM parameter store permissions
  cronRole.addToPolicy(new iam.PolicyStatement({
    ...commonIamStatementInput,
    sid: 'SSMParameterStore',
    actions: [
      'ssm:GetParameter',
    ],
  }))

  /** ------------------ Get non-secure string paramters from parameter store ------------------ */

  // Retrieve the telegram notification channel's chat ID
  const telegramChatId = ssm.StringParameter.fromStringParameterAttributes(scope, 'TelegramChatID', {
    parameterName: env.values.TELEGRAM_CHAT_ID_PARAMETER_NAME,
    // 'version' can be specified but is optional.
  }).stringValue

  /** ------------------ Lambda Handlers Definition ------------------ */

  const { TELEGRAM_BOT_API_KEY_PARAMETER_NAME } = env.values

  // Common input for lambda Definition
  const commonLambdaInput = {
    ...defaultLambdaInput,
    code: lambda.Code.fromAsset(`bundles/${DIRNAME}/handlers`),
    memorySize: 250,
    role: cronRole,
  }
  // Common environment variables for notification handling
  const commonNotifyEnv = {
    TELEGRAM_CHAT_ID: telegramChatId,
    TELEGRAM_BOT_API_KEY_PARAMETER_NAME,
  }
  // Common lambda configs for scrape handlers
  const commonScrapersInput = {
    // Extra memory is needed for running the headless browser instance
    memorySize: 700,
    // Extra timeout for scrapers
    timeout: cdk.Duration.minutes(15),
  }

  /** ---------- Aggregation Handlers ---------- */

  /**
   * Handler for aggregating top-level items of records
   */
  const aggregationHandler = new lambda.Function(scope, 'CronAggregator', {
    ...commonLambdaInput,
    handler: 'aggregate.handler',
  })

  /** ---------- Scrape Handlers ---------- */

  // Read handlers directory
  const handlers = fs.readdirSync(`${__dirname}/handlers`)

  /**
   * Scraper creator
   */
  const getScraperCreator = (nameRegExp: RegExp, namePrefix: string) => (fileName: string) => {
    const name = fileName.replace(nameRegExp, '').replace(/\.ts$/i, '')
    return new lambda.Function(scope, `${namePrefix}${name}`, {
      ...commonLambdaInput,
      ...commonScrapersInput,
      handler: `${fileName.replace(/\.ts$/i, '')}.handler`,
    })
  }

  /**
   * * Handlers for scraping data and saving data
   */
  const scrapeHandlers = handlers
    .filter(fileName => /^handleScrapeFrom/i.test(fileName))
    .map(getScraperCreator(/^handleScrapeFrom/i, 'CronScraper'))

  /**
   * @DEBUG * Testing handlers for scrapers
   */
  const testScrapeHandlers = handlers
    .filter(fileName => /^testScrapeFrom/i.test(fileName))
    .map(getScraperCreator(/^testScrapeFrom/i, 'CronTestScraper'))

  /** ---------- Table Handlers ---------- */

  // Common environment variables for table handling
  const commonTableHandlingEnv = { AGGREGATION_HANDLER_ARN: aggregationHandler.functionArn }

  /**
   * Handler for create table for next coming quarter
   */
  const createTableHandler = new lambda.Function(scope, 'CronTableCreateHandler', {
    ...commonLambdaInput,
    handler: 'createTable.handler',
    environment: commonTableHandlingEnv,
  })

  /**
   * Handler for adjust the provisioned throughput of table for previous quarter
   */
  const updateTableHandler = new lambda.Function(scope, 'CronTableUpdateHandler', {
    ...commonLambdaInput,
    handler: 'updateTable.handler',
    environment: commonTableHandlingEnv,
  })

  /** ---------- Notifications Handlers ---------- */

  const notifyDailyHandler = new lambda.Function(scope, 'CronNotifierDaily', {
    ...commonLambdaInput,
    handler: 'notifyDaily.handler',
    environment: commonNotifyEnv,
  })
  const notifyWeeklyHandler = new lambda.Function(scope, 'CronNotifierWeekly', {
    ...commonLambdaInput,
    handler: 'notifyWeekly.handler',
    environment: commonNotifyEnv,
  })
  const notifyMonthlyHandler = new lambda.Function(scope, 'CronNotifierMonthly', {
    ...commonLambdaInput,
    handler: 'notifyMonthly.handler',
    environment: commonNotifyEnv,
  })
  const notifyQuarterlyHandler = new lambda.Function(scope, 'CronNotifierQuarterly', {
    ...commonLambdaInput,
    handler: 'notifyQuarterly.handler',
    environment: commonNotifyEnv,
  })

  /** ------------------ Events Rule Definition ------------------ */

  /** ------------ Daily ------------ */

  // Run every day at 20:00 UTC
  // See https://docs.aws.amazon.com/lambda/latest/dg/tutorial-scheduled-events-schedule-expressions.html
  const dailyScrapeRule = new events.Rule(scope, 'DailyScrapeRule', { schedule: events.Schedule.expression('cron(0 20 * * ? *)') })
  // * Add target for each scraper
  scrapeHandlers.forEach(handler => dailyScrapeRule.addTarget(new targets.LambdaFunction(handler)))

  // Run every day at 00:00AM UTC
  const dailyAlarmRule = new events.Rule(scope, 'DailyAlarmRule', { schedule: events.Schedule.expression('cron(0 0 * * ? *)') })
  dailyAlarmRule.addTarget(new targets.LambdaFunction(notifyDailyHandler))

  /** ------------ Weekly ------------ */
  // Run on Saturday in every week at 15:00 UTC
  const weeklyReviewRule = new events.Rule(scope, 'WeeklyReviewRule', { schedule: events.Schedule.expression('cron(0 15 ? * 7 *)') })
  weeklyReviewRule.addTarget(new targets.LambdaFunction(notifyWeeklyHandler))

  /** ------------ Monthly ------------ */
  // Run on the 28th day in every month at 15:00 UTC
  const monthlyReviewRule = new events.Rule(scope, 'MonthlyReviewRule', { schedule: events.Schedule.expression('cron(0 15 28 * ? *)') })
  monthlyReviewRule.addTarget(new targets.LambdaFunction(notifyMonthlyHandler))

  /** ------------ Quarterly ------------ */

  // Run every END of a quarter
  // At 15:00 UTC, on the 28th day, in March, June, September and December
  const quarterNearEndRule = new events.Rule(scope, 'QuarterNearEndRule', { schedule: events.Schedule.expression('cron(0 15 28 3,6,9,12 ? *)') })
  quarterNearEndRule.addTarget(new targets.LambdaFunction(createTableHandler))
  quarterNearEndRule.addTarget(new targets.LambdaFunction(notifyQuarterlyHandler))

  // Run every START of a quarter
  // At 00:00AM UTC, on the 1st day, in January, April, July and October
  const quarterStartRule = new events.Rule(scope, 'QuarterStartRule', { schedule: events.Schedule.expression('cron(0 0 1 1,4,7,10 ? *)') })
  quarterStartRule.addTarget(new targets.LambdaFunction(updateTableHandler))

  return {
    handlers: {
      aggregation: aggregationHandler,
      scrapers: scrapeHandlers,
      testScrapers: testScrapeHandlers,
      createTable: createTableHandler,
      updateTable: updateTableHandler,
      notifyDaily: notifyDailyHandler,
      notifyWeekly: notifyWeeklyHandler,
      notifyMonthly: notifyMonthlyHandler,
      notifyQuarterly: notifyQuarterlyHandler,
    },
  }
}

const cron = { construct } as const
export default cron