import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as iam from '@aws-cdk/aws-iam';
import * as events from '@aws-cdk/aws-events';
import * as targets from '@aws-cdk/aws-events-targets';
import { Effect } from '@aws-cdk/aws-iam';
import * as ssm from '@aws-cdk/aws-ssm';

import env from 'src/lib/env';



function init (scope: cdk.Construct) {

    /** ------------------ IAM Role Definition ------------------ */

    // Create IAM roles for scraping handlers
    const cronRole = new iam.Role(scope, 'CronRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    // Common attributes in IAM statement
    const commonIamStatementInput = {
        resources: ['*'],
        effect: Effect.ALLOW
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
        ],
    }));
    // Grant cloudwatch log group access
    cronRole.addToPolicy(new iam.PolicyStatement({
        ...commonIamStatementInput,
        sid: 'LogGroupWrite',
        actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
        ],
    }));
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
    }));
    // Grant SSM parameter store permissions
    cronRole.addToPolicy(new iam.PolicyStatement({
        ...commonIamStatementInput,
        sid: 'SSMParameterStore',
        actions: [
            'ssm:GetParameter',
        ]
    }));

    /** ------------------ Get non-secure string paramters from parameter store ------------------ */

    // Retrieve the telegram notification channel's chat ID
    const telegramChatId = ssm.StringParameter.fromStringParameterAttributes(scope, 'TelegramChatID', {
        parameterName: env.values.TELEGRAM_CHAT_ID_PARAMETER_NAME,
        // 'version' can be specified but is optional.
    }).stringValue;

    /** ------------------ Lambda Handlers Definition ------------------ */

    const { TELEGRAM_BOT_API_KEY_PARAMETER_NAME } = env.values

    // Common input for lambda Definition
    const commonLambdaInput = {
        code: lambda.Code.fromAsset('bundles/cron/handlers'),
        timeout: cdk.Duration.minutes(5),
        runtime: lambda.Runtime.NODEJS_12_X,
        memorySize: 250,
        role: cronRole,
    };
    // Common environment variables for notification handling
    const commonNotifyEnv = {
        TELEGRAM_CHAT_ID: telegramChatId,
        TELEGRAM_BOT_API_KEY_PARAMETER_NAME,
    }

    /** ---------- Data Processing Handlers ---------- */

    /**
     * Handler for aggregating top-level items of records
     */
    const aggregationHandler = new lambda.Function(scope, 'CronAggregator', {
        ...commonLambdaInput,
        handler: 'aggregate.handler',
    });
    /**
     * Handler for scraping data and saving data
     */
    const scrapeHandler = new lambda.Function(scope, 'CronScraper', {
        ...commonLambdaInput,
        handler: 'scrape.handler',
        memorySize: 700,
    });

    /** ---------- Table Handlers ---------- */

    // Common environment variables for table handling
    const commonTableHandlingEnv = {
        AGGREGATION_HANDLER_ARN: aggregationHandler.functionArn,
    };

    /**
     * Handler for create table for next coming quarter
     */
    const createTableHandler = new lambda.Function(scope, 'CronCreateTableHandler', {
        ...commonLambdaInput,
        handler: 'createTable.handler',
        environment: commonTableHandlingEnv,
    });

    /**
     * Handler for adjust the provisioned throughput of table for previous quarter
     */
    const updateTableHandler = new lambda.Function(scope, 'CronUpdateTableHandler', {
        ...commonLambdaInput,
        handler: 'updateTable.handler',
        environment: commonTableHandlingEnv,
    });

    /** ---------- Notifications Handlers ---------- */

    /**
     * Handler for sending daily notifications upon updates
     */
    const notifyDailyHandler = new lambda.Function(scope, 'CronDailyNotifier', {
        ...commonLambdaInput,
        handler: 'notifyDaily.handler',
        environment: commonNotifyEnv
    });
    /**
     * Handler for sending weekly notifications upon updates
     */
    const notifyWeeklyHandler = new lambda.Function(scope, 'CronWeeklyNotifier', {
        ...commonLambdaInput,
        handler: 'notifyWeekly.handler',
        environment: commonNotifyEnv
    });
    /**
     * Handler for sending monthly notifications upon updates
     */
    const notifyMonthlyHandler = new lambda.Function(scope, 'CronMonthlyNotifier', {
        ...commonLambdaInput,
        handler: 'notifyMonthly.handler',
        environment: commonNotifyEnv
    });
    /**
     * Handler for sending quarterly notifications upon updates
     */
    const notifyQuarterlyHandler = new lambda.Function(scope, 'CronQuarterlyNotifier', {
        ...commonLambdaInput,
        handler: 'notifyQuarterly.handler',
        environment: commonNotifyEnv
    });

    /** ------------------ Events Rule Definition ------------------ */

    // Run every day at 8:00PM UTC
    // See https://docs.aws.amazon.com/lambda/latest/dg/tutorial-scheduled-events-schedule-expressions.html
    const scraperRule = new events.Rule(scope, 'ScraperRule', {
      schedule: events.Schedule.expression('cron(0 20 * * ? *)')
    });
    scraperRule.addTarget(new targets.LambdaFunction(scrapeHandler));

    // Run every END of a quarter
    // At 00:00AM UTC, on the 28th day, in March, June, September and December
    const createTableRule = new events.Rule(scope, 'CreateTableRule', {
        schedule: events.Schedule.expression('cron(0 0 28 3,6,9,12 ? *)')
    });
    createTableRule.addTarget(new targets.LambdaFunction(createTableHandler));

    // Run every START of a quarter
    // At 00:00AM UTC, on the 1st day, in January, April, July and October
    const updateTableRule = new events.Rule(scope, 'UpdateTableRule', {
        schedule: events.Schedule.expression('cron(0 0 1 1,4,7,10 ? *)')
    });
    updateTableRule.addTarget(new targets.LambdaFunction(updateTableHandler));
}

const cron = { init } as const
export default cron