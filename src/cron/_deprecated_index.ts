import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as iam from '@aws-cdk/aws-iam';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import * as sfnTasks from '@aws-cdk/aws-stepfunctions-tasks';
import * as events from '@aws-cdk/aws-events';
import * as targets from '@aws-cdk/aws-events-targets';
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
                // For `waitFor` operation
                'lambda:GetFunctionConfiguration',
                'dynamodb:DescribeStream',
                'dynamodb:GetRecords',
                'dynamodb:GetShardIterator', 
                'dynamodb:ListStreams',
            ],
        })
    );
    
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
    
    // Handler for check and create tables
    const tableHandler = new lambda.Function(scope, 'CronTableHandler', {
        code: lambda.Code.fromAsset('bundles/cron/handlers'),
        handler: '_deprecated_handleTable.handler',
        timeout: cdk.Duration.minutes(5),
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
        timeout: cdk.Duration.minutes(5),
        runtime: lambda.Runtime.NODEJS_12_X,
        memorySize: 700,
        role: cronRole,
    });

    /** ------------------ Step functions state machine Definition ------------------ */

    // Create table handling task
    const handleTableTask = new sfn.Task(scope, 'Check existing or create table', {
        task: new sfnTasks.InvokeFunction(tableHandler),
    });   
    // Create a wait state to wait for the dynamodb stream to warm up and work
    const wait = new sfn.Wait(scope, 'Wait for dynamodb stream to warm-up', {
        // By experience, the dynamodb stream need more than 1 minute in order to work, 
        // after table is just created.
        // So it should be made safe here by setting 3 minutes wait time.
        time: sfn.WaitTime.duration(cdk.Duration.minutes(3)),
    });
    // Create scraping task
    const scrapeTask = new sfn.Task(scope, 'Scrap and save records', {
        task: new sfnTasks.InvokeFunction(scrapeHandler),
    });

    // Create chain
    const chain = sfn.Chain
        .start(handleTableTask)
        .next(wait)
        .next(scrapeTask)

    // Create state machine
    const stateMachine = new sfn.StateMachine(scope, 'CronStateMachine', {
        definition: chain,
        timeout: cdk.Duration.minutes(15),
    });

    // Grant lambda execution roles
    tableHandler.grantInvoke(stateMachine.role);
    scrapeHandler.grantInvoke(stateMachine.role);

    /** ------------------ Events Rule Definition ------------------ */

    // Run every day at 8:00PM UTC
    // See https://docs.aws.amazon.com/lambda/latest/dg/tutorial-scheduled-events-schedule-expressions.html
    const rule = new events.Rule(scope, 'Rule', {
      schedule: events.Schedule.expression('cron(0 20 * * ? *)')
    });

    rule.addTarget(new targets.SfnStateMachine(stateMachine));
}

const cron = { init } as const
export default cron