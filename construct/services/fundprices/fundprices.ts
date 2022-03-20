import { Construct } from 'constructs'

import constructIamRole from './constructs/constructIamRole'
import constructLamdas, { Handlers } from './constructs/constructLambdas'
import constructApiGateway from './constructs/constructApiGateway'

const SERVICE_PATHNAME = 'fundprices'

export interface Output {
  handlers: Handlers;
}

function construct (scope: Construct): Output {
  const role = constructIamRole(scope)
  const handlers = constructLamdas(scope, role, SERVICE_PATHNAME)
  constructApiGateway(scope, handlers)
  return { handlers }
}

const fundprices = { construct } as const
export default fundprices