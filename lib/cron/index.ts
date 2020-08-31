import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as iam from '@aws-cdk/aws-iam';
import { Effect } from '@aws-cdk/aws-iam';


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
                'dynamodb:BatchWriteItem',
                'dynamodb:Query',
            ],
        })
    )
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
    )
    // Grant lambda-stream mapping policy
    cronRole.addToPolicy(
        new iam.PolicyStatement({
            sid: 'LambdaStreamMapping',
            resources: ['*'],
            effect: Effect.ALLOW,
            actions: [
                'lambda:CreateEventSourceMapping',
                // For `waitFor` operation
                'lambda:GetFunctionConfiguration',
                'dynamodb:DescribeStream',
                'dynamodb:GetRecords',
                'dynamodb:GetShardIterator', 
                'dynamodb:ListStreams',
            ],
        })
    )

    /** ------------------ Lambda Handlers Definition ------------------ */

    // Handler for aggregating top-level items of records
    const aggregationHandler = new lambda.Function(scope, 'CronAggregator', {
        code: lambda.Code.fromAsset('bundles/cron/handlers'),
        handler: 'aggregate.handler',
        // Maximum timeout of lambda is 15 minutes
        timeout: cdk.Duration.seconds(60 * 15),
        runtime: lambda.Runtime.NODEJS_12_X,
        memorySize: 300,
        role: cronRole,
    });
    
    // Handler for check and create tables
    const tableHandler = new lambda.Function(scope, 'CronTableHandler', {
        code: lambda.Code.fromAsset('bundles/cron/handlers'),
        handler: 'handleTable.handler',
        // Maximum timeout of lambda is 15 minutes
        timeout: cdk.Duration.seconds(60 * 15),
        runtime: lambda.Runtime.NODEJS_12_X,
        memorySize: 250,
        role: cronRole,
        environment: {
            AGGREGATION_HANDLER_ARN: aggregationHandler.functionArn,
        },
    })

    // Handler for scraping data and saving data
    const scrapeHandler = new lambda.Function(scope, 'CronScraper', {
        code: lambda.Code.fromAsset('bundles/cron/handlers'),
        handler: 'scrape.handler',
        // Maximum timeout of lambda is 15 minutes
        timeout: cdk.Duration.seconds(60 * 15),
        runtime: lambda.Runtime.NODEJS_12_X,
        memorySize: 700,
        role: cronRole,
    });

    /** ------------------ Step functions state machine Definition ------------------ */


    /** ------------------ Events Rule Definition ------------------ */

    // Run every day at 6PM UTC
    // See https://docs.aws.amazon.com/lambda/latest/dg/tutorial-scheduled-events-schedule-expressions.html
    // const rule = new events.Rule(this, 'Rule', {
    //   schedule: events.Schedule.expression('cron(0 18 ? * MON-FRI *)')
    // });

    // rule.addTarget(new targets.LambdaFunction(handler));
}

const cron = { init } as const
export default cron