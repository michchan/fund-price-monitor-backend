import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as iam from '@aws-cdk/aws-iam';


function init (scope: cdk.Construct) {
    // Create IAM roles for scraping handlers
    const cronRole = new iam.Role(scope, 'CronRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });
    // Grant db access permissions for handler by assigning role
    cronRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));

    // Handler for aggregating top-level items of records
    const aggregationHandler = new lambda.Function(scope, 'cron.aggregate', {
        code: lambda.Code.fromAsset('bundles/cron/handlers'),
        handler: 'aggregate.handler',
        timeout: cdk.Duration.seconds(300),
        runtime: lambda.Runtime.NODEJS_12_X,
        role: cronRole,
    });
    
    // Handler for scraping data, creating latest table and saving data and other related cron jobs
    const mainHandler = new lambda.Function(scope, 'cron.index', {
        code: lambda.Code.fromAsset('bundles/cron/handlers'),
        handler: 'index.handler',
        timeout: cdk.Duration.seconds(300),
        runtime: lambda.Runtime.NODEJS_12_X,
        memorySize: 610,
        role: cronRole,
        environment: {
            AGGREGATION_HANDLER_ARN: aggregationHandler.functionArn,
        },
    });

    // Run every day at 6PM UTC
    // See https://docs.aws.amazon.com/lambda/latest/dg/tutorial-scheduled-events-schedule-expressions.html
    // const rule = new events.Rule(this, 'Rule', {
    //   schedule: events.Schedule.expression('cron(0 18 ? * MON-FRI *)')
    // });

    // rule.addTarget(new targets.LambdaFunction(handler));
}

const cron = { init } as const
export default cron