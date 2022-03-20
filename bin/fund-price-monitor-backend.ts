#!/usr/bin/env node
import 'source-map-support/register'
import { App } from 'aws-cdk-lib'
import { FundPriceMonitorBackendStack } from '../construct/fund-price-monitor-backend-stack'

const app = new App()
new FundPriceMonitorBackendStack(app, 'FundPriceMonitorBackendStack')