import * as cdk from '@aws-cdk/core'

import env from '../../lib/env'
import constructIamRoles from './constructs/constructIamRoles'
import constructLamdas, { Handlers } from './constructs/constructLamdas'
import constructEventRules from './constructs/constructEventRules'
import getSSMStringParameter from '../../lib/getSSMStringParameter'

const SERVICE_DIRNAME = __dirname.replace(/construct/i, 'src')
const SERVICE_PATHNAME = 'cron'

const getSecrets = (scope: cdk.Construct) => {
  // Retrieve the telegram notification channel's chat ID
  const telegramChatId = getSSMStringParameter(
    scope,
    'TelegramChatID',
    env.values.TELEGRAM_CHAT_ID_PARAMETER_NAME
  )
  const telegramTestChatId = getSSMStringParameter(
    scope,
    'TelegramTestChatID',
    env.values.TELEGRAM_TEST_CHAT_ID_PARAMETER_NAME
  )
  return { telegramChatId, telegramTestChatId }
}

export interface Output {
  handlers: Handlers;
}
function construct (scope: cdk.Construct): Output {
  const roles = constructIamRoles(scope)
  // Get non-secure string paramters from parameter store
  const secrets = getSecrets(scope)
  const { handlers, stateMachines } = constructLamdas(scope, roles, {
    servicePathname: SERVICE_PATHNAME,
    serviceDirname: SERVICE_DIRNAME,
    ...secrets,
  })
  constructEventRules(scope, handlers, stateMachines)
  return { handlers }
}

const cron = { construct } as const
export default cron