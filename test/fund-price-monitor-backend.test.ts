import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert'
import * as cdk from '@aws-cdk/core'
import * as FundPriceMonitorBackend from '../construct/fund-price-monitor-backend-stack'

test('Empty Stack', () => {
  const app = new cdk.App()
  // WHEN
  const stack = new FundPriceMonitorBackend.FundPriceMonitorBackendStack(app, 'MyTestStack')
  // THEN
  expectCDK(stack).to(matchTemplate({
    Resources: {},
  }, MatchStyle.EXACT))
})