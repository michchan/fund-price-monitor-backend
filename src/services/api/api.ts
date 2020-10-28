import * as cdk from '@aws-cdk/core'

import constructIamRole from './constructs/constructIamRole'
import constructLamdas, { Handlers } from './constructs/constructLambdas'
import constructApiGateway from './constructs/constructApiGateway'

const SERVICE_PATHNAME = __dirname.split('/').pop() ?? ''

export interface ReturnType {
  handlers: Handlers;
}

function construct (scope: cdk.Construct): ReturnType {
  const role = constructIamRole(scope)
  const handlers = constructLamdas(scope, role, SERVICE_PATHNAME)
  constructApiGateway(scope, handlers)
  return { handlers }
}

const api = { construct } as const
export default api