import * as cdk from '@aws-cdk/core'
import * as ssm from '@aws-cdk/aws-ssm'

import env from 'src/lib/env'
import constructIamRole from './constructs/constructIamRole'
import constructLamdas, { Handlers } from './constructs/constructLamdas'
import constructEventRules from './constructs/constructEventRules'

const getSecrets = (scope: cdk.Construct) => {
  // Retrieve the telegram notification channel's chat ID
  const telegramChatId = ssm.StringParameter
    .fromStringParameterAttributes(scope, 'TelegramChatID', {
      parameterName: env.values.TELEGRAM_CHAT_ID_PARAMETER_NAME,
      // 'version' can be specified but is optional.
    }).stringValue
  return { telegramChatId }
}

export interface ReturnType {
  handlers: Handlers;
}
function construct (scope: cdk.Construct): ReturnType {
  const role = constructIamRole(scope)
  // Get non-secure string paramters from parameter store
  const { telegramChatId } = getSecrets(scope)
  const handlers = constructLamdas(scope, role, telegramChatId)
  constructEventRules(scope, handlers)
  return { handlers }
}

const cron = { construct } as const
export default cron