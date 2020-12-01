import composeEnv, { EnvValues as EV } from 'simply-utils/dist/devOps/composeEnv'

const keys = [
  'AWS_RUNTIME_REGION',
] as const
export interface EnvValues extends EV<typeof keys[number]> {}
export default composeEnv(keys)