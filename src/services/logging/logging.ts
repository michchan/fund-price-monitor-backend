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

const DIRNAME = __dirname.split('/').pop() ?? ''

const ROLE_ID = 'SubsRole'
const commonIamStatementInput = {
  resources: ['*'],
  effect: iam.Effect.ALLOW,
}

const constructIamRole = (scope: cdk.Construct) => {
  // Create IAM roles for SNS topics subscriptions handling
  const role = new iam.Role(scope, ROLE_ID, {
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  })
  // Grant logging
  role.addToPolicy(new iam.PolicyStatement({
    ...commonIamStatementInput,
    sid: 'LambdaErrorLogs',
    actions: [
      'sns:Publish',
      'logs:CreateLogGroup',
      'logs:CreateLogStream',
      'logs:PutLogEvents',
    ],
  }))
  return role
}

const constructSNSTopics = (scope: cdk.Construct) => {
  // Create topic for subscription to lambda error logs
  const lambdaErrorLogTopic = new sns.Topic(scope, 'LambdaErrorLogTopic', {
    displayName: `${PROJECT_NAMESPACE} - Lambda error logs subscription topic`,
  })
  // Create email subscription
  lambdaErrorLogTopic.addSubscription(
    new subs.EmailSubscription(env.values.LAMBDA_ERROR_LOG_SUBSCRIPTION_EMAIL)
  )
  return lambdaErrorLogTopic
}

interface Handlers {
  notifyErrorLog: lambda.Function;
  mockErrorLog: lambda.Function;
}
const constructLambdas = (
  scope: cdk.Construct,
  role: iam.Role,
  serviceDirname: string,
  lambdaErrorLogTopic: sns.Topic,
): Handlers => {
  // Common input for lambda Definition
  const defaultInput = {
    ...defaultLambdaInput,
    code: lambda.Code.fromAsset(`bundles/${serviceDirname}/handlers`),
    role,
  }
  /** Error log handler */
  const notifyErrorLogHandler = new lambda.Function(scope, 'LoggingNotifyErrorLog', {
    ...defaultInput,
    handler: 'notifyErrorLog.handler',
    environment: { SNS_ARN: lambdaErrorLogTopic.topicArn },
  })
  // Grant SNS publish permission
  lambdaErrorLogTopic.grantPublish(notifyErrorLogHandler)

  /** Mock error logs handler */
  const mockErrorLogHandler = new lambda.Function(scope, 'LoggingMockErrorLog', {
    ...defaultInput,
    handler: 'mockErrorLog.handler',
  })

  return {
    notifyErrorLog: notifyErrorLogHandler,
    mockErrorLog: mockErrorLogHandler,
  }
}

const constructSubscriptions = (
  scope: cdk.Construct,
  { notifyErrorLog, mockErrorLog }: Handlers,
  logGroups: logs.ILogGroup[],
) => {
  // Create lambda subscription destination
  const subsDestination = new LambdaDestination(notifyErrorLog)
  // Create filter pattern
  const subsFilterPattern = logs.FilterPattern.anyTerm('ERROR', 'WARN')

  const allLogGroups = [...logGroups, mockErrorLog.logGroup]
  // Create subscription filters for each log group
  allLogGroups.forEach((logGroup, i) => {
    const id = `LambdaErrorLogsSubscription${i}${generateRandomString()}`
    return new logs.SubscriptionFilter(scope, id, {
      logGroup,
      destination: subsDestination,
      filterPattern: subsFilterPattern,
    })
  })
}

export interface InitOptions {
  logGroups: logs.ILogGroup[];
}
/**
 * Reference: https://aws.amazon.com/blogs/mt/get-notified-specific-lambda-function-error-patterns-using-cloudwatch/
 */
function construct (scope: cdk.Construct, options: InitOptions) {
  const { logGroups } = options

  const role = constructIamRole(scope)
  const lambdaErrorLogTopic = constructSNSTopics(scope)
  const handlers = constructLambdas(scope, role, DIRNAME, lambdaErrorLogTopic)
  constructSubscriptions(scope, handlers, logGroups)
}

const logging = { construct } as const
export default logging