import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as iam from '@aws-cdk/aws-iam';
import * as events from '@aws-cdk/aws-events';
import * as targets from '@aws-cdk/aws-events-targets';
import { Effect } from '@aws-cdk/aws-iam';
import * as ssm from '@aws-cdk/aws-ssm';


function init (scope: cdk.Construct) {

    /** ------------------ IAM Role Definition ------------------ */

    // Create IAM roles for scraping handlers
    const cronRole = new iam.Role(scope, 'CronRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });
    // Grant db access permissions for handler by assigning role
    cronRole.addToPolicy(
        new iam.PolicyStatement({
            sid: 'ListCreateTableBatchWriteItem',
            resources: ['*'],
            effect: Effect.ALLOW,
            actions: [
                'dynamodb:ListTables',
                // For `waitFor` operation
                'dynamodb:DescribeTable',
                'dynamodb:CreateTable',
                'dynamodb:UpdateTable',
                'dynamodb:BatchWriteItem',
                'dynamodb:Query',
            ],
        })
    );
    // Grant cloudwatch log group access
    cronRole.addToPolicy(
        new iam.PolicyStatement({
            sid: 'LogGroupWrite',
            resources: ['*'],
            effect: Effect.ALLOW,
            actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
            ],
        })
    );
    // Grant lambda-stream mapping policy
    cronRole.addToPolicy(
        new iam.PolicyStatement({
            sid: 'LambdaStreamMapping',
            resources: ['*'],
            effect: Effect.ALLOW,
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
        })
    );

    /** ------------------ Get paramters from parameter store ------------------ */
    
    
    /** ------------------ Lambda Handlers Definition ------------------ */

    // Handler for aggregating top-level items of records
    const aggregationHandler = new lambda.Function(scope, 'CronAggregator', {
        code: lambda.Code.fromAsset('bundles/cron/handlers'),
        handler: 'aggregate.handler',
        timeout: cdk.Duration.minutes(5),
        runtime: lambda.Runtime.NODEJS_12_X,
        memorySize: 250,
        role: cronRole,
    });
    
    // Handler for create table for next coming quarter
    const createTableHandler = new lambda.Function(scope, 'CronCreateTableHandler', {
        code: lambda.Code.fromAsset('bundles/cron/handlers'),
        handler: 'createTable.handler',
        timeout: cdk.Duration.minutes(5),
        runtime: lambda.Runtime.NODEJS_12_X,
        memorySize: 250,
        role: cronRole,
        environment: {
            AGGREGATION_HANDLER_ARN: aggregationHandler.functionArn,
        },
    });

    // Handler for adjust the provisioned throughput of table for previous quarter
    const updateTableHandler = new lambda.Function(scope, 'CronUpdateTableHandler', {
        code: lambda.Code.fromAsset('bundles/cron/handlers'),
        handler: 'updateTable.handler',
        timeout: cdk.Duration.minutes(5),
        runtime: lambda.Runtime.NODEJS_12_X,
        memorySize: 250,
        role: cronRole,
        environment: {
            AGGREGATION_HANDLER_ARN: aggregationHandler.functionArn,
        },
    });

    // Handler for scraping data and saving data
    const scrapeHandler = new lambda.Function(scope, 'CronScraper', {
        code: lambda.Code.fromAsset('bundles/cron/handlers'),
        handler: 'scrape.handler',
        timeout: cdk.Duration.minutes(5),
        runtime: lambda.Runtime.NODEJS_12_X,
        memorySize: 700,
        role: cronRole,
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