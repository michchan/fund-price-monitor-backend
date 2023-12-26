import composeEnv, { EnvValues as EV } from 'simply-utils/utils/composeEnv'

const keys = [
  'AWS_RUNTIME_REGION',
  'API_CORS_WHITELIST',
  'DEPLOYMENT_GITHUB_ACCESS_TOKEN',
  'DEPLOYMENT_GITHUB_OWNER',
  'DEPLOYMENT_GITHUB_REPO',
  'DEPLOYMENT_GITHUB_WORKFLOW_ID',
  'DEPLOYMENT_GITHUB_WORKFLOW_REF',
] as const
export interface EnvValues extends EV<typeof keys[number]> {}
export default composeEnv(keys)