import * as cdk from '@aws-cdk/core';
import * as sns from '@aws-cdk/aws-sns';
import * as subs from '@aws-cdk/aws-sns-subscriptions';
import * as iam from '@aws-cdk/aws-iam';
import { Effect } from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as logs from '@aws-cdk/aws-logs';
import { FilterPattern } from '@aws-cdk/aws-logs';
import { LambdaDestination } from '@aws-cdk/aws-logs-destinations';

import env from 'src/lib/env';


export interface InitOptions {
    logGroups: logs.ILogGroup[];
}

function init (scope: cdk.Construct, options: InitOptions) {
    const { logGroups } = options

    /** ------------------ IAM Role Definition ------------------ */
    
    // Create IAM roles for SNS topics subscriptions handling
    const subsRole = new iam.Role(scope, 'subsRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    // Common attributes in IAM statement
    const commonIamStatementInput = {
        resources: ['*'],
        effect: Effect.ALLOW
    };

    // Create SNS publish handling policy statement
    const snsPubSubStatement = new iam.PolicyStatement({
        resources: ['*'],
        effect: Effect.ALLOW,
        sid: 'LambdaErrorLogs',
        actions: [
            'sns:Publish',
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
        ]
    });

    // Grant SNS publish
    subsRole.addToPolicy(snsPubSubStatement);

    /** ------------------ SNS Topics Definition ------------------ */

    // Create topic for subscription to lambda error logs
    const lambdaErrorLogTopic = new sns.Topic(scope, 'LambdaErrorLogTopic', {
        displayName: 'Lambda error logs subscription topic'
    });

    // Create email subscription
    lambdaErrorLogTopic.addSubscription(
        new subs.EmailSubscription(env.values.LAMBDA_ERROR_LOG_SUBSCRIPTION_EMAIL)
    );

    // Add role policy statement
    lambdaErrorLogTopic.addToResourcePolicy(snsPubSubStatement);

    /** ------------------ Lambda Handlers Definition ------------------ */

    // Common input for lambda Definition
    const commonLambdaInput = {
        code: lambda.Code.fromAsset('bundles/api/handlers'),
        timeout: cdk.Duration.minutes(5),
        runtime: lambda.Runtime.NODEJS_12_X,
        role: subsRole,
    };

    /** Error log handler */
    const notifyErrorHandler = new lambda.Function(scope, 'NotifyErrorHandler', {
        ...commonLambdaInput,
        handler: 'notifyError.handler',
    });

    /** ------------------ Cloudwatch Triggers Definition ------------------ */

    // Create subscription filters
    logGroups.forEach(logGroup => new logs.SubscriptionFilter(scope, `LambdaErrorLogsSubscription-${logGroup.logGroupName}`, {
        logGroup,
        destination: new LambdaDestination(notifyErrorHandler),
        filterPattern: FilterPattern.allTerms('?ERROR', '?WARN', '?5xx')
    }));
}

const logging = { init } as const
export default logging