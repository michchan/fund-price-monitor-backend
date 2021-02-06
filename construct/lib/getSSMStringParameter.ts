import * as cdk from '@aws-cdk/core'
import * as ssm from '@aws-cdk/aws-ssm'

const getSSMStringParameter = (
  scope: cdk.Construct,
  id: string,
  parameterName: string
): string => (
  ssm.StringParameter
    .fromStringParameterAttributes(scope, id, {
      parameterName,
      // 'version' can be specified but is optional.
    }).stringValue
)
export default getSSMStringParameter