import pick from 'lodash/pick'

// Config dot env
require('dotenv').config()

export interface EnvValues {
  TELEGRAM_BOT_API_KEY_PARAMETER_NAME: string;
  TELEGRAM_BOT_API_KEY_PARAMETER_VERSION: number;
  TELEGRAM_CHAT_ID_PARAMETER_NAME: string;
  GENERAL_LOG_SUBSCRIPTION_EMAIL: string;
  AWS_DEFAULT_REGION: string;
}

const keys: (keyof EnvValues)[] = [
  'TELEGRAM_BOT_API_KEY_PARAMETER_NAME',
  'TELEGRAM_BOT_API_KEY_PARAMETER_VERSION',
  'TELEGRAM_CHAT_ID_PARAMETER_NAME',
  'GENERAL_LOG_SUBSCRIPTION_EMAIL',
  'AWS_DEFAULT_REGION',
]
const values: EnvValues = pick(process.env, keys) as unknown as EnvValues

/**
 * Throw an error if any of the environment variables is not defined
 */
(() => {
  for (const key of keys) {
    const value = values[key]
    if (value === undefined) throw new Error(`${key} is undefined but required in .env file`)
  }
})()

export default {
  keys,
  values,
} as const