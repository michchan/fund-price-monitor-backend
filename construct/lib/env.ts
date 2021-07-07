import composeEnv, { EnvValues as EV } from 'simply-utils/dist/utils/composeEnv'

const keys = [
  'AWS_DEFAULT_REGION',
  'GENERAL_LOG_SUBSCRIPTION_EMAIL',
  'TELEGRAM_BOT_API_KEY_PARAMETER_NAME',
  'TELEGRAM_CHAT_ID_PARAMETER_NAME',
  'TELEGRAM_TEST_CHAT_ID_PARAMETER_NAME',
] as const
export interface EnvValues extends EV<typeof keys[number]> {}
export default composeEnv(keys)