/**
 * Script to configure and export AWS sdk instance
 */
import AWS = require('aws-sdk')
import runtimeEnv from '../runtimeEnv'

// Update configs
AWS.config.update({ region: runtimeEnv.values.AWS_RUNTIME_REGION })

export default AWS