import { Construct } from 'constructs'
import { aws_ssm as ssm } from 'aws-cdk-lib'

const getSSMStringParameter = (
  scope: Construct,
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