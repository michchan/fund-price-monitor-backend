import * as cdk from '@aws-cdk/core'
import * as iam from '@aws-cdk/aws-iam'
import * as lambda from '@aws-cdk/aws-lambda'
import * as logs from '@aws-cdk/aws-logs'
import * as sns from '@aws-cdk/aws-sns'
import * as subs from '@aws-cdk/aws-sns-subscriptions'
import { LambdaDestination } from '@aws-cdk/aws-logs-destinations'

import { PROJECT_NAMESPACE } from 'src/constants'
import defaultLambdaInput from 'src/common/defaultLambdaInput'
import env from 'src/lib/buildEnv'

const SERVICE_PATHNAME = __dirname.split('/').pop() ?? ''

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
  // Create generalLogTopic for subscription to lambda error logs
  const generalLogTopic = new sns.Topic(scope, 'GeneralLog', {
    displayName: `${PROJECT_NAMESPACE} - General Log`,
  })
  // Create email subscription
  generalLogTopic.addSubscription(
    new subs.EmailSubscription(env.values.GENERAL_LOG_SUBSCRIPTION_EMAIL)
  )
  return generalLogTopic
}

interface Handlers {
  notifyErrorLog: lambda.Function;
  mockErrorLog: lambda.Function;
}
const constructLambdas = (
  scope: cdk.Construct,
  role: iam.Role,
  servicePathname: string,
  generalLogTopic: sns.Topic,
): Handlers => {
  // Common input for lambda Definition
  const defaultInput = {
    ...defaultLambdaInput,
    code: lambda.Code.fromAsset(`bundles/${servicePathname}/handlers`),
    role,
  }
  /** Error log handler */
  const notifyErrorLogHandler = new lambda.Function(scope, 'LoggingNotifyErrorLog', {
    ...defaultInput,
    handler: 'notifyErrorLog.handler',
    environment: { SNS_ARN: generalLogTopic.topicArn },
  })
  // Grant SNS publish permission
  generalLogTopic.grantPublish(notifyErrorLogHandler)

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
    const id = `LambdaErrorLogsSubscription${i}}`
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
  const generalLogTopic = constructSNSTopics(scope)
  const handlers = constructLambdas(scope, role, SERVICE_PATHNAME, generalLogTopic)
  constructSubscriptions(scope, handlers, logGroups)
}

const logging = { construct } as const
export default logging