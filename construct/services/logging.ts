import { Construct } from 'constructs'
import { aws_iam as iam, aws_lambda as lambda } from 'aws-cdk-lib'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions'
import { LambdaDestination } from 'aws-cdk-lib/aws-logs-destinations'

import { PROJECT_NAMESPACE } from '../constants'
import defaultLambdaInput from '../common/defaultLambdaInput'
import env from '../lib/env'

const SERVICE_PATHNAME = 'logging'
const ROLE_ID = 'SubsRole'
const commonIamStatementInput = {
  resources: ['*'],
  effect: iam.Effect.ALLOW,
}

const NUM_LOG_GROUP_PER_HANDLER = 10

const constructIamRole = (scope: Construct) => {
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

const constructSNSTopics = (scope: Construct) => {
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
  notifyErrorLogHandlers: lambda.Function[];
  mockErrorLog: lambda.Function;
}
interface ConstructLambdasOptions {
  scope: Construct;
  role: iam.Role;
  servicePathname: string;
  generalLogTopic: sns.Topic;
  numLogGroups: number;
}
const constructLambdas = ({
  scope,
  role,
  servicePathname,
  generalLogTopic,
  numLogGroups,
}: ConstructLambdasOptions): Handlers => {
  // Common input for lambda Definition
  const defaultInput = {
    ...defaultLambdaInput,
    code: lambda.Code.fromAsset(`bundles/${servicePathname}/handlers`),
    role,
  }

  /**
   * Error log handlers.
   */
  const notifyErrorLogHandlers = Array(Math.ceil(numLogGroups / NUM_LOG_GROUP_PER_HANDLER))
    .fill(null)
    .map((v, i) => new lambda.Function(scope, `LoggingNotifyErrorLog${i}`, {
      ...defaultInput,
      handler: 'notifyErrorLog.handler',
      environment: { SNS_TOPIC_ARN: generalLogTopic.topicArn },
    }))

  // Grant SNS publish permission
  notifyErrorLogHandlers.forEach(handler => generalLogTopic.grantPublish(handler))

  /** Mock error logs handler */
  const mockErrorLogHandler = new lambda.Function(scope, 'LoggingMockErrorLog', {
    ...defaultInput,
    handler: 'mockErrorLog.handler',
  })

  return {
    notifyErrorLogHandlers,
    mockErrorLog: mockErrorLogHandler,
  }
}

const constructSubscriptions = (
  scope: Construct,
  { notifyErrorLogHandlers }: Handlers,
  logGroups: logs.ILogGroup[],
) => {
  notifyErrorLogHandlers.forEach((notifyErrorLog, index) => {
    // Create lambda subscription destination
    const subsDestination = new LambdaDestination(notifyErrorLog)
    // Create filter pattern
    const subsFilterPattern = logs.FilterPattern.anyTerm('ERROR', 'WARN')

    const logGroupStartIndex = index * NUM_LOG_GROUP_PER_HANDLER
    const logGroupEndIndexExclusive = logGroupStartIndex + NUM_LOG_GROUP_PER_HANDLER

    // Create subscription filters for each log group
    logGroups
      .slice(logGroupStartIndex, logGroupEndIndexExclusive)
      .forEach((logGroup, i) => {
        const id = `LambdaErrLogsFilterF${index}G${i}`
        return new logs.SubscriptionFilter(scope, id, {
          logGroup,
          destination: subsDestination,
          filterPattern: subsFilterPattern,
        })
      })
  })
}

export interface ReturnType {
  handlers: Handlers;
}
export interface InitOptions {
  logGroups: logs.ILogGroup[];
}
/**
 * Reference: https://aws.amazon.com/blogs/mt/get-notified-specific-lambda-function-error-patterns-using-cloudwatch/
 */
function construct (scope: Construct, options: InitOptions): ReturnType {
  const { logGroups } = options

  const role = constructIamRole(scope)
  const generalLogTopic = constructSNSTopics(scope)
  const handlers = constructLambdas({
    scope,
    role,
    servicePathname: SERVICE_PATHNAME,
    generalLogTopic,
    numLogGroups: logGroups.length,
  })
  constructSubscriptions(scope, handlers, logGroups)

  return { handlers }
}

const logging = { construct } as const
export default logging