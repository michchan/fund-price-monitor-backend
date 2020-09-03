/**
 * Script to configure and export AWS sdk instance
 */
import AWS = require('aws-sdk');

// Update configs
AWS.config.update({ region: 'ap-east-1' })

export default AWS