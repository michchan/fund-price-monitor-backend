import composeEnv, { EnvValues as EV } from 'simply-utils/dist/devOps/composeEnv'

const keys = [
  'TELEGRAM_BOT_API_KEY_PARAMETER_NAME',
  'TELEGRAM_BOT_API_KEY_PARAMETER_VERSION',
  'TELEGRAM_CHAT_ID_PARAMETER_NAME',
  'TELEGRAM_TEST_CHAT_ID_PARAMETER_NAME',
  'GENERAL_LOG_SUBSCRIPTION_EMAIL',
  'API_KEY_DEV',
  'API_KEY_DEFAULT_PUBLIC_ACCESS',
  'AWS_DEFAULT_REGION',
] as const
export interface EnvValues extends EV<typeof keys[number]> {}
export default composeEnv(keys)