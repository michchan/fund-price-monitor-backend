import * as cdk from '@aws-cdk/core'
import * as iam from '@aws-cdk/aws-iam'
import * as lambda from '@aws-cdk/aws-lambda'
import * as logs from '@aws-cdk/aws-logs'
import * as sns from '@aws-cdk/aws-sns'
import * as subs from '@aws-cdk/aws-sns-subscriptions'
import { LambdaDestination } from '@aws-cdk/aws-logs-destinations'
import generateRandomString from 'simply-utils/dist/string/generateRandomString'

import { PROJECT_NAMESPACE } from 'src/constants'
import defaultLambdaInput from 'src/common/defaultLambdaInput'
import env from 'src/lib/env'

const DIRNAME = __dirname.split('/').pop()

export interface InitOptions {
  logGroups: logs.ILogGroup[];
}

/**
 * Reference: https://aws.amazon.com/blogs/mt/get-notified-specific-lambda-function-error-patterns-using-cloudwatch/
 */
function construct (scope: cdk.Construct, options: InitOptions) {
  const { logGroups } = options

  /** ------------------ IAM Role Definition ------------------ */

  // Create IAM roles for SNS topics subscriptions handling
  const subsRole = new iam.Role(scope, 'subsRole', { assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com') })

  // Common attributes in IAM statement
  const commonIamStatementInput = {
    resources: ['*'],
    effect: iam.Effect.ALLOW,
  }

  // Grant logging
  subsRole.addToPolicy(new iam.PolicyStatement({
    ...commonIamStatementInput,
    sid: 'LambdaErrorLogs',
    actions: [
      'sns:Publish',
      'logs:CreateLogGroup',
      'logs:CreateLogStream',
      'logs:PutLogEvents',
    ],
  }))

  /** ------------------ SNS Topics Definition ------------------ */

  // Create topic for subscription to lambda error logs
  const lambdaErrorLogTopic = new sns.Topic(scope, 'LambdaErrorLogTopic', { displayName: `${PROJECT_NAMESPACE} - Lambda error logs subscription topic` })

  // Create email subscription
  lambdaErrorLogTopic.addSubscription(
    new subs.EmailSubscription(env.values.LAMBDA_ERROR_LOG_SUBSCRIPTION_EMAIL)
  )

  /** ------------------ Lambda Handlers Definition ------------------ */

  // Common input for lambda Definition
  const commonLambdaInput = {
    ...defaultLambdaInput,
    code: lambda.Code.fromAsset(`bundles/${DIRNAME}/handlers`),
    role: subsRole,
  }

  /** Error log handler */
  const notifyErrorLogHandler = new lambda.Function(scope, 'LoggingNotifyErrorLog', {
    ...commonLambdaInput,
    handler: 'notifyErrorLog.handler',
    environment: { SNS_ARN: lambdaErrorLogTopic.topicArn },
  })
  // Grant SNS publish permission
  lambdaErrorLogTopic.grantPublish(notifyErrorLogHandler)

  /** Mock error logs handler */
  const mockErrorLogHandler = new lambda.Function(scope, 'LoggingMockErrorLog', {
    ...commonLambdaInput,
    handler: 'mockErrorLog.handler',
  })

  /** ------------------ Cloudwatch Triggers Definition ------------------ */

  // Create lambda subscription destination
  const subsDestination = new LambdaDestination(notifyErrorLogHandler)
  // Create filter pattern
  const subsFilterPattern = logs.FilterPattern.anyTerm('ERROR', 'WARN')

  const _logGroups = [...logGroups, mockErrorLogHandler.logGroup]
  // Create subscription filters for each log group
  _logGroups.forEach((logGroup, i) => {
    const id = `LambdaErrorLogsSubscription${i}${generateRandomString()}`
    return new logs.SubscriptionFilter(scope, id, {
      logGroup,
      destination: subsDestination,
      filterPattern: subsFilterPattern,
    })
  })
}

const logging = { construct } as const
export default logging