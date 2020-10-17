import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'

import cron from './services/cron'
import api from './services/api'
import logging from './services/logging'


export class FundPriceMonitorBackendStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        // Initialize cron service
        const { handlers: cronHandlers } = cron.construct(this)
        // Initialize API service
        const { handlers: apiHandlers } = api.construct(this)

        // Initialize logging service
        logging.construct(this, {
            logGroups: [
                ...Object.values(cronHandlers)
                    .reduce((
                        acc: lambda.Function[], 
                        curr
                    ) => Array.isArray(curr) ? [...acc, ...curr] : [...acc, curr], []), 
                ...Object.values(apiHandlers)
            ]
            .map(lambda => lambda.logGroup),
        })
    }
}
