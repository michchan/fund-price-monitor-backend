import * as cdk from '@aws-cdk/core';
import * as sns from '@aws-cdk/aws-sns';
import * as subs from '@aws-cdk/aws-sns-subscriptions';
import * as iam from '@aws-cdk/aws-iam';
import { Effect } from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as logs from '@aws-cdk/aws-logs';
import { FilterPattern } from '@aws-cdk/aws-logs';
import { LambdaDestination } from '@aws-cdk/aws-logs-destinations';
import generateRandomString from 'simply-utils/dist/string/generateRandomString';

import env from 'src/lib/env';


const DIRNAME = 'logging'

export interface InitOptions {
    logGroups: logs.ILogGroup[];
}

/**
 * Reference: https://aws.amazon.com/blogs/mt/get-notified-specific-lambda-function-error-patterns-using-cloudwatch/
 */
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
    
    // Grant logging
    subsRole.addToPolicy(new iam.PolicyStatement({
        ...commonIamStatementInput,
        sid: 'LambdaErrorLogs',
        actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
        ],
    }));

    /** ------------------ SNS Topics Definition ------------------ */

    // Create topic for subscription to lambda error logs
    const lambdaErrorLogTopic = new sns.Topic(scope, 'LambdaErrorLogTopic', {
        displayName: 'Lambda error logs subscription topic'
    });

    // Create email subscription
    lambdaErrorLogTopic.addSubscription(
        new subs.EmailSubscription(env.values.LAMBDA_ERROR_LOG_SUBSCRIPTION_EMAIL)
    );

    /** ------------------ Lambda Handlers Definition ------------------ */

    // Common input for lambda Definition
    const commonLambdaInput = {
        code: lambda.Code.fromAsset(`bundles/${DIRNAME}/handlers`),
        timeout: cdk.Duration.minutes(5),
        runtime: lambda.Runtime.NODEJS_12_X,
        role: subsRole,
    };

    /** Error log handler */
    const notifyErrorHandler = new lambda.Function(scope, 'NotifyErrorHandler', {
        ...commonLambdaInput,
        handler: 'notifyError.handler',
    });
    // Grant SNS publish permission
    lambdaErrorLogTopic.grantPublish(notifyErrorHandler);

    /** Mock error logs handler */
    const mockErrorLogHandler = new lambda.Function(scope, 'MockErrorLogHandler', {
        ...commonLambdaInput,
        handler: 'mockErrorLog.handler',
    });

    /** ------------------ Cloudwatch Triggers Definition ------------------ */

    // Create subscription filters for each log group
    [...logGroups, mockErrorLogHandler.logGroup].forEach((logGroup, i) => {
        const id = `LambdaErrorLogsSubscription${i}${generateRandomString()}`
        return new logs.SubscriptionFilter(scope, id, {
            logGroup,
            destination: new LambdaDestination(notifyErrorHandler),
            filterPattern: FilterPattern.allTerms('ERROR', 'WARN'),
        })
    });
}

const logging = { init } as const
export default logging