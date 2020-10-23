import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import * as iam from '@aws-cdk/aws-iam'

import defaultLambdaInput from 'src/common/defaultLambdaInput'

const DIRNAME = __dirname.split('/').pop()

export interface Handlers {
  listSingleFundRecords: lambda.Function;
  listCompanyRecords: lambda.Function;
  listCompanySinglePeriodRates: lambda.Function;
  searchRecords: lambda.Function;
  listQuarters: lambda.Function;
}
const constructLamdas = (scope: cdk.Construct, role: iam.Role): Handlers => {
  // Common input for lambda Definition
  const commonLambdaInput = {
    ...defaultLambdaInput,
    code: lambda.Code.fromAsset(`bundles/${DIRNAME}/handlers`),
    role,
  }

  const listSingleFundRecordsHandler = new lambda.Function(scope, 'ApiListSingleFundRecords', {
    ...commonLambdaInput,
    handler: 'listSingleFundRecords.handler',
  })
  const listComRecordsHandler = new lambda.Function(scope, 'ApiListCompanyRecords', {
    ...commonLambdaInput,
    handler: 'listCompanyRecords.handler',
  })
  const listComSinglePeriodRatesHandler = new lambda.Function(scope, 'ApiListCompanySinglePeriodRates', {
    ...commonLambdaInput,
    handler: 'listCompanySinglePeriodRates.handler',
  })
  const searchRecordsHandler = new lambda.Function(scope, 'ApiSearchRecords', {
    ...commonLambdaInput,
    handler: 'searchRecords.handler',
  })
  const listQuartersHandler = new lambda.Function(scope, 'ApiListQuarters', {
    ...commonLambdaInput,
    handler: 'listQuarters.handler',
  })

  return {
    listSingleFundRecords: listSingleFundRecordsHandler,
    listCompanyRecords: listComRecordsHandler,
    listCompanySinglePeriodRates: listComSinglePeriodRatesHandler,
    searchRecords: searchRecordsHandler,
    listQuarters: listQuartersHandler,
  }
}
export default constructLamdas