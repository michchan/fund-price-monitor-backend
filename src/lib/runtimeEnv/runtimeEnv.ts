import pick from 'lodash/pick'

// Config dot env
require('dotenv').config()

export interface EnvValues {
  AWS_DEFAULT_REGION: string;
}

const keys: (keyof EnvValues)[] = [
  'AWS_DEFAULT_REGION',
]
const values: EnvValues = pick(process.env, keys) as unknown as EnvValues

/**
 * Throw an error if any of the environment variables is not defined
 */
(() => {
  for (const key of keys) {
    const value = values[key]
    if (value === undefined) throw new Error(`${key} is undefined but required in environment`)
  }
})()

export default {
  keys,
  values,
} as const