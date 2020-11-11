import * as cdk from '@aws-cdk/core'
import * as ssm from '@aws-cdk/aws-ssm'

import env from 'src/lib/buildEnv'
import constructIamRoles from './constructs/constructIamRoles'
import constructLamdas, { Handlers } from './constructs/constructLamdas'
import constructEventRules from './constructs/constructEventRules'

const SERVICE_PATHNAME = __dirname.split('/').pop() ?? ''

const getSecrets = (scope: cdk.Construct) => {
  // Retrieve the telegram notification channel's chat ID
  const telegramChatId = ssm.StringParameter
    .fromStringParameterAttributes(scope, 'TelegramChatID', {
      parameterName: env.values.TELEGRAM_CHAT_ID_PARAMETER_NAME,
      // 'version' can be specified but is optional.
    }).stringValue
  return { telegramChatId }
}

export interface Output {
  handlers: Handlers;
}
function construct (scope: cdk.Construct): Output {
  const roles = constructIamRoles(scope)
  // Get non-secure string paramters from parameter store
  const { telegramChatId } = getSecrets(scope)
  const { handlers, stateMachines } = constructLamdas(scope, roles, {
    servicePathname: SERVICE_PATHNAME,
    serviceDirname: __dirname,
    telegramChatId,
  })
  constructEventRules(scope, handlers, stateMachines)
  return { handlers }
}

const cron = { construct } as const
export default cron