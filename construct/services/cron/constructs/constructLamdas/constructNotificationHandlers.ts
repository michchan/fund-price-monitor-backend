import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import env from '../../../../lib/env'
import getDefaultLambdaInput from './getDefaultLambdaInput'

const { TELEGRAM_BOT_API_KEY_PARAMETER_NAME } = env.values
// Common environment variables for notification handling
const getDefaultNotifierEnv = (telegramChatId: string) => ({
  TELEGRAM_CHAT_ID: telegramChatId,
  TELEGRAM_BOT_API_KEY_PARAMETER_NAME,
})

export interface NotificationGenericHandlers {
  notifyOnUpdate: lambda.Function;
  notifyMonthly: lambda.Function;
  notifyQuarterly: lambda.Function;
}
const createHandlers = (
  scope: cdk.Construct,
  idPrefix: string,
  defaultInput: ReturnType<typeof getDefaultLambdaInput> & lambda.FunctionOptions,
  environment: lambda.FunctionOptions['environment'],
): NotificationGenericHandlers => {
  const notifyOnUpdateHandler = new lambda.Function(scope, `${idPrefix}OnUpdate`, {
    ...defaultInput,
    handler: 'notifyOnUpdate.handler',
    environment,
  })
  const notifyMonthlyHandler = new lambda.Function(scope, `${idPrefix}Monthly`, {
    ...defaultInput,
    handler: 'notifyMonthly.handler',
    environment,
  })
  const notifyQuarterlyHandler = new lambda.Function(scope, `${idPrefix}Quarterly`, {
    ...defaultInput,
    handler: 'notifyQuarterly.handler',
    environment,
  })

  return {
    notifyOnUpdate: notifyOnUpdateHandler,
    notifyMonthly: notifyMonthlyHandler,
    notifyQuarterly: notifyQuarterlyHandler,
  }
}

export interface NotificationHandlers {
  notifyOnUpdate: lambda.Function;
  notifyMonthly: lambda.Function;
  notifyQuarterly: lambda.Function;
  testNotifyOnUpdate: lambda.Function;
  testNotifyMonthly: lambda.Function;
  testNotifyQuarterly: lambda.Function;
}

const constructNotificationHandlers = (
  scope: cdk.Construct,
  defaultInput: ReturnType<typeof getDefaultLambdaInput> & lambda.FunctionOptions,
  telegramChatId: string,
  telegramTestChatId: string,
): NotificationHandlers => {
  const environment = getDefaultNotifierEnv(telegramChatId)
  const testEnvironment = getDefaultNotifierEnv(telegramTestChatId)

  const handlers = createHandlers(scope, 'CronNotifier', defaultInput, environment)
  const testHandlers = createHandlers(scope, 'CronTestNotifier', defaultInput, testEnvironment)

  return {
    ...handlers,
    testNotifyOnUpdate: testHandlers.notifyOnUpdate,
    testNotifyMonthly: testHandlers.notifyMonthly,
    testNotifyQuarterly: testHandlers.notifyQuarterly,
  }
}
export default constructNotificationHandlers