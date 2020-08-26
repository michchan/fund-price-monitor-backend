import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';


function init (scope: cdk.Construct) {
    // Handler for Manulife MPF performance scraping
    const scrapeManulifeMPFPerformance = new lambda.Function(scope, 'scrapeManulifeMPFPerformance', {
        code: lambda.Code.fromAsset('bundles/cron/handlers'),
        handler: 'scrapeManulifeMPFPerformance.handler',
        timeout: cdk.Duration.seconds(300),
        runtime: lambda.Runtime.NODEJS_12_X,
        memorySize: 600,
    });

    // Run every day at 6PM UTC
    // See https://docs.aws.amazon.com/lambda/latest/dg/tutorial-scheduled-events-schedule-expressions.html
    // const rule = new events.Rule(this, 'Rule', {
    //   schedule: events.Schedule.expression('cron(0 18 ? * MON-FRI *)')
    // });

    // rule.addTarget(new targets.LambdaFunction(scrapeManulifeMPFPerformance));
}

export default { init }