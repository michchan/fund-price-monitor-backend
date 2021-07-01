import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import * as iam from '@aws-cdk/aws-iam'

import defaultLambdaInput from '../../../common/defaultLambdaInput'

export interface Handlers {
  listSingleFundRecords: lambda.Function;
  listCompanyRecords: lambda.Function;
  listCompanySinglePeriodRates: lambda.Function;
  searchRecords: lambda.Function;
  listQuarters: lambda.Function;
  listCompanies: lambda.Function;
}
const constructLamdas = (
  scope: cdk.Construct,
  role: iam.Role,
  servicePathname: string
): Handlers => {
  // Common input for lambda Definition
  const defaultInput = {
    ...defaultLambdaInput,
    code: lambda.Code.fromAsset(`bundles/${servicePathname}/handlers`),
    role,
  }

  const listSingleFundRecordsHandler = new lambda.Function(scope, 'ApiListSingleFundRecords', {
    ...defaultInput,
    handler: 'listSingleFundRecords.handler',
  })
  const listComRecordsHandler = new lambda.Function(scope, 'ApiListCompanyRecords', {
    ...defaultInput,
    handler: 'listCompanyRecords.handler',
  })
  const listComSinglePeriodRatesHandler = new lambda.Function(scope, 'ApiListCompanySinglePeriodRates', {
    ...defaultInput,
    handler: 'listCompanySinglePeriodRates.handler',
  })
  const searchRecordsHandler = new lambda.Function(scope, 'ApiSearchRecords', {
    ...defaultInput,
    handler: 'searchRecords.handler',
  })
  const listQuartersHandler = new lambda.Function(scope, 'ApiListQuarters', {
    ...defaultInput,
    handler: 'listQuarters.handler',
  })
  const listCompaniesHandler = new lambda.Function(scope, 'ApiListCompanies', {
    ...defaultInput,
    handler: 'listCompanies.handler',
  })

  return {
    listSingleFundRecords: listSingleFundRecordsHandler,
    listCompanyRecords: listComRecordsHandler,
    listCompanySinglePeriodRates: listComSinglePeriodRatesHandler,
    searchRecords: searchRecordsHandler,
    listQuarters: listQuartersHandler,
    listCompanies: listCompaniesHandler,
  }
}
export default constructLamdas