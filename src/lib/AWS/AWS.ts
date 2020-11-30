/**
 * Script to configure and export AWS sdk instance
 */
import AWS = require('aws-sdk')
import env from '../env'

// Update configs
AWS.config.update({ region: env.values.AWS_RUNTIME_REGION })

export default AWS