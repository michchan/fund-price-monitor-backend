import * as cdk from '@aws-cdk/core'
import {
  LambdaIntegration,
  Method,
  Resource,
  RestApi,
} from '@aws-cdk/aws-apigateway'
import { ServicePrincipal } from '@aws-cdk/aws-iam'
import { Handlers } from './constructLambdas'
import addCorsOptions from './addCorsOptions'
import env from '../../../lib/env'

interface Resources {
  quarters: Resource;
  companies: Resource;
  singleFundRecords: Resource;
  searchedMpfRecords: Resource;
  comRecords: Resource;
  weekRates: Resource;
  weekRateSingle: Resource;
  monthRates: Resource;
  monthRateSingle: Resource;
  quarterRates: Resource;
  quarterRateSingle: Resource;
}
const constructEndpoints = (api: RestApi): Resources => {
  // Add records path
  // /fundprices
  const funds = api.root.addResource('fundprices')
  // /fundprices/mpf
  const mpfFunds = funds.addResource('mpf')
  // /fundprices/mpf/quarters
  const quarters = mpfFunds.addResource('quarters')
  // /fundprices/mpf/companies
  const companies = mpfFunds.addResource('companies')
  // /fundprices/mpf/search
  const searchedMpfRecords = mpfFunds.addResource('search')
  // /fundprices/mpf/{company}
  const comRecords = mpfFunds.addResource('{company}')
  // /fundprices/mpf/{company}/{code}
  const singleFundRecords = comRecords.addResource('{code}')

  // /fundprices/mpf/{company}/weekrates
  const weekRates = comRecords.addResource('weekrates')
  // /fundprices/mpf/{company}/weekrates/{week}
  const weekRateSingle = weekRates.addResource('{week}')

  // /fundprices/mpf/{company}/monthrates
  const monthRates = comRecords.addResource('monthrates')
  // /fundprices/mpf/{company}/monthrates/{month}
  const monthRateSingle = monthRates.addResource('{month}')

  // /fundprices/mpf/{company}/quarterrates
  const quarterRates = comRecords.addResource('quarterrates')
  // /fundprices/mpf/{company}/quarterrates/{quarter}
  const quarterRateSingle = quarterRates.addResource('{quarter}')

  return {
    quarters,
    companies,
    singleFundRecords,
    searchedMpfRecords,
    comRecords,
    weekRates,
    weekRateSingle,
    monthRates,
    monthRateSingle,
    quarterRates,
    quarterRateSingle,
  }
}

const DEFAULT_METHOD_OPTIONS = { apiKeyRequired: true }
const integrateResourcesHandlers = (resources: Resources, handlers: Handlers): Method[] => {
  const {
    quarters,
    companies,
    singleFundRecords,
    searchedMpfRecords,
    comRecords,
    weekRateSingle,
    monthRateSingle,
    quarterRateSingle,
  } = resources
  const {
    listSingleFundRecords,
    listCompanyRecords,
    listCompanySinglePeriodRates,
    searchRecords,
    listQuarters,
    listCompanies,
  } = handlers

  // Integrations
  const listSingleFundRecordsIntegration = new LambdaIntegration(listSingleFundRecords)
  const listComRecordsIntegration = new LambdaIntegration(listCompanyRecords)
  const listComSinglePeriodRatesIntegration = new LambdaIntegration(listCompanySinglePeriodRates)
  const searchRecordsIntegration = new LambdaIntegration(searchRecords)
  const listQuartersIntegration = new LambdaIntegration(listQuarters)
  const listCompaniesIntegration = new LambdaIntegration(listCompanies)

  // Add CORS options
  const optionsMethods = Object
    .values(resources)
    .map((resource: Resource) => addCorsOptions(resource))

  return [
    ...optionsMethods,
    quarters.addMethod('GET', listQuartersIntegration, DEFAULT_METHOD_OPTIONS),
    companies.addMethod('GET', listCompaniesIntegration, DEFAULT_METHOD_OPTIONS),
    singleFundRecords.addMethod('GET', listSingleFundRecordsIntegration, DEFAULT_METHOD_OPTIONS),
    searchedMpfRecords.addMethod('GET', searchRecordsIntegration, DEFAULT_METHOD_OPTIONS),
    comRecords.addMethod('GET', listComRecordsIntegration, DEFAULT_METHOD_OPTIONS),
    weekRateSingle.addMethod('GET', listComSinglePeriodRatesIntegration, DEFAULT_METHOD_OPTIONS),
    monthRateSingle.addMethod('GET', listComSinglePeriodRatesIntegration, DEFAULT_METHOD_OPTIONS),
    quarterRateSingle.addMethod('GET', listComSinglePeriodRatesIntegration, DEFAULT_METHOD_OPTIONS),
  ]
}

const grantLambdaInvoke = (
  api: RestApi,
  handlers: Handlers,
): void => {
  const sourceArn = api.arnForExecuteApi('*', '/*')
  Object.values(handlers)
    .forEach((handler: Handlers[keyof Handlers], i) => {
      handler.addPermission(`apigatewayPermission_${i}`, {
        action: 'lambda:InvokeFunction',
        principal: new ServicePrincipal('apigateway.amazonaws.com'),
        sourceArn,
      })
    })
}

const API_ID = 'FundPricesApi'
// @TODO: Move to env?
const THROTTLING_RATE_LIMIT = 1000
const THROTTLING_BURST_LIMIT = 200

const constructApiGateway = (scope: cdk.Construct, handlers: Handlers): void => {
  const api = new RestApi(scope, API_ID, {
    restApiName: 'Fund Prices Service',
    description: 'Services for accessing fund-price resources',
    deployOptions: {
      throttlingRateLimit: THROTTLING_RATE_LIMIT,
      throttlingBurstLimit: THROTTLING_BURST_LIMIT,
    },
  })
  const apiKey = api.addApiKey(`${API_ID}ApiKey`, { value: env.values.API_KEY })
  const plan = api.addUsagePlan(`${API_ID}UsagePlan`)
  plan.addApiKey(apiKey)

  const resources = constructEndpoints(api)
  integrateResourcesHandlers(resources, handlers)
  grantLambdaInvoke(api, handlers)
}
export default constructApiGateway