import * as cdk from '@aws-cdk/core'
import {
  LambdaIntegration,
  Resource,
  RestApi,
} from '@aws-cdk/aws-apigateway'
import { Handlers } from './constructLambdas'
import addCorsOptions from './addCorsOptions'

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

const intergrateResourcesHandlers = (resources: Resources, handlers: Handlers): void => {
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

  // Add methods
  singleFundRecords.addMethod('GET', listSingleFundRecordsIntegration)
  quarterrates.addMethod('GET', listQuartersIntegration)
  searchedMpfRecords.addMethod('GET', searchRecordsIntegration)
  comRecords.addMethod('GET', listComRecordsIntegration)
  weekRateSingle.addMethod('GET', listComSinglePeriodRatesIntegration)
  monthRateSingle.addMethod('GET', listComSinglePeriodRatesIntegration)
  quarterRateSingle.addMethod('GET', listComSinglePeriodRatesIntegration)

  // Add CORS options
  addCorsOptions(comRecords)
  addCorsOptions(singleFundRecords)
  addCorsOptions(weekRates)
  addCorsOptions(monthRates)
  addCorsOptions(quarterRates)
}

const constructApiGateway = (scope: cdk.Construct, handlers: Handlers): void => {
  const api = new RestApi(scope, 'MPFFundPricesApi', {
    restApiName: 'MPF Fund Prices Service',
  })
  const resources = constructEndpoints(api)
  intergrateResourcesHandlers(resources, handlers)
}
export default constructApiGateway