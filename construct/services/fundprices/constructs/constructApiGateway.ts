import * as cdk from '@aws-cdk/core'
import {
  Deployment,
  LambdaIntegration,
  Method,
  MethodLoggingLevel,
  Resource,
  RestApi,
  Stage,
} from '@aws-cdk/aws-apigateway'
import { ServicePrincipal } from '@aws-cdk/aws-iam'
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

const DEV_STAGE_NAME = 'dev'
const IS_DEV_CACHING_ENABLED = false
const DEV_THROTTLING_RATE_LIMIT = 10000
const DEV_THROTTLING_BURST_LIMIT = 5000

const PROD_STAGE_NAME = 'prod-v1'
const IS_PROD_CACHING_ENABLED = true
const PROD_THROTTLING_RATE_LIMIT = 1000
const PROD_THROTTLING_BURST_LIMIT = 500

interface DeploymentStages {
  dev: Stage;
  prod: Stage;
}
const constructDeploymentStages = (
  scope: cdk.Construct,
  api: RestApi,
): DeploymentStages => {
  const devDeployment = new Deployment(scope, `${DEV_STAGE_NAME}Deployment`, { api })
  const devStage = new Stage(scope, `${DEV_STAGE_NAME}Stage`, {
    stageName: DEV_STAGE_NAME,
    deployment: devDeployment,
    cachingEnabled: IS_DEV_CACHING_ENABLED,
    loggingLevel: MethodLoggingLevel.INFO,
  })

  const prodDeployment = new Deployment(scope, `${PROD_STAGE_NAME}Deployment`, { api })
  const prodStage = new Stage(scope, `${PROD_STAGE_NAME}Stage`, {
    stageName: PROD_STAGE_NAME,
    deployment: prodDeployment,
    cachingEnabled: IS_PROD_CACHING_ENABLED,
    loggingLevel: MethodLoggingLevel.ERROR,
  })

  api.deploymentStage = prodStage
  return {
    dev: devStage,
    prod: prodStage,
  }
}

const constructRateLimitApiKeys = (
  api: RestApi,
  methods: Method[],
  stages: DeploymentStages,
): void => {
  const config = [
    {
      name: 'Dev',
      rateLimit: DEV_THROTTLING_RATE_LIMIT,
      burstLimit: DEV_THROTTLING_BURST_LIMIT,
      apiKeyValue: env.values.API_KEY_DEV,
      stage: stages.dev,
    },
    {
      name: 'DefaultPublicAccess',
      rateLimit: PROD_THROTTLING_RATE_LIMIT,
      burstLimit: PROD_THROTTLING_BURST_LIMIT,
      apiKeyValue: env.values.API_KEY_DEFAULT_PUBLIC_ACCESS,
      stage: stages.prod,
    },
  ]
  config.forEach(({
    name,
    rateLimit,
    burstLimit,
    apiKeyValue,
    stage,
  }) => {
    const apiKeyName = `${name}ApiKey`
    const key = api.addApiKey(apiKeyName, {
      apiKeyName,
      value: apiKeyValue,
    })
    const throttle = { rateLimit, burstLimit }
    const planName = `${name}PlanName`
    const plan = api.addUsagePlan(planName, {
      name: planName,
      apiKey: key,
      throttle,
    })
    // Assign each method to plan
    plan.addApiStage({
      stage,
      throttle: methods.map(method => ({ method, throttle })),
    })
  })
}

const grantLambdaInvoke = (
  api: RestApi,
  stages: DeploymentStages,
  handlers: Handlers,
): void => Object.values(stages).forEach(({ stageName }: Stage, stageIndex) => {
  const sourceArn = api.arnForExecuteApi('*', '/*', stageName)
  Object.values(handlers)
    .forEach((handler: Handlers[keyof Handlers], i) => {
      handler.addPermission(`apigatewayPermission_${stageIndex}_${i}`, {
        action: 'lambda:InvokeFunction',
        principal: new ServicePrincipal('apigateway.amazonaws.com'),
        sourceArn,
      })
    })
})

const API_ID = 'FundPricesApi'
const constructApiGateway = (scope: cdk.Construct, handlers: Handlers): void => {
  const api = new RestApi(scope, API_ID, {
    restApiName: 'Fund Prices Service',
    description: 'Services for accessing fund-price resources',
    // Use self-managed deployments
    deploy: false,
  })
  const resources = constructEndpoints(api)
  const methods = integrateResourcesHandlers(resources, handlers)
  const stages = constructDeploymentStages(scope, api)
  constructRateLimitApiKeys(api, methods, stages)
  grantLambdaInvoke(api, stages, handlers)
}
export default constructApiGateway