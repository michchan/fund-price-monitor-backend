import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import env from 'src/lib/buildEnv'
import getDefaultLambdaInput from './getDefaultLambdaInput'

const { TELEGRAM_BOT_API_KEY_PARAMETER_NAME } = env.values
// Common environment variables for notification handling
const getDefaultNotifierEnv = (telegramChatId: string) => ({
  TELEGRAM_CHAT_ID: telegramChatId,
  TELEGRAM_BOT_API_KEY_PARAMETER_NAME,
})

export interface NotificationHandlers {
  notifyOnUpdate: lambda.Function;
  notifyMonthly: lambda.Function;
  notifyQuarterly: lambda.Function;
}
const constructNotificationHandlers = (
  scope: cdk.Construct,
  defaultInput: ReturnType<typeof getDefaultLambdaInput> & lambda.FunctionOptions,
  telegramChatId: string,
): NotificationHandlers => {
  const environment = getDefaultNotifierEnv(telegramChatId)

  const notifyOnUpdateHandler = new lambda.Function(scope, 'CronNotifierOnUpdate', {
    ...defaultInput,
    handler: 'notifyOnUpdate.handler',
    environment,
  })
  const notifyMonthlyHandler = new lambda.Function(scope, 'CronNotifierMonthly', {
    ...defaultInput,
    handler: 'notifyMonthly.handler',
    environment,
  })
  const notifyQuarterlyHandler = new lambda.Function(scope, 'CronNotifierQuarterly', {
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
export default constructNotificationHandlers