import * as cdk from '@aws-cdk/core'
import {
  LambdaIntegration,
  Method,
  Resource,
  RestApi,
} from '@aws-cdk/aws-apigateway'
import { Handlers } from './constructLambdas'
import addCorsOptions from './addCorsOptions'
import env from '../../../lib/env'

interface Resources {
  singleFundRecords: Resource;
  quarterrates: Resource;
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
  const quarterrates = mpfFunds.addResource('quarters')
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
    singleFundRecords,
    quarterrates,
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

const DEFAULT_PUBLIC_ACCESS_PFX = 'DefaultPublicAccess'
const PLAN_NAME = `${DEFAULT_PUBLIC_ACCESS_PFX}UsagePlan`
const API_KEY_NAME = `${DEFAULT_PUBLIC_ACCESS_PFX}ApiKey`
const RATE_LIMIT = 10
const BURST_LIMIT = 2
const throttle = {
  rateLimit: RATE_LIMIT,
  burstLimit: BURST_LIMIT,
}
const constructRateLimitApiKey = (api: RestApi, methods: Method[]): void => {
  const key = api.addApiKey(API_KEY_NAME, {
    apiKeyName: API_KEY_NAME,
    value: env.values.DEFAULT_PUBLIC_ACCESS_API_KEY_VALUE,
  })
  const plan = api.addUsagePlan(PLAN_NAME, {
    name: PLAN_NAME,
    apiKey: key,
    throttle,
  })
  // Assign each method to plan
  methods.map(method => plan.addApiStage({
    stage: api.deploymentStage,
    throttle: [{ method, throttle }],
  }))
}

const DEFAULT_METHOD_OPTIONS = { apiKeyRequired: true }
const integrateResourcesHandlers = (resources: Resources, handlers: Handlers): Method[] => {
  const {
    singleFundRecords,
    quarterrates,
    searchedMpfRecords,
    comRecords,
    weekRates,
    weekRateSingle,
    monthRates,
    monthRateSingle,
    quarterRates,
    quarterRateSingle,
  } = resources
  const {
    listSingleFundRecords,
    listCompanyRecords,
    listCompanySinglePeriodRates,
    searchRecords,
    listQuarters,
  } = handlers

  // Integrations
  const listSingleFundRecordsIntegration = new LambdaIntegration(listSingleFundRecords)
  const listComRecordsIntegration = new LambdaIntegration(listCompanyRecords)
  const listComSinglePeriodRatesIntegration = new LambdaIntegration(listCompanySinglePeriodRates)
  const searchRecordsIntegration = new LambdaIntegration(searchRecords)
  const listQuartersIntegration = new LambdaIntegration(listQuarters)

  // Add CORS options
  addCorsOptions(comRecords)
  addCorsOptions(singleFundRecords)
  addCorsOptions(weekRates)
  addCorsOptions(monthRates)
  addCorsOptions(quarterRates)

  return [
    singleFundRecords.addMethod('GET', listSingleFundRecordsIntegration, DEFAULT_METHOD_OPTIONS),
    quarterrates.addMethod('GET', listQuartersIntegration, DEFAULT_METHOD_OPTIONS),
    searchedMpfRecords.addMethod('GET', searchRecordsIntegration, DEFAULT_METHOD_OPTIONS),
    comRecords.addMethod('GET', listComRecordsIntegration, DEFAULT_METHOD_OPTIONS),
    weekRateSingle.addMethod('GET', listComSinglePeriodRatesIntegration, DEFAULT_METHOD_OPTIONS),
    monthRateSingle.addMethod('GET', listComSinglePeriodRatesIntegration, DEFAULT_METHOD_OPTIONS),
    quarterRateSingle.addMethod('GET', listComSinglePeriodRatesIntegration, DEFAULT_METHOD_OPTIONS),
  ]
}

const constructApiGateway = (scope: cdk.Construct, handlers: Handlers): void => {
  const api = new RestApi(scope, 'FundPricesApi', {
    restApiName: 'Fund Prices Service',
    description: 'Services for accessing fund-price resources',

  })
  const resources = constructEndpoints(api)
  const methods = integrateResourcesHandlers(resources, handlers)
  constructRateLimitApiKey(api, methods)
}
export default constructApiGateway