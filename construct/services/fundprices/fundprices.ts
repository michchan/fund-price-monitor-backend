import * as cdk from '@aws-cdk/core'

import constructIamRoles from './constructs/constructIamRoles'
import constructLamdas, { Handlers } from './constructs/constructLambdas'
import constructApiGateway from './constructs/constructApiGateway'

const SERVICE_PATHNAME = 'fundprices'

export interface Output {
  handlers: Handlers;
}

function construct (scope: cdk.Construct): Output {
  const { lambdaRole, apiRole } = constructIamRoles(scope)
  const handlers = constructLamdas(scope, lambdaRole, SERVICE_PATHNAME)
  constructApiGateway(scope, apiRole, handlers)
  return { handlers }
}

const fundprices = { construct } as const
export default fundprices