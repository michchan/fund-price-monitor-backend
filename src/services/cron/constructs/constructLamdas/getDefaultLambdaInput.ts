import * as lambda from '@aws-cdk/aws-lambda'
import * as iam from '@aws-cdk/aws-iam'
import defaultLambdaInput from 'src/common/defaultLambdaInput'

export type Output =
  typeof defaultLambdaInput
  & Pick<lambda.FunctionProps, 'code' | 'memorySize' | 'role'>

// Common input for lambda Definition
const getDefaultLambdaInput = (role: iam.Role, servicePathname: string): Output => {
  const MEMORY_SIZE_MB = 250
  return {
    ...defaultLambdaInput,
    code: lambda.Code.fromAsset(`bundles/${servicePathname}/handlers`),
    memorySize: MEMORY_SIZE_MB,
    role,
  }
}
export default getDefaultLambdaInput